import type { FastifyInstance } from 'fastify'
import * as conversationsController from '../controllers/conversationController.js'

import {
    conversationsParamsSchema,
    createConversationsSchema,
    updateConversationsSchema,
    listConversationsSchema,
    listConversationMessagesSchema,
} from '../schemas/conversationSchema.js'

const conversationsRoutes = async (fastify: FastifyInstance) => {

    // ─────────────────────────────────────────────
    // CRUD original mantido
    // ─────────────────────────────────────────────
    fastify.post(
        '/',
        {
            schema: {
                tags: ['Conversations'],
                summary: 'Inicia uma nova conversa',
                body: createConversationsSchema.body,
            },
            preHandler: [fastify.authenticate],
        },
        conversationsController.createConversation
    )

    fastify.get(
        '/:id',
        {
            schema: {
                tags: ['Conversations'],
                summary: 'Busca uma conversa pelo seu ID',
                params: conversationsParamsSchema.params,
            },
            preHandler: [fastify.authenticate],
        },
        conversationsController.getConversationById
    )

    fastify.get(
        '/',
        {
            schema: {
                tags: ['Conversations'],
                summary: 'Lista todas as conversas',
            },
            preHandler: [fastify.authenticate],
        },
        conversationsController.getConversation
    )

    fastify.put(
        '/:id',
        {
            schema: {
                tags: ['Conversations'],
                summary: 'Atualiza uma conversa existente (metadados)',
                params: conversationsParamsSchema.params,
                body: updateConversationsSchema.body,
            },
            preHandler: [fastify.authenticate],
        },
        conversationsController.updateConversation
    )

    fastify.delete(
        '/:id',
        {
            schema: {
                tags: ['Conversations'],
                summary: 'Deleta uma conversa pelo ID',
                params: conversationsParamsSchema.params,
            },
            preHandler: [fastify.authenticate],
        },
        conversationsController.deleteConversation
    )

    // ─────────────────────────────────────────────
    // NOVO: Conversas do usuário autenticado
    // GET /conversations/me?page=1&limit=20
    // ─────────────────────────────────────────────
    fastify.get(
        '/me',
        {
            schema: {
                tags: ['Conversations'],
                summary: 'Lista as conversas do usuário autenticado',
                description: 'Retorna apenas as conversas do usuário logado, ordenadas pela mais recente.',
                security: [{ bearerAuth: [] }],
                querystring: listConversationsSchema.querystring,
            },
            preHandler: [fastify.authenticate],
        },
        conversationsController.listMyConversations as any
    )

    // ─────────────────────────────────────────────
    // NOVO: Mensagens de uma conversa
    // GET /conversations/:id/messages?page=1&limit=50
    // ─────────────────────────────────────────────
    fastify.get(
        '/:id/messages',
        {
            schema: {
                tags: ['Conversations'],
                summary: 'Lista as mensagens de uma conversa',
                description: 'Retorna as mensagens em ordem cronológica. Valida que a conversa pertence ao usuário autenticado.',
                security: [{ bearerAuth: [] }],
                params: listConversationMessagesSchema.params,
                querystring: listConversationMessagesSchema.querystring,
            },
            preHandler: [fastify.authenticate],
        },
        conversationsController.listConversationMessages as any
    )
}

export default conversationsRoutes