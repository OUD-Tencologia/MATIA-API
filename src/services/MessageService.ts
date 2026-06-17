import { MessageRepository } from '../repositories/MessageRepository.js'
import { DocumentNotFoundError, InternalServerError } from '../errors/errors.js'

export class MessageService {

    static async create(payload: {
        conversations_id: string
        content: string
        role: 'user' | 'assistant' | 'system'
        metadata?: object | null
    }) {
        try {
            const created = await MessageRepository.create(payload)
            return created.toJSON()
        } catch (error: any) {
            console.error('[MessageService] Erro ao criar mensagem:', error.message)
            throw new InternalServerError('Não foi possível criar a mensagem.')
        }
    }

    static async findById(id: string) {
        try {
            const item = await MessageRepository.findById(id)
            if (!item) throw new DocumentNotFoundError()
            return item.toJSON()
        } catch (error: any) {
            if (error instanceof DocumentNotFoundError) throw error
            console.error('[MessageService] Erro ao buscar mensagem:', error.message)
            throw new InternalServerError('Não foi possível buscar a mensagem.')
        }
    }

    static async findAll() {
        try {
            const items = await MessageRepository.findAll()
            return items.map(i => i.toJSON())
        } catch (error: any) {
            console.error('[MessageService] Erro ao listar mensagens:', error.message)
            throw new InternalServerError('Não foi possível listar as mensagens.')
        }
    }

    static async update(id: string, payload: {
        content?: string
        role?: 'user' | 'assistant' | 'system'
        metadata?: object | null
    }) {
        try {
            if (payload.role && !['user', 'assistant', 'system'].includes(payload.role)) {
                throw new Error('Role inválido.')
            }

            const updatedRows = await MessageRepository.update(id, payload)
            if (updatedRows === 0) throw new DocumentNotFoundError()

            const updated = await MessageRepository.findById(id)
            return updated?.toJSON()
        } catch (error: any) {
            if (error instanceof DocumentNotFoundError) throw error
            console.error('[MessageService] Erro ao atualizar mensagem:', error.message)
            throw new InternalServerError('Não foi possível atualizar a mensagem.')
        }
    }

    static async delete(id: string) {
        try {
            const deleted = await MessageRepository.delete(id)
            if (deleted === 0) throw new DocumentNotFoundError()
            return true
        } catch (error: any) {
            if (error instanceof DocumentNotFoundError) throw error
            console.error('[MessageService] Erro ao deletar mensagem:', error.message)
            throw new InternalServerError('Não foi possível deletar a mensagem.')
        }
    }
}