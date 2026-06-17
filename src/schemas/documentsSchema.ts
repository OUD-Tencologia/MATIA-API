import type { FastifySchema } from 'fastify'

export const createDocumentsSchema: FastifySchema = {
  body: {
    type: 'object',
    required: [
      'user_id',
      'original_name',
      'storage_path',
      'file_type',
      'file_size',
    ],
    properties: {
      user_id: { type: 'string', format: 'uuid' },
      original_name: { type: 'string' },
      storage_path: { type: 'string' },
      file_type: { type: 'string' },
      file_size: { type: 'string' },
    } as const,
    additionalProperties: false,
  },
}

export const updateDocumentsSchema: FastifySchema = {
  body: {
    type: 'object',
    required: [],
    properties: {
      user_id: { type: 'string', format: 'uuid' },
      original_name: { type: 'string' },
      storage_path: { type: 'string' },
      file_type: { type: 'string' },
      file_size: { type: 'string' },
    } as const,
    additionalProperties: false,
  },
}

export const documentsParamsSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', format: 'uuid', description: 'UUID do registro' },
    } as const,
    additionalProperties: false,
  },
}

// ─────────────────────────────────────────────
// NOVO: Upload de documento para o RAG
// POST /documents/upload (multipart/form-data)
// O arquivo vem no body multipart, os campos opcionais via querystring
// ─────────────────────────────────────────────
export const uploadDocumentSchema: FastifySchema = {
  querystring: {
    type: 'object',
    required: [],
    properties: {
      conversation_id: {
        type: 'string',
        format: 'uuid',
        description: 'UUID da conversa existente (opcional — se não informado, uma nova conversa é criada)',
      },
    } as const,
    additionalProperties: false,
  },
}

// ─────────────────────────────────────────────
// NOVO: Pergunta sobre documento(s) de uma conversa
// POST /documents/ask
// ─────────────────────────────────────────────
export const askDocumentSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['question', 'conversation_id'],
    properties: {
      question: {
        type: 'string',
        description: 'Pergunta sobre o(s) documento(s) da conversa',
      },
      conversation_id: {
        type: 'string',
        format: 'uuid',
        description: 'UUID da conversa que contém os documentos',
      },
      response_style: {
        type: 'string',
        enum: ['objetiva', 'equilibrada', 'detalhada', 'didatica'],
        default: 'equilibrada',
      },
    } as const,
    additionalProperties: false,
  },
}