import { ConversationRepository } from '../repositories/ConversationRepository.js'
import { DocumentNotFoundError, InternalServerError } from '../errors/errors.js'

export class ConversationService {

    // ─────────────────────────────────────────────
    // CRUD base
    // ─────────────────────────────────────────────
    static async create(payload: any) {
        const created = await ConversationRepository.create(payload)
        return created.toJSON()
    }

    static async findById(id: string) {
        const item = await ConversationRepository.findById(id)
        if (!item) throw new DocumentNotFoundError()
        return item.toJSON()
    }

    static async findAll() {
        const items = await ConversationRepository.findAll()
        return items.map((i: any) => i.toJSON())
    }

    static async update(id: string, payload: any) {
        const updatedRows = await ConversationRepository.update(id, payload)
        if (updatedRows === 0) throw new DocumentNotFoundError()
        const updated = await ConversationRepository.findById(id)
        return updated?.toJSON()
    }

    static async delete(id: string) {
        const deleted = await ConversationRepository.delete(id)
        if (deleted === 0) throw new DocumentNotFoundError()
        return true
    }

    // ─────────────────────────────────────────────
    // Listar conversas do usuário autenticado
    // ─────────────────────────────────────────────
    static async listMyConversations(userId: string, page: number = 1, limit: number = 20) {
        try {
            return await ConversationRepository.findAllByUser(userId, page, limit)
        } catch (error: any) {
            console.error('[ConversationService] Erro ao listar conversas:', error.message)
            throw new InternalServerError('Não foi possível listar as conversas.')
        }
    }

    // ─────────────────────────────────────────────
    // Buscar mensagens de uma conversa
    // Valida que a conversa pertence ao usuário
    // ─────────────────────────────────────────────
    static async getMessages(conversationId: string, userId: string, page: number = 1, limit: number = 50) {
        try {
            const result = await ConversationRepository.findMessagesByConversation(
                conversationId,
                userId,
                page,
                limit
            )

            if (!result) throw new DocumentNotFoundError()

            return result
        } catch (error: any) {
            if (error instanceof DocumentNotFoundError) throw error
            console.error('[ConversationService] Erro ao buscar mensagens:', error.message)
            throw new InternalServerError('Não foi possível buscar as mensagens.')
        }
    }
}