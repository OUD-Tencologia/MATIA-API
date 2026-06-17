import axios from 'axios'
import FormData from 'form-data'
import { UserRepository } from '../repositories/UserRepository.js'
import { CompanyRepository } from '../repositories/CompanyRepository.js'
import { LlmConfigRepository } from '../repositories/LlmConfigRepository.js'
import { ChatRepository } from '../repositories/ChatRepository.js'
import { DocumentRepository } from '../repositories/DocumentRepository.js'
import { MinioService    } from "../services/Minioservice.js";
import { UserNotFoundError, InternalServerError, DocumentNotFoundError } from '../errors/errors.js'
import type { UploadDocumentDTO, AskDocumentDTO, UploadDocumentResponseDTO, AskDocumentResponseDTO } from '../dtos/DocumentDTO.js'
import * as http from 'node:http'
import * as https from 'node:https'

const RAG_BASE_URL = 'http://103.204.193.6:4001'

const httpAgents = {
    httpAgent: new http.Agent({ keepAlive: true }),
    httpsAgent: new https.Agent({ keepAlive: true }),
}

export class DocumentService {

    // ─────────────────────────────────────────────
    // CRUD base
    // ─────────────────────────────────────────────
    static async create(payload: any) {
        const created = await DocumentRepository.create(payload)
        return created.toJSON()
    }

    static async findById(id: string) {
        const item = await DocumentRepository.findById(id)
        if (!item) throw new DocumentNotFoundError()
        return item.toJSON()
    }

    static async findAll() {
        const items = await DocumentRepository.findAll()
        return items.map((i: any) => i.toJSON())
    }

    static async update(id: string, payload: any) {
        const updatedRows = await DocumentRepository.update(id, payload)
        if (updatedRows === 0) throw new DocumentNotFoundError()
        const updated = await DocumentRepository.findById(id)
        return updated?.toJSON()
    }

    static async delete(id: string) {
        const deleted = await DocumentRepository.delete(id)
        if (deleted === 0) throw new DocumentNotFoundError()
        return true
    }

    // ─────────────────────────────────────────────
    // 1. UPLOAD DE DOCUMENTO
    // 1a. Salva no MinIO
    // 1b. Envia ao RAG para indexação
    // 1c. Salva referências no banco
    // ─────────────────────────────────────────────
    static async uploadDocumento(
        fileBuffer: Buffer,
        originalName: string,
        mimeType: string,
        fileSize: number,
        dto: UploadDocumentDTO,
        userId: string
    ): Promise<UploadDocumentResponseDTO> {
        try {
            // 1. Validar usuário
            const user = await UserRepository.findByIdForAuth(userId)
            if (!user) throw new UserNotFoundError(userId)

            const rawUser = user.get ? user.get({ plain: true }) : user
            const role = rawUser.role
            let companyId = rawUser.empresa_id

            // 2. Validar empresa
            if (role !== 'SUPER-ADMIN') {
                if (!companyId) throw new Error('Usuário não possui uma empresa vinculada.')
                const company = await CompanyRepository.findById(companyId)
                if (!company) throw new Error('Empresa vinculada ao usuário não encontrada.')
                const rawCompany = company.get ? company.get({ plain: true }) : company
                if (rawCompany.active === false) throw new Error('O acesso desta empresa está suspenso.')
            } else {
                companyId = null
            }

            // 3. Salvar no MinIO
            const minioPath = await MinioService.uploadBuffer(fileBuffer, originalName, mimeType, userId, companyId)
            console.log(`[DocumentService] Arquivo salvo no MinIO: ${minioPath}`)

            // 4. Enviar ao RAG para indexação
            const form = new FormData()
            form.append('file', fileBuffer, { filename: originalName, contentType: mimeType })
            form.append('company_id', companyId || 'matia-super-admin')
            form.append('user_id', userId)
            form.append('title', originalName)

            const ragResponse = await axios.post(`${RAG_BASE_URL}/documents/upload`, form, {
                headers: {
                    ...form.getHeaders(),
                    'X-API-Key': process.env['MATIA_RAG_API_KEY'],
                },
                proxy: false,
                ...httpAgents,
            })

            const ragData = ragResponse.data
            const ragDocumentId: string = ragData.document_id

            // 5. Salvar no banco com o caminho do MinIO como storage_path
            const { documentoId, conversationId } = await DocumentRepository.salvarDocumento(
                userId,
                companyId,
                ragDocumentId,
                originalName,
                mimeType,
                fileSize,
                dto.conversation_id || null,
                minioPath // passa o caminho do MinIO
            )

            console.log(`[DocumentService] Documento indexado. RAG ID: ${ragDocumentId}, MinIO: ${minioPath}, Conversa: ${conversationId}`)

            return {
                document_id: documentoId,
                rag_document_id: ragDocumentId,
                filename: ragData.filename,
                status: ragData.status,
                chunks_created: ragData.chunks_created,
                conversation_id: conversationId,
                usage: {
                    embedding: {
                        total_tokens: ragData.metadata?.usage?.embedding?.total_tokens || 0,
                    },
                },
                cost: {
                    total: {
                        brl: ragData.metadata?.cost?.total?.brl || 0,
                        usd: ragData.metadata?.cost?.total?.usd || 0,
                    },
                },
            }

        } catch (error: any) {
            if (error.response) {
                console.error(`[DocumentService] Erro do RAG no upload (${error.response.status}):`, JSON.stringify(error.response.data))
            } else {
                console.error('[DocumentService] Falha no upload:', error.message || error)
            }
            throw new InternalServerError('Não foi possível processar o documento neste momento.', { originalError: error.message })
        }
    }

    // ─────────────────────────────────────────────
    // 2. PERGUNTA SOBRE DOCUMENTO(S)
    // ─────────────────────────────────────────────
    static async askDocumento(
        dto: AskDocumentDTO,
        userId: string
    ): Promise<AskDocumentResponseDTO> {
        try {
            // 1. Validar usuário
            const user = await UserRepository.findByIdForAuth(userId)
            if (!user) throw new UserNotFoundError(userId)

            const rawUser = user.get ? user.get({ plain: true }) : user
            const role = rawUser.role
            let companyId = rawUser.empresa_id

            // 2. Validar empresa
            if (role !== 'SUPER-ADMIN') {
                if (!companyId) throw new Error('Usuário não possui uma empresa vinculada.')
                const company = await CompanyRepository.findById(companyId)
                if (!company) throw new Error('Empresa vinculada ao usuário não encontrada.')
                const rawCompany = company.get ? company.get({ plain: true }) : company
                if (rawCompany.active === false) throw new Error('O acesso desta empresa está suspenso.')
            } else {
                companyId = null
            }

            // 3. Buscar configuração de IA
            const config = await LlmConfigRepository.findPadrao()
            if (!config) throw new Error('Nenhuma configuração de IA ativa encontrada.')

            // 4. Buscar rag_document_ids validando ownership
            const ragDocumentIds = await DocumentRepository.buscarRagDocumentIdsPorConversa(dto.conversation_id, userId)

            if (ragDocumentIds === null) {
                throw Object.assign(new Error('Conversa não encontrada ou acesso negado.'), { statusCode: 403 })
            }

            if (!ragDocumentIds.length) {
                throw new Error('Nenhum documento encontrado nesta conversa para responder a pergunta.')
            }

            // 5. Salvar pergunta no banco
            await ChatRepository.salvarMensagemTexto(userId, companyId, dto.question, dto.conversation_id)

            // 6. Chamar o RAG
            const ragResponse = await axios.post(`${RAG_BASE_URL}/documents/ask`, {
                question: dto.question,
                company_id: companyId || 'matia-super-admin',
                document_ids: ragDocumentIds,
                include_sources: true,
                top_k: 6,
                ia: config.ia,
                ia_model: config.ia_model,
                client_api_key: config.api_key,
                response_style: dto.response_style || 'equilibrada',
            }, {
                headers: {
                    'X-API-Key': process.env['MATIA_RAG_API_KEY'],
                    'Content-Type': 'application/json',
                },
                proxy: false,
                ...httpAgents,
            })

            const data = ragResponse.data

            // 7. Salvar resposta da IA
            await ChatRepository.salvarMensagemIA(dto.conversation_id, data.answer, config.ia_model)

            // 8. Atualizar estatísticas
            try {
                await UserRepository.updateStats(
                    userId,
                    data.metadata?.usage?.llm?.total_tokens || 0,
                    data.metadata?.cost?.total?.brl || 0
                )
            } catch (statsError) {
                console.error(`[DocumentService] Erro ao atualizar estatísticas:`, statsError)
            }

            return {
                answer: data.answer,
                conversation_id: dto.conversation_id,
                sources: data.sources || [],
                confidence: data.confidence,
                validation_status: data.validation_status,
                risk_level: data.risk_level,
                usage: {
                    llm: {
                        total_tokens: data.metadata?.usage?.llm?.total_tokens || 0,
                        input_tokens: data.metadata?.usage?.llm?.input_tokens || 0,
                        output_tokens: data.metadata?.usage?.llm?.output_tokens || 0,
                    },
                    embedding: {
                        total_tokens: data.metadata?.usage?.embedding?.total_tokens || 0,
                    },
                },
                cost: {
                    total: {
                        brl: data.metadata?.cost?.total?.brl || 0,
                        usd: data.metadata?.cost?.total?.usd || 0,
                    },
                    exchange_rate: {
                        usd_brl: data.metadata?.cost?.exchange_rate?.usd_brl || 0,
                    },
                },
            }

        } catch (error: any) {
            if (error.response) {
                console.error(`[DocumentService] Erro do RAG no ask (${error.response.status}):`, JSON.stringify(error.response.data))
            } else {
                console.error('[DocumentService] Falha no ask:', error.message || error)
            }
            throw new InternalServerError('Não foi possível processar a pergunta sobre o documento.', { originalError: error.message })
        }
    }
}