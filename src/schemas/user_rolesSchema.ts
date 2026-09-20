import type { FastifySchema } from 'fastify'

export const createUserRoleSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['user_id', 'role'],
    properties: {
      user_id: { type: 'string', format: 'uuid' },
      role: { type: 'string', enum: ['SUPER-ADMIN', 'ADMIN', 'USER'] },
    } as const,
    additionalProperties: false,
  },
}

export const updateUserRoleSchema: FastifySchema = {
  body: {
    type: 'object',
    required: [],
    properties: {
      user_id: { type: 'string', format: 'uuid' },
      role: { type: 'string', enum: ['SUPER-ADMIN', 'ADMIN', 'USER'] },
    } as const,
    additionalProperties: false,
  },
}

export const userRoleParamsSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid', description: 'UUID do registro' },
    } as const,
    additionalProperties: false,
  },
}
