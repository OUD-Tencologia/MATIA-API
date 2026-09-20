import { describe, it, expect, afterAll, beforeAll } from 'vitest'
import {
  createDocuments,
  getDocumentsById,
  updateDocuments,
  deleteDocuments,
} from '../src/controllers/documentsController.js'
import sequelize from '../src/db.js'
import type { FastifyRequest } from 'fastify'
import { createProfile } from '../src/controllers/ProfileController.js'

describe('DocumentsController', () => {
  let createDocumentosID: string

  beforeAll(async () => {
    await sequelize.sync({ force: true })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  describe('createDocuments', () => {
    it('deve criar o documento com sucesso', async () => {
      const profileReq = {
        body: {
          nome: 'João Silva',
          email: 'joao@email.com',
          cpf: '52998224725', // CPF válido
          telefone: '19999999999',
          data_nascimento: '1990-01-01',
          profile_password: 'senha123',
        },
      } as FastifyRequest

      const profileBody = await createProfile(profileReq)

      const profileID = profileBody.data.id

      const req = {
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

      const result = await createDocuments(req)
      createDocumentosID = result.data.id

      expect(result.success).toBe(true)
      expect(result.data.original_name).toBe('Nome original')
      expect(result.data.storage_path).toBe('Caminho de armazenamento')
      expect(result.data.file_type).toBe('Tipo de arquivo')
    })

    it('deve rejeitar quando campos obrigatórios estão faltando', async () => {
      const req = {
        body: {
          original_name: 'Erro',
        },
      } as FastifyRequest

      await expect(createDocuments(req)).rejects.toThrow()
    })

    it('deve rejeitar body vazio', async () => {
      const req = {
        body: {},
      } as FastifyRequest

      await expect(createDocuments(req)).rejects.toThrow()
    })
  })

  describe('getDocumentsById', () => {
    it('deve buscar o documento com sucesso', async () => {
      const req = {
        params: {
          id: createDocumentosID,
        },
      } as FastifyRequest

      const result = await getDocumentsById(req)

      expect(result.success).toBe(true)
      expect(result.data?.id).toBe(createDocumentosID)
      expect(result.data?.original_name).toBe('Nome original')
    })

    it('deve retornar erro para ID inexistente', async () => {
      const req = {
        params: { id: '00000000-0000-0000-0000-000000000000' },
      } as FastifyRequest

      await expect(getDocumentsById(req)).rejects.toThrow()
    })

    it('deve retornar erro para ID inválido', async () => {
      const req = {
        params: { id: 'id-invalido' },
      } as FastifyRequest

      await expect(getDocumentsById(req)).rejects.toThrow()
    })
  })
  describe('updateDocuments', () => {
    it('deve fazer o update do documento com sucesso', async () => {
      const req = {
        params: {
          id: createDocumentosID,
        },
        body: {
          original_name: 'Teste de update',
        },
      } as FastifyRequest

      const result = await updateDocuments(req)

      expect(result.success).toBe(true)
      expect(result.data?.original_name).toBe('Teste de update')
    })
    it('deve atualizar mais de um campo com sucesso', async () => {
      const req = {
        params: {
          id: createDocumentosID,
        },
        body: {
          original_name: 'teste de multiplos updates',
          storage_path: 'teste de multiplos updates storage',
        },
      } as FastifyRequest

      const result = await updateDocuments(req)

      expect(result.success).toBe(true)
      expect(result.data?.original_name).toBe('teste de multiplos updates')
      expect(result.data?.storage_path).toBe(
        'teste de multiplos updates storage'
      )
    })

    it('deve retornar erro ao atualizar ID inexistente', async () => {
      const req = {
        params: { id: '00000000-0000-0000-0000-000000000000' },
        body: { nome: 'Teste' },
      } as FastifyRequest

      await expect(updateDocuments(req)).rejects.toThrow()
    })

    it('não deve atualizar com body vazio', async () => {
      const req = {
        params: { id: createDocumentosID },
        body: {},
      } as FastifyRequest

      // Dependendo da implementação, pode retornar sucesso sem alterações
      // ou pode lançar erro
      await expect(updateDocuments(req)).rejects.toThrow()
    })
  })
  describe('deleteDocuments', () => {
    it('deve deletar com sucesso o documento', async () => {
      const req = {
        params: {
          id: createDocumentosID,
        },
      } as FastifyRequest

      const result = await deleteDocuments(req)

      expect(result.success).toBe(true)
    })

    it('deve confirmar que o perfil foi deletado', async () => {
      const req = {
        params: { id: createDocumentosID },
      } as FastifyRequest

      await expect(deleteDocuments(req)).rejects.toThrow()
    })

    it('deve retornar erro ao deletar ID inexistente', async () => {
      const req = {
        params: { id: '00000000-0000-0000-0000-000000000000' },
      } as FastifyRequest

      await expect(deleteDocuments(req)).rejects.toThrow()
    })

    it('deve retornar erro ao deletar ID já deletado', async () => {
      const req = {
        params: { id: updateDocuments },
      } as FastifyRequest

      await expect(deleteDocuments(req)).rejects.toThrow()
    })
  })
})
