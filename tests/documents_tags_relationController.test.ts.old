import { describe, it, expect, afterAll, beforeAll } from 'vitest'
import {
  createDocumentsTagsRelation,
  getDocumentsTagsRelationById,
  deleteDocumentsTagsRelation,
} from '../src/controllers/documents_tags_relationController.js'
import sequelize from '../src/db.js'
import type { FastifyRequest } from 'fastify'
import { createProfile } from '../src/controllers/ProfileController.js'
import { createDocuments } from '../src/controllers/documentsController.js'
import { createDocumentsTags } from '../src/controllers/documents_tagsController.js'

describe('DocumentsTagRelation', async () => {
  let documentsTagsRelationID: string
  let docID: string
  let docTagID: string

  beforeAll(async () => {
    await sequelize.sync({ force: true })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  describe('createDocumentsTagsRelation', () => {
    it('Deve criar o relatório com sucesso', async () => {
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

      const docTagReq = {
        body: {
          name: 'nome-de-tag',
          color: 'vermelho',
        },
      } as FastifyRequest

      const docTagBody = await createDocumentsTags(docTagReq)

      docTagID = docTagBody.data.id

      const req = {
        body: {
          tag_id: docTagID,
          document_id: docID,
        },
      } as FastifyRequest

      const result = await createDocumentsTagsRelation(req)

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('id')
      expect(result.data.document_id).toBe(docID)
      expect(result.data.tag_id).toBe(docTagID)

      documentsTagsRelationID = result.data.id
    })

    it('Deve rejeitar caso a requisição esteja vazia', async () => {
      const req = {
        body: {},
      } as FastifyRequest

      await expect(createDocumentsTagsRelation(req)).rejects.toThrow()
    })

    it('Deve rejeitar caso a requisição não contenha dados obrigatórios', async () => {
      const req = {
        body: {
          document_id: 'teste-erro',
        },
      } as FastifyRequest

      await expect(createDocumentsTagsRelation(req)).rejects.toThrow()
    })
  })

  describe('getDocumentsTagsRelationByID', () => {
    it('Deve encontrar a relaçao com sucesso', async () => {
      const req = {
        params: {
          id: documentsTagsRelationID,
        },
      } as FastifyRequest

      const result = await getDocumentsTagsRelationById(req)

      expect(result.success).toBe(true)
      expect(result.data?.document_id).toBe(docID)
      expect(result.data?.tag_id).toBe(docTagID)
    })

    it('Deve retornar erro para ID inexistente', async () => {
      const req = {
        params: {
          id: '00000000-0000-0000-0000-000000000000',
        },
      } as FastifyRequest

      await expect(getDocumentsTagsRelationById(req)).rejects.toThrow()
    })

    it('Deve retornar erro para ID inválido', async () => {
      const req = {
        params: {
          id: 'ID inválido',
        },
      } as FastifyRequest

      await expect(getDocumentsTagsRelationById(req)).rejects.toThrow()
    })
  })

  describe('deleteDocumentsTagsRelation', () => {
    it('Deve deletar o log om sucesso', async () => {
      const req = {
        params: {
          id: documentsTagsRelationID,
        },
      } as FastifyRequest

      const result = await deleteDocumentsTagsRelation(req)

      expect(result.success).toBe(true)
    })

    it('Deve confirmar que deletou com sucesso', async () => {
      const req = {
        params: {
          id: documentsTagsRelationID,
        },
      } as FastifyRequest

      await expect(getDocumentsTagsRelationById(req)).rejects.toThrow()
    })

    it('Deve retornar erro para ID inválido', async () => {
      const req = {
        params: {
          id: 'ID inválido',
        },
      } as FastifyRequest

      await expect(deleteDocumentsTagsRelation(req)).rejects.toThrow()
    })

    it('Deve retornar erro para ID inexistente', async () => {
      const req = {
        params: {
          id: '00000000-0000-0000-0000-000000000000',
        },
      } as FastifyRequest

      await expect(deleteDocumentsTagsRelation(req)).rejects.toThrow()
    })
  })
})
