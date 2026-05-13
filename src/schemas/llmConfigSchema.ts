import type { FastifySchema } from 'fastify'

export const createLlmConfigSchema: FastifySchema = {
    body: {
        type: 'object',
        required: ['provider', 'ia', 'ia_model', 'api_key', 'nome'],
        properties: {
            provider: { type: 'string', enum: ['openai', 'anthropic', 'gemini'] },
            ia: { type: 'string', enum: ['gpt', 'claude', 'gemini'] },
            ia_model: { type: 'string', minLength: 3 },
            api_key: { type: 'string', minLength: 10 },
            nome: { type: 'string', minLength: 2 },
            ativo: { type: 'boolean', default: true },
            padrao: { type: 'boolean', default: false },

            // 🔥 TRAVAS ADICIONADAS AQUI
            max_tokens: { type: 'integer', default: 4096, minimum: 1 },
            temperatura: { type: 'number', default: 0.5, minimum: 0, maximum: 2 },
            limite_custo: { type: 'number', default: 100, minimum: 0 },
        },
        additionalProperties: false,
    },
}

export const updateLlmConfigSchema: FastifySchema = {
    body: {
        type: 'object',
        properties: {
            // 🔥 MESMAS REGRAS DO CREATE PARA GARANTIR INTEGRIDADE NO UPDATE
            ia_model: { type: 'string', minLength: 3 },
            api_key: { type: 'string', minLength: 10 },
            nome: { type: 'string', minLength: 2 },
            ativo: { type: 'boolean' },
            padrao: { type: 'boolean' },
            max_tokens: { type: 'integer', minimum: 1 },
            temperatura: { type: 'number', minimum: 0, maximum: 2 },
            limite_custo: { type: 'number', minimum: 0 },
        },
        additionalProperties: false,
    },
}

export const llmConfigParamsSchema: FastifySchema = {
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'string', format: 'uuid' }
        }
    }
}