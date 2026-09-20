import { expect, it, beforeAll, afterAll, describe } from 'vitest'
import {
  createDocumentsAnalisys,
  getDocumentsAnalisysById,
  updateDocumentsAnalisys,
  deleteDocumentsAnalisys,
} from '../src/controllers/documents_analysisController.js'
import sequelize from '../src/db.js'
import type { FastifyRequest } from 'fastify'
import { createProfile } from '../src/controllers/ProfileController.js'
import { createDocuments } from '../src/controllers/documentsController.js'
import { createConversation } from '../src/controllers/conversationController.js'

describe('DocumentAnalysisController', () => {
  let createDocumentsAnalisysID: string
  let docID: string
  let conversationID: string

  beforeAll(async () => {
    await sequelize.sync({ force: true })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  describe('createDocumentsAnalisys', () => {
    it('deve criar uma analise de documento com sucesso', async () => {
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

      const profileID = profileBody.data.id

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
          analysis_type: 'sumario',
          confidence_score: 7,
        },
      } as FastifyRequest

      const result = await createDocumentsAnalisys(req)

      createDocumentsAnalisysID = result.data.id

      expect(result.success).toBe(true)
      expect(result.data.conversation_id).toBe(conversationID)
      expect(result.data.document_id).toBe(docID)
      expect(result.data.analysis_type).toBe('sumario')
    })

    it('deve rejeitar quando campos obrigatórios estão faltando', async () => {
      const req = {
        body: {
          entity_type: 'user',
        },
      } as FastifyRequest

      await expect(createDocumentsAnalisys(req)).rejects.toThrow()
    })

    it('deve rejeitar body vazio', async () => {
      const req = {
        body: {},
      } as FastifyRequest

      await expect(createDocumentsAnalisys(req)).rejects.toThrow()
    })

    it('deve rejeitar caso o item de action não esteja na lista de opções', async () => {
      const req = {
        body: {
          analysis_type: 'fora',
        },
      } as FastifyRequest

      await expect(createDocumentsAnalisys(req)).rejects.toThrow()
    })
  })

  describe('getDocumentsAnalisysById', () => {
    it('deve retornar a análise de documento com sucesso', async () => {
      const req = {
        params: {
          id: createDocumentsAnalisysID,
        },
      } as FastifyRequest

      const result = await getDocumentsAnalisysById(req)

      expect(result.success).toBe(true)
      expect(result.data?.conversation_id).toBe(conversationID)
    })

    it('deve retornar erro para ID inexistente', async () => {
      const req = {
        params: { id: '00000000-0000-0000-0000-000000000000' },
      } as FastifyRequest

      await expect(getDocumentsAnalisysById(req)).rejects.toThrow()
    })

    it('deve retornar erro para ID inválido', async () => {
      const req = {
        params: { id: 'id-invalido' },
      } as FastifyRequest

      await expect(getDocumentsAnalisysById(req)).rejects.toThrow()
    })
  })

  describe('updateDocumentsAnalisys', () => {
    it('deve atualizar a análise de documento com sucesso', async () => {
      const req = {
        params: {
          id: createDocumentsAnalisysID,
        },
        body: {
          confidence_score: 9,
        },
      } as FastifyRequest

      const result = await updateDocumentsAnalisys(req)

      expect(result.success).toBe(true)
      expect(result.data?.analysis_type).toBe('sumario')
    })

    it('deve atualizar múltiplos campos', async () => {
      const req = {
        params: { id: createDocumentsAnalisysID },
        body: {
          confidence_score: 7,
          analysis_type: 'sumario',
        },
      } as FastifyRequest

      const result = await updateDocumentsAnalisys(req)

      expect(result.success).toBe(true)
      expect(result.data?.confidence_score).toBe(7)
      expect(result.data?.analysis_type).toBe('sumario')
    })

    it('deve rejeitar body vazio', async () => {
      const req = {
        body: {},
      } as FastifyRequest

      await expect(updateDocumentsAnalisys(req)).rejects.toThrow()
    })
  })

  describe('deleteDocumentsAnalisys', () => {
    it('deve deletar a análise de documento com sucesso', async () => {
      const req = {
        params: {
          id: createDocumentsAnalisysID,
        },
      } as FastifyRequest

      const result = await deleteDocumentsAnalisys(req)

      expect(result.success).toBe(true)
    })

    it('deve confirmar que a análise de documento foi deletada', async () => {
      const req = {
        params: { id: createDocumentsAnalisysID },
      } as FastifyRequest

      await expect(getDocumentsAnalisysById(req)).rejects.toThrow()
    })

    it('deve retornar erro ao deletar ID inexistente', async () => {
      const req = {
        params: { id: '00000000-0000-0000-0000-000000000000' },
      } as FastifyRequest

      await expect(deleteDocumentsAnalisys(req)).rejects.toThrow()
    })

    it('deve retornar erro ao deletar ID já deletado', async () => {
      const req = {
        params: { id: createDocumentsAnalisysID },
      } as FastifyRequest

      await expect(deleteDocumentsAnalisys(req)).rejects.toThrow()
    })
  })
})
