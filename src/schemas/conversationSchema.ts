import type { FastifySchema } from 'fastify'

export const createConversationsSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['user_id', 'title'],
    properties: {
      user_id: { type: 'string', format: 'uuid' },
      company_id: { type: 'string', format: 'uuid' },
      title: { type: 'string' },
      is_favorite: { type: 'boolean' },
    } as const,
    additionalProperties: false,
  },
}

export const updateConversationsSchema: FastifySchema = {
  body: {
    type: 'object',
    required: [],
    properties: {
      user_id: { type: 'string', format: 'uuid' },
      company_id: { type: 'string', format: 'uuid' },
      title: { type: 'string' },
      is_favorite: { type: 'boolean' },
    } as const,
    additionalProperties: false,
  },
}

export const conversationsParamsSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid', description: 'UUID do Registro' },
    } as const,
    additionalProperties: false,
  },
}

// ─────────────────────────────────────────────
// NOVO: Listar conversas do usuário autenticado
// GET /conversations?page=1&limit=20
// ─────────────────────────────────────────────
export const listConversationsSchema: FastifySchema = {
  querystring: {
    type: 'object',
    required: [],
    properties: {
      page: { type: 'integer', minimum: 1, default: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
    } as const,
    additionalProperties: false,
  },
}

// ─────────────────────────────────────────────
// NOVO: Buscar mensagens de uma conversa
// GET /conversations/:id/messages?page=1&limit=50
// ─────────────────────────────────────────────
export const listConversationMessagesSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid', description: 'UUID da conversa' },
    } as const,
    additionalProperties: false,
  },
  querystring: {
    type: 'object',
    required: [],
    properties: {
      page: { type: 'integer', minimum: 1, default: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
    } as const,
    additionalProperties: false,
  },
}