import type { FastifySchema } from 'fastify'

export const createMessagesSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['conversations_id', 'content', 'role'],
    properties: {
      conversations_id: { type: 'string', format: 'uuid' },
      content: { type: 'string' },
      role: { type: 'string', enum: ['user', 'assistant', 'system'] },
      metadata: { type: 'object' },
    } as const,
    additionalProperties: false,
  },
}

export const updateMessagesSchema: FastifySchema = {
  body: {
    type: 'object',
    required: [],
    properties: {
      conversations_id: { type: 'string', format: 'uuid' },
      content: { type: 'string' },
      role: { type: 'string', enum: ['user', 'assistant', 'system'] },
      metadata: { type: 'object' },
    } as const,
    additionalProperties: false,
  },
}

export const messagesParamsSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid', description: 'ID do documento' },
    } as const,
    additionalProperties: false,
  },
}