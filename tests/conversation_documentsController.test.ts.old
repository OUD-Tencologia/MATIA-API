import { expect, it, beforeAll, afterAll, describe } from 'vitest'
import {
  createConversationDocuments,
  getConversationDocumentsById,
  updateConversationDocuments,
  deleteConversationDocuments,
} from '../src/controllers/conversation_documentsController.js'

import { createConversation } from '../src/controllers/conversationController.js'
import sequelize from '../src/db.js'
import type { FastifyRequest } from 'fastify'
import { createProfile } from '../src/controllers/ProfileController.js'
import { createDocuments } from '../src/controllers/documentsController.js'

describe('ConversationDocumentsController', () => {
  let createConversationDocumentsID: string
  let conversationID: string
  let docID: string
  let profileID: string

  beforeAll(async () => {
    await sequelize.sync({ force: true })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  describe('createConversationDocuments', () => {
    it('deve criar um conversation documents com sucesso', async () => {
      const profileReq = {
        body: {
          nome: 'Usuário-de-Teste Rotas',
          email: 'test.routes@email.com',
          cpf: '52998224725',
          telefone: '11988887777',
          data_nascimento: '1995-05-15',
          profile_password: 'password123',
        },
      } as FastifyRequest

      const profileBody = await createProfile(profileReq)

      profileID = profileBody.data.id

      const docReq = {
        body: {
          user_id: profileID,
          original_name: 'Nome original',
          storage_path: 'Caminho de armazenamento',
          file_type: 'Tipo de arquivo',
          file_size: 25,
          status: 'enviando',
          progress: 20,
        },
      } as FastifyRequest

      const docBody = await createDocuments(docReq)

      docID = docBody.data.id

      const conversationReq = {
        body: {
          user_id: profileID,
          title: 'titulo-teste',
          is_favorite: true,
          last_message_at: '20-10-2004',
        },
      } as FastifyRequest

      const conversationBody = await createConversation(conversationReq)

      conversationID = conversationBody.data.id

      const req = {
        body: {
          conversation_id: conversationID,
          document_id: docID,
        },
      } as FastifyRequest

      const result = await createConversationDocuments(req)

      createConversationDocumentsID = result.data.id

      expect(result.success).toBe(true)
      expect(result.data.conversation_id).toBe(conversationID)
      expect(result.data.document_id).toBe(docID)
    })

    it('deve rejeitar body vazio', async () => {
      const req = {
        body: {},
      } as FastifyRequest

      await expect(createConversationDocuments(req)).rejects.toThrow()
    })

    it('deve rejeitar caso o item de action não esteja na lista de opções', async () => {
      const req = {
        body: {
          action: 'testando',
        },
      } as FastifyRequest

      await expect(createConversationDocuments(req)).rejects.toThrow()
    })
  })

  describe('getConversationDocumentsById', () => {
    it('deve retornar o documento de conversa com sucesso', async () => {
      const req = {
        params: {
          id: createConversationDocumentsID,
        },
      } as FastifyRequest

      const result = await getConversationDocumentsById(req)

      expect(result.success).toBe(true)
      expect(result.data?.conversation_id).toBe(conversationID)
      expect(result.data?.document_id).toBe(docID)
    })

    it('deve retornar erro para ID inexistente', async () => {
      const req = {
        params: { id: '00000000-0000-0000-0000-000000000000' },
      } as FastifyRequest

      await expect(getConversationDocumentsById(req)).rejects.toThrow()
    })

    it('deve retornar erro para ID inválido', async () => {
      const req = {
        params: { id: 'id-invalido' },
      } as FastifyRequest

      await expect(getConversationDocumentsById(req)).rejects.toThrow()
    })
  })

  describe('deleteConversationDocuments', () => {
    it('deve deletar o documento de conversa com sucesso', async () => {
      const req = {
        params: {
          id: createConversationDocumentsID,
        },
      } as FastifyRequest

      const result = await deleteConversationDocuments(req)

      expect(result.success).toBe(true)
    })

    it('deve confirmar que o documento de conversa foi deletado', async () => {
      const req = {
        params: { id: createConversationDocumentsID },
      } as FastifyRequest

      await expect(getConversationDocumentsById(req)).rejects.toThrow()
    })

    it('deve retornar erro ao deletar ID inexistente', async () => {
      const req = {
        params: { id: '00000000-0000-0000-0000-000000000000' },
      } as FastifyRequest

      await expect(deleteConversationDocuments(req)).rejects.toThrow()
    })

    it('deve retornar erro ao deletar ID já deletado', async () => {
      const req = {
        params: { id: createConversationDocumentsID },
      } as FastifyRequest

      await expect(deleteConversationDocuments(req)).rejects.toThrow()
    })
  })
})
