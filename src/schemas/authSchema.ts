import type { FastifySchema } from "fastify";

export const loginSchema: FastifySchema = {
    body: {
        type: 'object',
        required: ['email', 'profile_password'],
        properties: {
            email: { type: 'string', format: 'email' },
            profile_password: { type: 'string' }
        } as const,
        additionalProperties: false,
    }
}