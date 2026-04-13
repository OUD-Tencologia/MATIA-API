import { expect, it, beforeAll, afterAll, describe } from 'vitest'
import {
  createConversation,
  getConversationById,
  updateConversation,
  deleteConversation,
} from '../src/controllers/conversationController.js'
import sequelize from '../src/db.js'
import type { FastifyRequest } from 'fastify'
import { createProfile } from '../src/controllers/ProfileController.js'

describe('ConversationController', () => {
  let createConversationID: string
  let profileID: string

  beforeAll(async () => {
    await sequelize.sync({ force: true })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  describe('createConversation', () => {
    it('deve criar um conversation com sucesso', async () => {
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

      const req = {
        body: {
          user_id: profileID,
          title: 'titulo-teste',
          is_favorite: true,
          last_message_at: '20-10-2004',
        },
      } as FastifyRequest

      const result = await createConversation(req)

      createConversationID = result.data.id

      expect(result.success).toBe(true)
      expect(result.data.title).toBe('titulo-teste')
      expect(result.data.user_id).toBe(profileID)
      expect(result.data.is_favorite).toBe(true)
    })

    it('deve rejeitar quando campos obrigatórios estão faltando', async () => {
      const req = {
        body: {
          title: 'titulo-teste',
        },
      } as FastifyRequest

      await expect(createConversation(req)).rejects.toThrow()
    })

    it('deve rejeitar body vazio', async () => {
      const req = {
        body: {},
      } as FastifyRequest

      await expect(createConversation(req)).rejects.toThrow()
    })
  })

  describe('getConversationById', () => {
    it('deve retornar o conversation com sucesso', async () => {
      const req = {
        params: {
          id: createConversationID,
        },
      } as FastifyRequest

      const result = await getConversationById(req)

      expect(result.success).toBe(true)
      expect(result.data?.user_id).toBe(profileID)
    })

    it('deve retornar erro para ID inexistente', async () => {
      const req = {
        params: { id: '00000000-0000-0000-0000-000000000000' },
      } as FastifyRequest

      await expect(getConversationById(req)).rejects.toThrow()
    })

    it('deve retornar erro para ID inválido', async () => {
      const req = {
        params: { id: 'id-invalido' },
      } as FastifyRequest

      await expect(getConversationById(req)).rejects.toThrow()
    })
  })

  describe('updateConversation', () => {
    it('deve atualizar o conversation com sucesso', async () => {
      const req = {
        params: {
          id: createConversationID,
        },
        body: {
          title: 'testando-update',
        },
      } as FastifyRequest

      const result = await updateConversation(req)

      expect(result.success).toBe(true)
      expect(result.data?.title).toBe('testando-update')
    })

    it('deve atualizar múltiplos campos', async () => {
      const req = {
        params: { id: createConversationID },
        body: {
          title: 'testando-multiplos',
          is_favorite: false,
        },
      } as FastifyRequest

      const result = await updateConversation(req)

      expect(result.success).toBe(true)
      expect(result.data?.is_favorite).toBe(false)
      expect(result.data?.title).toBe('testando-multiplos')
    })

    it('deve rejeitar quando campos obrigatórios estão faltando', async () => {
      const req = {
        body: {
          original_name: 'Erro',
        },
      } as FastifyRequest

      await expect(updateConversation(req)).rejects.toThrow()
    })

    it('deve rejeitar body vazio', async () => {
      const req = {
        body: {},
      } as FastifyRequest

      await expect(updateConversation(req)).rejects.toThrow()
    })
  })

  describe('deleteConversation', () => {
    it('deve deletar o conversation com sucesso', async () => {
      const req = {
        params: {
          id: createConversationID,
        },
      } as FastifyRequest

      const result = await deleteConversation(req)

      expect(result.success).toBe(true)
    })

    it('deve confirmar que o conversation foi deletado', async () => {
      const req = {
        params: { id: createConversationID },
      } as FastifyRequest

      await expect(getConversationById(req)).rejects.toThrow()
    })

    it('deve retornar erro ao deletar ID inexistente', async () => {
      const req = {
        params: { id: '00000000-0000-0000-0000-000000000000' },
      } as FastifyRequest

      await expect(deleteConversation(req)).rejects.toThrow()
    })

    it('deve retornar erro ao deletar ID já deletado', async () => {
      const req = {
        params: { id: createConversationID },
      } as FastifyRequest

      await expect(deleteConversation(req)).rejects.toThrow()
    })
  })
})
