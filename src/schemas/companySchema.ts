import type { FastifySchema } from 'fastify'

export const createCompanySchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['company', 'admin'], // 👈 Agora exige os dois blocos
    properties: {
      // 🏢 BLOCO 1: Validação dos dados da Empresa
      company: {
        type: 'object',
        required: ['name', 'code', 'cnpj', 'email', 'phone', 'plano'],
        properties: {
          name: { type: 'string', minLength: 3 },
          code: { type: 'string', minLength: 2 }, // Ex: 'MATIA'
          cnpj: { type: 'string', minLength: 14, maxLength: 18 },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          plano: {
            type: 'string',
            enum: ['trial', 'basico', 'profissional', 'enterprise']
          },
          active: { type: 'boolean', default: true }
        },
        additionalProperties: false,
      },
      // 👤 BLOCO 2: Validação dos dados do primeiro Administrador
      admin: {
        type: 'object',
        required: ['nome', 'email', 'cpf', 'telefone', 'data_nascimento', 'profile_password'],
        properties: {
          nome: { type: 'string', minLength: 3 },
          email: { type: 'string', format: 'email' },
          cpf: { type: 'string', minLength: 11, maxLength: 14 },
          telefone: { type: 'string' },
          // O formato date ou date-time aceita strings como "2026-04-10" ou ISO
          data_nascimento: { type: 'string' },
          profile_password: { type: 'string', minLength: 6 }
        },
        // Permitimos propriedades adicionais falsas para blindar o payload
        additionalProperties: false,
      }
    },
    additionalProperties: false,
  },
}

// O update continua igual, pois quando atualizamos a empresa,
// não atualizamos o admin na mesma requisição.
export const updateCompanySchema: FastifySchema = {
  body: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      email: { type: 'string', format: 'email' },
      phone: { type: 'string' },
      plano: { type: 'string', enum: ['trial', 'basico', 'profissional', 'enterprise'] },
      active: { type: 'boolean' }
    } as const,
    additionalProperties: false,
  },
}

// Mantenha o companyParamsSchema aqui embaixo se ele existir no seu arquivo
export const companyParamsSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid' }
    }
  }
}