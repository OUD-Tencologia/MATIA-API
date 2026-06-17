import type { FastifyRequest, FastifyReply } from 'fastify'
import { DocumentService } from '../services/DocumentService.js'
import {
  ValidationError,
  MissingFieldError,
  DocumentNotFoundError,
  InternalServerError,
  DataBaseError,
} from '../errors/errors.js'
import { ErrorCodes } from '../errors/errorCodes.js'
import { successResponse } from '../utils/response.js'
import cacheService from '../utils/cache.js'
import type { AskDocumentDTO, UploadDocumentDTO } from '../dtos/DocumentDTO.js'

interface Params { id: string }

interface JwtUser {
  id: string
  role: string
  empresa_id: string | null
}

// ─────────────────────────────────────────────
// CRUD original mantido
// ─────────────────────────────────────────────
export const createDocuments = async (request: FastifyRequest) => {
  try {
    const payload = request.body as any
    if (!payload || Object.keys(payload).length === 0) throw new MissingFieldError()

    const data = await DocumentService.create(payload)
    await cacheService.invalidatePrefix('documents:')
    return successResponse(data, 'Documento criado com sucesso')
  } catch (err: any) {
    if (err?.name === 'SequelizeValidationError') {
      throw new ValidationError('Dados inválidos', { code: ErrorCodes.VALIDATION_ERROR })
    }
    throw new InternalServerError('Erro ao criar o documento', { code: ErrorCodes.CREATE_FAILED })
  }
}

export const getDocumentsById = async (request: FastifyRequest) => {
  try {
    const { id } = request.params as Params
    const data = await cacheService.getOrSet(
        `documents:${id}`,
        async () => await DocumentService.findById(id),
        300
    )
    return successResponse(data, 'Documento encontrado com sucesso')
  } catch (err: any) {
    throw new DocumentNotFoundError()
  }
}

export const getDocuments = async () => {
  try {
    const items = await cacheService.getOrSet(
        'documents:all',
        async () => await DocumentService.findAll(),
        120
    )
    if (Array.isArray(items) && items.length === 0) {
      return successResponse([], 'Nenhum documento encontrado')
    }
    return successResponse(items, 'Listando todos os documentos')
  } catch (err: any) {
    throw new DataBaseError()
  }
}

export const updateDocuments = async (request: FastifyRequest) => {
  try {
    const { id } = request.params as Params
    const data = await DocumentService.update(id, request.body as any)

    await cacheService.del(`documents:${id}`)
    await cacheService.del('documents:all')

    return successResponse(data, 'Documento atualizado com sucesso')
  } catch (err: any) {
    if (err?.name === 'SequelizeValidationError') {
      throw new ValidationError('Dados inválidos', { code: ErrorCodes.VALIDATION_ERROR })
    }
    throw new InternalServerError('Erro ao atualizar o documento', { code: ErrorCodes.UPDATE_FAILED })
  }
}

export const deleteDocuments = async (request: FastifyRequest) => {
  try {
    const { id } = request.params as Params
    await DocumentService.delete(id)

    await cacheService.del(`documents:${id}`)
    await cacheService.del('documents:all')

    return successResponse('Documento deletado com sucesso')
  } catch (err: any) {
    throw new InternalServerError('Erro ao deletar o documento', { code: ErrorCodes.DELETE_FAILED })
  }
}

// ─────────────────────────────────────────────
// NOVO: Upload de documento para o RAG
// POST /documents/upload (multipart/form-data)
// ─────────────────────────────────────────────
export const uploadDocument = async (
    request: FastifyRequest<{ Querystring: UploadDocumentDTO }>,
    reply: FastifyReply
) => {
  try {
    const user = request.user as JwtUser
    if (!user?.id) return reply.status(401).send({ error: 'Não autenticado.' })

    const data = await request.file()
    if (!data) return reply.status(400).send({ error: 'Nenhum arquivo enviado.' })

    const tiposPermitidos = ['application/pdf', 'text/plain', 'image/png', 'image/jpeg']
    if (!tiposPermitidos.includes(data.mimetype)) {
      return reply.status(415).send({ error: 'Tipo de arquivo não suportado. Permitidos: PDF, TXT, PNG, JPEG.' })
    }

    const chunks: Buffer[] = []
    for await (const chunk of data.file) chunks.push(chunk)
    const fileBuffer = Buffer.concat(chunks)

    if (!fileBuffer.length) return reply.status(400).send({ error: 'O arquivo enviado está vazio.' })

    const dto: UploadDocumentDTO = {
      conversation_id: request.query.conversation_id || null,
    }

    const response = await DocumentService.uploadDocumento(
        fileBuffer,
        data.filename,
        data.mimetype,
        fileBuffer.length,
        dto,
        user.id
    )

    await cacheService.invalidatePrefix('documents:')

    return reply.status(201).send(successResponse(response, 'Documento enviado e indexado com sucesso'))
  } catch (err: any) {
    console.error('[DocumentController] Erro no upload:', err.message)
    const statusCode = err.statusCode || 500
    return reply.status(statusCode).send({ error: err.message || 'Erro ao processar o documento.' })
  }
}

// ─────────────────────────────────────────────
// NOVO: Pergunta sobre documento(s) da conversa
// POST /documents/ask
// ─────────────────────────────────────────────
export const askDocument = async (
    request: FastifyRequest<{ Body: AskDocumentDTO }>,
    reply: FastifyReply
) => {
  try {
    const user = request.user as JwtUser
    if (!user?.id) return reply.status(401).send({ error: 'Não autenticado.' })

    const dto = request.body

    if (!dto.question?.trim()) {
      return reply.status(400).send({ error: 'A pergunta não pode estar vazia.' })
    }

    const response = await DocumentService.askDocumento(dto, user.id)
    return reply.status(200).send(successResponse(response, 'Resposta gerada com sucesso'))
  } catch (err: any) {
    console.error('[DocumentController] Erro no ask:', err.message)
    const statusCode = err.statusCode || 500
    return reply.status(statusCode).send({ error: err.message || 'Erro ao processar a pergunta.' })
  }
}

export default {
  createDocuments,
  getDocumentsById,
  getDocuments,
  updateDocuments,
  deleteDocuments,
  uploadDocument,
  askDocument,
}