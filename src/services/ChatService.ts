import axios from 'axios';
import { UserRepository } from '../repositories/UserRepository.js';
import { CompanyRepository } from '../repositories/CompanyRepository.js';
import { LlmConfigRepository } from '../repositories/LlmConfigRepository.js';
import { ChatRepository } from '../repositories/ChatRepository.js';
import { MinioService } from '../services/Minioservice.js';
import { PdfService } from '../services/PdfService.js';
import { UserNotFoundError, InternalServerError } from '../errors/errors.js';
import { AskQuestionDTO, ChatResponseDTO } from "../dtos/ChatDTO.js";
import * as http from "node:http";
import * as https from "node:https";

export class ChatService {

    static async askMatia(dto: AskQuestionDTO, userId: string): Promise<ChatResponseDTO> {
        try {
            // 1. Validar o Usuário
            const user = await UserRepository.findByIdForAuth(userId);
            if (!user) throw new UserNotFoundError(userId);

            const rawUser = user.get ? user.get({ plain: true }) : user;
            const role = rawUser.role;
            let companyId = rawUser.empresa_id;

            // 2. Validação de Empresa
            if (role !== 'SUPER-ADMIN') {
                if (!companyId) throw new Error('Usuário não possui uma empresa vinculada para acessar a IA.');
                const company = await CompanyRepository.findById(companyId);
                if (!company) throw new Error('Empresa vinculada ao usuário não encontrada.');
                const rawCompany = company.get ? company.get({ plain: true }) : company;
                if (rawCompany.active === false) throw new Error('O acesso desta empresa está suspenso.');
            } else {
                companyId = null;
            }

            // 3. Buscar a IA Padrão
            const config = await LlmConfigRepository.findPadrao();
            if (!config) throw new Error('Nenhuma configuração de Inteligência Artificial ativa foi encontrada no sistema.');

            // 4. Verificar se é pedido de PDF
            const isPdf = PdfService.isPdfRequest(dto.question);

            // 5. Salvar a pergunta no banco
            const { conversationId } = await ChatRepository.salvarMensagemTexto(
                userId,
                companyId,
                dto.question,
                (dto as any).conversation_id || null
            );

            // 6. Chamar o RAG
            const pythonResponse = await axios.post('http://host.docker.internal:4001/ask', {
                question: dto.question,
                user_id: userId,
                company_id: companyId || "matia-super-admin",
                ia: config.ia,
                ia_model: config.ia_model,
                client_api_key: config.api_key,
                temperature: config.temperatura,
                max_tokens: config.max_tokens,
                chat_history: [],
                include_sources: true,
                response_style: dto.response_style || "equilibrada",
                jurisdicao: "federal"
            }, {
                headers: {
                    'X-API-Key': process.env['MATIA_RAG_API_KEY'],
                    'Content-Type': 'application/json'
                },
                proxy: false,
                httpAgent: new http.Agent({ keepAlive: true }),
                httpsAgent: new https.Agent({ keepAlive: true })
            });

            const data = pythonResponse.data;

            // 7. Salvar resposta da IA no banco
            await ChatRepository.salvarMensagemIA(
                conversationId,
                data.answer,
                config.ia_model
            );

            // 8. Gerar PDF se solicitado
            let pdfUrl: string | null = null;

            if (isPdf) {
                try {
                    const titulo = PdfService.getTitleFromQuestion(dto.question);
                    const pdfBuffer = await PdfService.generateFromText(data.answer, { title: titulo });
                    const fileName = `${titulo.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`;

                    pdfUrl = await MinioService.uploadPdfBuffer(
                        pdfBuffer,
                        fileName,
                        userId,
                        companyId
                    );

                    console.log(`[ChatService] PDF gerado: ${fileName}`);
                } catch (pdfError: any) {
                    console.error(`[ChatService] Erro ao gerar PDF:`, pdfError.message);
                }
            }

            // 9. Atualizar estatísticas
            try {
                await UserRepository.updateStats(
                    userId,
                    data.usage?.llm?.total_tokens || 0,
                    data.cost?.total?.brl || 0
                );
            } catch (statsError) {
                console.error(`[ChatService] Erro ao atualizar estatísticas:`, statsError);
            }

            return {
                answer: data.answer,
                sources: data.sources || [],
                interaction_id: data.metadata?.interaction_id?.toString() || "gerado-localmente",
                conversation_id: conversationId,
                pdf_url: pdfUrl,
                usage: {
                    llm: {
                        total_tokens: data.usage?.llm?.total_tokens || 0,
                        input_tokens: data.usage?.llm?.input_tokens || 0,
                        output_tokens: data.usage?.llm?.output_tokens || 0,
                        thoughts_tokens: data.usage?.llm?.thoughts_tokens
                    }
                },
                cost: {
                    total: {
                        brl: data.cost?.total?.brl || 0,
                        usd: data.cost?.total?.usd || 0
                    },
                    exchange_rate: {
                        usd_brl: data.cost?.exchange_rate?.usd_brl || 0
                    }
                },
                confidence: data.confidence,
                risk_level: data.risk_level
            };

        } catch (error: any) {
            if (error.response) {
                console.error(`[ChatService] Erro da API Python (${error.response.status}):`, JSON.stringify(error.response.data));
            } else {
                console.error(`[ChatService] Falha na integração RAG:`, error.message || error);
            }
            throw new InternalServerError('Não foi possível processar a dúvida jurídica neste momento.', { originalError: error.message });
        }
    }
}