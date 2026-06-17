import type { FastifyRequest } from 'fastify'
import { MessageService } from '../services/MessageService.js'
import {
  ValidationError,
  MissingFieldError,
  DocumentNotFoundError,
  InternalServerError,
  DataBaseError,
} from '../errors/errors.js'
import { ErrorCodes } from '../errors/errorCodes.js'
import { successResponse } from '../utils/response.js'

interface CreateBody {
  conversations_id: string
  content: string
  role: 'user' | 'assistant' | 'system'
  metadata?: object | null
}
interface UpdateBody extends Partial<CreateBody> {}
interface Params { id: string }

export const createMessages = async (request: FastifyRequest) => {
  try {
    const payload = request.body as CreateBody
    if (!payload || Object.keys(payload).length === 0) throw new MissingFieldError()

    const data = await MessageService.create(payload)
    return successResponse(data, 'Mensagem criada com sucesso')
  } catch (err: any) {
    if (err?.name === 'SequelizeValidationError') {
      throw new ValidationError('Dados inválidos', { code: ErrorCodes.VALIDATION_ERROR })
    }
    throw new InternalServerError('Erro ao criar a mensagem', { code: ErrorCodes.CREATE_FAILED })
  }
}

export const getMessagesById = async (request: FastifyRequest) => {
  try {
    const { id } = request.params as Params
    const data = await MessageService.findById(id)
    return successResponse(data, 'Mensagem encontrada com sucesso')
  } catch (err: any) {
    throw new DocumentNotFoundError()
  }
}

export const getMessages = async () => {
  try {
    const items = await MessageService.findAll()
    if (items.length === 0) return successResponse([], 'Nenhuma mensagem encontrada')
    return successResponse(items, 'Listando todas as mensagens')
  } catch (err: any) {
    throw new DataBaseError()
  }
}

export const updateMessages = async (request: FastifyRequest) => {
  try {
    const { id } = request.params as Params
    const data = await MessageService.update(id, request.body as UpdateBody)
    return successResponse(data, 'Mensagem atualizada com sucesso')
  } catch (err: any) {
    if (err instanceof DocumentNotFoundError) throw err
    if (err?.name === 'SequelizeValidationError') {
      throw new ValidationError('Dados inválidos', { code: ErrorCodes.VALIDATION_ERROR })
    }
    throw new InternalServerError('Erro ao atualizar a mensagem', { code: ErrorCodes.UPDATE_FAILED })
  }
}

export const deleteMessages = async (request: FastifyRequest) => {
  try {
    const { id } = request.params as Params
    await MessageService.delete(id)
    return successResponse('Mensagem deletada com sucesso')
  } catch (err: any) {
    if (err instanceof DocumentNotFoundError) throw err
    throw new InternalServerError('Erro ao deletar a mensagem', { code: ErrorCodes.DELETE_FAILED })
  }
}

export default {
  createMessages,
  getMessagesById,
  getMessages,
  updateMessages,
  deleteMessages,
}