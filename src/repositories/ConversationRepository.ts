import { Op } from 'sequelize'
import Conversation from '../models/conversation.js'
import Messages from '../models/messages.js'

export class ConversationRepository {

    // ─────────────────────────────────────────────
    // CRUD base
    // ─────────────────────────────────────────────
    static async create(payload: any) {
        return await Conversation.create(payload)
    }

    static async findById(id: string) {
        return await Conversation.findByPk(id)
    }

    static async findAll() {
        return await Conversation.findAll()
    }

    static async update(id: string, payload: any) {
        const [updatedRows] = await Conversation.update(payload, { where: { id } })
        return updatedRows
    }

    static async delete(id: string) {
        return await Conversation.destroy({ where: { id } })
    }

    // ─────────────────────────────────────────────
    // NOVO: Listar conversas do usuário autenticado
    // com paginação, ordenadas pela mais recente
    // ─────────────────────────────────────────────
    static async findAllByUser(userId: string, page: number = 1, limit: number = 20) {
        const offset = (page - 1) * limit

        const { count, rows } = await Conversation.findAndCountAll({
            where: { user_id: userId },
            order: [['last_message_at', 'DESC']],
            limit,
            offset,
        })

        return {
            data: rows.map(r => r.toJSON()),
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
        }
    }

    // ─────────────────────────────────────────────
    // NOVO: Buscar mensagens de uma conversa
    // Valida que a conversa pertence ao usuário
    // ─────────────────────────────────────────────
    static async findMessagesByConversation(
        conversationId: string,
        userId: string,
        page: number = 1,
        limit: number = 50
    ) {
        // Verifica se a conversa pertence ao usuário
        const conversa = await Conversation.findOne({
            where: { id: conversationId, user_id: userId },
        })

        if (!conversa) return null // controller trata como 404

        const offset = (page - 1) * limit

        const { count, rows } = await Messages.findAndCountAll({
            where: { conversations_id: conversationId },
            order: [['created_at', 'ASC']], // mensagens em ordem cronológica
            limit,
            offset,
        })

        return {
            conversation: conversa.toJSON(),
            messages: rows.map(r => r.toJSON()),
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
        }
    }
}