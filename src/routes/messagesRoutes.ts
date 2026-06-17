import type { FastifyInstance } from 'fastify'
import * as messagesController from '../controllers/messagesController.js'

import {
    createMessagesSchema,
    messagesParamsSchema,
    updateMessagesSchema,
} from '../schemas/messagesSchema.js'

const messagesRoutes = async (fastify: FastifyInstance) => {
    fastify.post(
        '/',
        {
            schema: {
                tags: ['Messages'],
                summary: 'Cria uma nova mensagem',
                body: createMessagesSchema.body,
            },
            preHandler: [fastify.authenticate],
        },
        messagesController.createMessages
    )

    fastify.get(
        '/:id',
        {
            schema: {
                tags: ['Messages'],
                summary: 'Busca uma mensagem pelo seu ID',
                params: messagesParamsSchema.params,
            },
            preHandler: [fastify.authenticate],
        },
        messagesController.getMessagesById
    )

    fastify.get(
        '/',
        {
            schema: {
                tags: ['Messages'],
                summary: 'Listar todas as mensagens',
            },
            preHandler: [fastify.authenticate],
        },
        messagesController.getMessages
    )

    fastify.put(
        '/:id',
        {
            schema: {
                tags: ['Messages'],
                summary: 'Atualiza o conteúdo de uma mensagem existente',
                params: messagesParamsSchema.params,
                body: updateMessagesSchema.body,
            },
            preHandler: [fastify.authenticate],
        },
        messagesController.updateMessages
    )

    fastify.delete(
        '/:id',
        {
            schema: {
                tags: ['Messages'],
                summary: 'Deleta uma mensagem pelo ID',
                params: messagesParamsSchema.params,
            },
            preHandler: [fastify.authenticate],
        },
        messagesController.deleteMessages
    )
}

export default messagesRoutes