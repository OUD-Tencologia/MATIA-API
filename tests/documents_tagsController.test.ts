import { describe, it, expect, afterAll, beforeAll } from 'vitest'
import {
  createDocumentsTags,
  getDocumentsTagsById,
  updateDocumentsTags,
  deleteDocumentsTags,
} from '../src/controllers/documents_tagsController.js'
import sequelize from '../src/db.js'
import type { FastifyRequest } from 'fastify'

describe('DocumentsTagsController', () => {
  let createDocumentsTagsIDs: string

  beforeAll(async () => {
    await sequelize.sync({ force: true })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  describe('createDocumentsTags', () => {
    it('Deve criar o relatório com sucesso', async () => {
      const req = {
        body: {
          name: 'nome-de-tag',
          color: 'vermelho',
        },
      } as FastifyRequest

      const result = await createDocumentsTags(req)

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('id')
      expect(result.data.name).toBe('nome-de-tag')
      expect(result.data.color).toBe('vermelho')

      createDocumentsTagsIDs = result.data.id
    })

    it('Deve rejeitar caso a requisição esteja vazia', async () => {
      const req = {
        body: {},
      } as FastifyRequest

      await expect(createDocumentsTags(req)).rejects.toThrow()
    })

    it('Deve rejeitar caso a requisição não contenha dados obrigatórios', async () => {
      const req = {
        body: {
          color: 'cor-teste',
        },
      } as FastifyRequest

      await expect(createDocumentsTags(req)).rejects.toThrow()
    })
  })

  describe('getDocumentsTagsByID', () => {
    it('Deve encontrar o log com sucesso', async () => {
      const req = {
        params: {
          id: createDocumentsTagsIDs,
        },
      } as FastifyRequest

      const result = await getDocumentsTagsById(req)

      expect(result.success).toBe(true)
      expect(result.data?.name).toBe('nome-de-tag')
      expect(result.data?.color).toBe('vermelho')
    })

    it('Deve retornar erro para ID inexistente', async () => {
      const req = {
        params: {
          id: '00000000-0000-0000-0000-000000000000',
        },
      } as FastifyRequest

      await expect(getDocumentsTagsById(req)).rejects.toThrow()
    })

    it('Deve retornar erro para ID inválido', async () => {
      const req = {
        params: {
          id: 'ID inválido',
        },
      } as FastifyRequest

      await expect(getDocumentsTagsById(req)).rejects.toThrow()
    })
  })

  describe('updateDocumentsTags', () => {
    it('Deve atualizar o log om sucesso', async () => {
      const req = {
        params: {
          id: createDocumentsTagsIDs,
        },
        body: {
          name: 'nome-novo-teste',
          color: 'azul',
        },
      } as FastifyRequest

      const result = await updateDocumentsTags(req)

      expect(result.success).toBe(true)

      const getReq = {
        params: {
          id: createDocumentsTagsIDs,
        },
      } as FastifyRequest
      const getResult = await getDocumentsTagsById(getReq)
      expect(getResult.data?.name).toBe('nome-novo-teste')
      expect(getResult.data?.color).toBe('azul')
    })

    it('Deve atualizar o log mesmo que tenha somente um item na requisição', async () => {
      const req = {
        params: {
          id: createDocumentsTagsIDs,
        },
        body: {
          name: 'nome-teste-uma-requisicao',
        },
      } as FastifyRequest

      const result = await updateDocumentsTags(req)

      expect(result.success).toBe(true)

      const getReq = {
        params: {
          id: createDocumentsTagsIDs,
        },
      } as FastifyRequest
      const getResult = await getDocumentsTagsById(getReq)
      expect(getResult.data?.name).toBe('nome-teste-uma-requisicao')
    })

    it('Deve retornar erro para ID inválido', async () => {
      const req = {
        params: {
          id: 'ID inválido',
        },
      } as FastifyRequest

      await expect(updateDocumentsTags(req)).rejects.toThrow()
    })

    it('Deve retornar erro para ID inexistente', async () => {
      const req = {
        params: {
          id: '00000000-0000-0000-0000-000000000000',
        },
      } as FastifyRequest

      await expect(updateDocumentsTags(req)).rejects.toThrow()
    })
  })

  describe('deleteDocumentsTags', () => {
    it('Deve deletar o log om sucesso', async () => {
      const req = {
        params: {
          id: createDocumentsTagsIDs,
        },
      } as FastifyRequest

      const result = await deleteDocumentsTags(req)

      expect(result.success).toBe(true)
    })

    it('Deve confirmar que deletou com sucesso', async () => {
      const req = {
        params: {
          id: createDocumentsTagsIDs,
        },
      } as FastifyRequest

      await expect(getDocumentsTagsById(req)).rejects.toThrow()
    })

    it('Deve retornar erro para ID inválido', async () => {
      const req = {
        params: {
          id: 'ID inválido',
        },
      } as FastifyRequest

      await expect(deleteDocumentsTags(req)).rejects.toThrow()
    })

    it('Deve retornar erro para ID inexistente', async () => {
      const req = {
        params: {
          id: '00000000-0000-0000-0000-000000000000',
        },
      } as FastifyRequest

      await expect(deleteDocumentsTags(req)).rejects.toThrow()
    })
  })
})
