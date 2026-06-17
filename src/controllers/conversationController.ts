import type { FastifyRequest, FastifyReply } from 'fastify'
import type { ConversationAttributes } from '../models/conversation.js'
import { ConversationService } from '../services/ConversationService.js'
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

interface CreateBody extends Omit<ConversationAttributes, 'id' | 'created_at' | 'updated_at'> {}
interface UpdateBody extends Partial<CreateBody> {}
interface Params { id: string }
interface ListQuery { page?: number; limit?: number }

interface JwtUser {
  id: string
  role: string
  empresa_id: string | null
}

// ─────────────────────────────────────────────
// CRUD original mantido
// ─────────────────────────────────────────────
export const createConversation = async (request: FastifyRequest) => {
  try {
    const payload = request.body as CreateBody
    if (!payload || Object.keys(payload).length === 0) throw new MissingFieldError()

    const data = await ConversationService.create(payload)
    await cacheService.invalidatePrefix('conversations:')
    return successResponse(data, 'Conversa criada com sucesso')
  } catch (err: any) {
    if (err?.name === 'SequelizeValidationError') {
      throw new ValidationError('Dados inválidos', { code: ErrorCodes.VALIDATION_ERROR })
    }
    throw new InternalServerError('Erro ao criar a conversa', { code: ErrorCodes.CREATE_FAILED })
  }
}

export const getConversationById = async (request: FastifyRequest) => {
  try {
    const { id } = request.params as Params
    const data = await cacheService.getOrSet(
        `conversations:${id}`,
        async () => await ConversationService.findById(id),
        300
    )
    return successResponse(data, 'Conversa encontrada com sucesso')
  } catch (err: any) {
    throw new DocumentNotFoundError()
  }
}

export const getConversation = async () => {
  try {
    const items = await cacheService.getOrSet(
        'conversations:all',
        async () => await ConversationService.findAll(),
        120
    )
    if (Array.isArray(items) && items.length === 0) {
      return successResponse([], 'Nenhuma conversa encontrada')
    }
    return successResponse(items, 'Listando todas as conversas')
  } catch (err: any) {
    throw new DataBaseError()
  }
}

export const updateConversation = async (request: FastifyRequest) => {
  try {
    const { id } = request.params as Params
    const data = await ConversationService.update(id, request.body as UpdateBody)

    await cacheService.del(`conversations:${id}`)
    await cacheService.del('conversations:all')

    return successResponse(data, 'Conversa atualizada com sucesso')
  } catch (err: any) {
    if (err?.name === 'SequelizeValidationError') {
      throw new ValidationError('Dados inválidos', { code: ErrorCodes.VALIDATION_ERROR })
    }
    throw new InternalServerError('Erro ao atualizar a conversa', { code: ErrorCodes.UPDATE_FAILED })
  }
}

export const deleteConversation = async (request: FastifyRequest) => {
  try {
    const { id } = request.params as Params
    await ConversationService.delete(id)

    await cacheService.del(`conversations:${id}`)
    await cacheService.del('conversations:all')

    return successResponse('Conversa deletada com sucesso')
  } catch (err: any) {
    throw new InternalServerError('Erro ao deletar a conversa')
  }
}

// ─────────────────────────────────────────────
// NOVO: Listar conversas do usuário autenticado
// GET /conversations/me?page=1&limit=20
// ─────────────────────────────────────────────
export const listMyConversations = async (
    request: FastifyRequest<{ Querystring: ListQuery }>,
    reply: FastifyReply
) => {
  try {
    const user = request.user as JwtUser
    if (!user?.id) return reply.status(401).send({ error: 'Não autenticado.' })

    const page = request.query.page || 1
    const limit = request.query.limit || 20

    const result = await ConversationService.listMyConversations(user.id, page, limit)
    return successResponse(result, 'Conversas listadas com sucesso')
  } catch (err: any) {
    throw new DataBaseError()
  }
}

// ─────────────────────────────────────────────
// NOVO: Buscar mensagens de uma conversa
// GET /conversations/:id/messages?page=1&limit=50
// ─────────────────────────────────────────────
export const listConversationMessages = async (
    request: FastifyRequest<{ Params: Params; Querystring: ListQuery }>,
    reply: FastifyReply
) => {
  try {
    const user = request.user as JwtUser
    if (!user?.id) return reply.status(401).send({ error: 'Não autenticado.' })

    const { id } = request.params
    const page = request.query.page || 1
    const limit = request.query.limit || 50

    const result = await ConversationService.getMessages(id, user.id, page, limit)
    return successResponse(result, 'Mensagens listadas com sucesso')
  } catch (err: any) {
    if (err instanceof DocumentNotFoundError) {
      return reply.status(404).send({ error: 'Conversa não encontrada.' })
    }
    throw new DataBaseError()
  }
}

export default {
  createConversation,
  getConversationById,
  getConversation,
  updateConversation,
  deleteConversation,
  listMyConversations,
  listConversationMessages,
}