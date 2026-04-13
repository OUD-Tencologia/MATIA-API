import type { FastifySchema } from 'fastify'

export const createProfileSchema: FastifySchema = {
  body: {
    type: 'object',
    // Não pedimos o 'empresa_id' aqui porque o nosso Controller já pega isso do Token (Segurança!)
    required: ['nome', 'email', 'cpf', 'telefone', 'data_nascimento', 'profile_password'],
    properties: {
      nome: { type: 'string', minLength: 3 },
      email: { type: 'string', format: 'email' },
      cpf: { type: 'string', minLength: 11, maxLength: 14 },
      telefone: { type: 'string' },
      data_nascimento: { type: 'string' }, // Aceita data em string (ex: "1990-05-20")
      profile_password: { type: 'string', minLength: 6 },
      role: {
        type: 'string',
        enum: ['SUPER-ADMIN', 'ADMIN', 'USER'],
        default: 'USER'
      },
      area_juridica: { type: 'string' },
      status: {
        type: 'string',
        enum: ['ativo', 'inativo'],
        default: 'ativo'
      },
      avatar_url: { type: 'string' }
    },
    additionalProperties: false,
  },
}

export const updateProfileSchema: FastifySchema = {
  body: {
    type: 'object',
    // Na atualização, nenhum campo é obrigatório (o usuário atualiza o que quiser)
    properties: {
      nome: { type: 'string', minLength: 3 },
      email: { type: 'string', format: 'email' },
      cpf: { type: 'string', minLength: 11, maxLength: 14 },
      telefone: { type: 'string' },
      data_nascimento: { type: 'string' },
      profile_password: { type: 'string', minLength: 6 },
      role: { type: 'string', enum: ['SUPER-ADMIN', 'ADMIN', 'USER'] },
      area_juridica: { type: 'string' },
      status: { type: 'string', enum: ['ativo', 'inativo'] },
      avatar_url: { type: 'string' }
    },
    additionalProperties: false,
  },
}

export const profileParamsSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid' }
    }
  }
}