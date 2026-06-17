import type { FastifyInstance } from 'fastify'
import * as documentsController from '../controllers/documentsController.js'
import { authorize, adminOnly } from '../middleware/authorize.js'

import {
    createDocumentsSchema,
    documentsParamsSchema,
    updateDocumentsSchema,
    uploadDocumentSchema,
    askDocumentSchema,
} from '../schemas/documentsSchema.js'

const documentsRoutes = async (fastify: FastifyInstance) => {

    // ─────────────────────────────────────────────
    // CRUD original mantido
    // ─────────────────────────────────────────────
    fastify.post(
        '/',
        {
            schema: {
                tags: ['Documents'],
                summary: 'Cria um novo documento (realiza o upload) - Admin only',
                body: createDocumentsSchema.body,
            },
            preHandler: [fastify.authenticate, authorize('admin')],
        },
        documentsController.createDocuments
    )

    fastify.get(
        '/:id',
        {
            schema: {
                tags: ['Documents'],
                summary: 'Busca um documento pelo seu ID',
                params: documentsParamsSchema.params,
            },
            preHandler: [fastify.authenticate],
        },
        documentsController.getDocumentsById
    )

    fastify.get(
        '/',
        {
            schema: {
                tags: ['Documents'],
                summary: 'Lista todos os documentos',
            },
            preHandler: [fastify.authenticate],
        },
        documentsController.getDocuments
    )

    fastify.put(
        '/:id',
        {
            schema: {
                tags: ['Documents'],
                summary: 'Atualiza metadados de um documento existente - Admin only',
                params: documentsParamsSchema.params,
                body: updateDocumentsSchema.body,
            },
            preHandler: [fastify.authenticate, authorize('admin')],
        },
        documentsController.updateDocuments
    )

    fastify.delete(
        '/:id',
        {
            schema: {
                tags: ['Documents'],
                summary: 'Deleta um documento pelo ID - Admin only',
                params: documentsParamsSchema.params,
            },
            preHandler: [fastify.authenticate, adminOnly()],
        },
        documentsController.deleteDocuments
    )

    // ─────────────────────────────────────────────
    // NOVO: Upload de documento para o RAG
    // POST /documents/upload
    // ─────────────────────────────────────────────
    fastify.post(
        '/upload',
        {
            schema: {
                tags: ['Documents'],
                summary: 'Faz upload de um documento para análise pela IA',
                description: 'Recebe PDF, TXT, PNG ou JPEG via multipart/form-data, envia ao RAG para indexação e vincula à conversa.',
                security: [{ bearerAuth: [] }],
                querystring: uploadDocumentSchema.querystring,
                consumes: ['multipart/form-data'],
            },
            preHandler: [fastify.authenticate],
        },
        documentsController.uploadDocument as any
    )

    // ─────────────────────────────────────────────
    // NOVO: Pergunta sobre documentos de uma conversa
    // POST /documents/ask
    // ─────────────────────────────────────────────
    fastify.post(
        '/ask',
        {
            schema: {
                tags: ['Documents'],
                summary: 'Faz uma pergunta sobre os documentos de uma conversa',
                description: 'Busca todos os documentos vinculados à conversa e consulta o RAG para responder.',
                security: [{ bearerAuth: [] }],
                body: askDocumentSchema.body,
            },
            preHandler: [fastify.authenticate],
        },
        documentsController.askDocument as any
    )
}

export default documentsRoutes