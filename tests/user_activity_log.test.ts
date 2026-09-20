import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  createUserActivityLog,
  getUserActivityLogById,
  updateUserActivityLog,
  deleteUserActivityLog,
} from '../src/controllers/user_activity_logController.js'
import sequelize from '../src/db.js'
import type { FastifyRequest } from 'fastify'
import { createProfile } from '../src/controllers/ProfileController.js'

describe('UserActivityLogController', () => {
  let createLogID: string
  let profileID: string

  beforeAll(async () => {
    await sequelize.sync({ force: true })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  describe('createUserActivityLog', () => {
    it('deve criar um log de atividades dos usuarios com dados válidos', async () => {
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

      profileID = profileBody.data.id

      const req = {
        body: {
          user_id: profileID,
          action_type: 'login',
          resource_type: 'resource de teste',
          resource_id: 'id-do-resource',
          ip_address: '200.148.12.188',
          user_agent: 'Chrome',
        },
      } as FastifyRequest

      const result = await createUserActivityLog(req)

      createLogID = result.data.id

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('id')
      expect(result.data.action_type).toBe('login')
      expect(result.data.ip_address).toBe('200.148.12.188')
      expect(result.data.user_agent).toBe('Chrome')
    })

    it('deve rejeitar quando campos obrigatórios estão faltando', async () => {
      const req = {
        body: {},
      } as FastifyRequest

      await expect(createUserActivityLog(req)).rejects.toThrow()
    })

    it('deve rejeitar quando o dado inserido não está presente nas opções pré-definidas', async () => {
      const req = {
        body: {
          action_type: 'teste',
        },
      } as FastifyRequest

      await expect(createUserActivityLog(req)).rejects.toThrow()
    })
  })

  describe('getUserActivityLogById', () => {
    it('deve retornar um perfil existente pelo ID', async () => {
      const req = {
        params: { id: createLogID },
      } as FastifyRequest

      const result = await getUserActivityLogById(req)

      expect(result.success).toBe(true)
      expect(result.data.id).toBe(createLogID)
      expect(result.data.action_type).toBe('login')
      expect(result.data).toHaveProperty('action_type')
    })

    it('deve retornar erro para ID inexistente', async () => {
      const req = {
        params: { id: '00000000-0000-0000-0000-000000000000' },
      } as FastifyRequest

      await expect(getUserActivityLogById(req)).rejects.toThrow()
    })

    it('deve retornar erro para ID inválido', async () => {
      const req = {
        params: { id: 'id-inválido' },
      } as FastifyRequest

      await expect(getUserActivityLogById(req)).rejects.toThrow()
    })
  })

  describe('updateUserActivityLog', () => {
    it('deve atualizar o tipo de ação documento', async () => {
      const req = {
        params: {
          id: createLogID,
        },
        body: {
          action_type: 'logout',
        },
      } as FastifyRequest

      const result = await updateUserActivityLog(req)

      expect(result.success).toBe(true)
      expect(result.data?.action_type).toBe('logout')
    })

    it('deve atualizar os detalhes do documento', async () => {
      const req = {
        params: {
          id: createLogID,
        },
        body: {
          details: 'Detalhe novo',
        },
      } as FastifyRequest

      const result = await updateUserActivityLog(req)

      expect(result.success).toBe(true)
      expect(result.data?.details).toBe('Detalhe novo')
    })

    it('deve atualizar múltiplos campos', async () => {
      const req = {
        params: {
          id: createLogID,
        },
        body: {
          action_type: 'profile_updated',
          details: 'Multiplos updates',
        },
      } as FastifyRequest

      const result = await updateUserActivityLog(req)

      expect(result.success).toBe(true)
      expect(result.data?.action_type).toBe('profile_updated')
      expect(result.data?.details).toBe('Multiplos updates')
    })

    it('deve me devolver um erro de ID inválido', async () => {
      const req = {
        params: {
          id: '00000000-0000-0000-0000-000000000000',
        },
        body: {
          details: 'Teste de erro',
        },
      } as FastifyRequest

      await expect(updateUserActivityLog(req)).rejects.toThrow()
    })

    it('não deve atualizar com body vazio', async () => {
      const req = {
        params: {
          id: createLogID,
        },
        body: {},
      } as FastifyRequest

      await expect(updateUserActivityLog(req)).rejects.toThrow()
    })
  })

  describe('deleteUserActivityLog', () => {
    it('deve deletar um documento existente', async () => {
      const req = {
        params: {
          id: createLogID,
        },
      } as FastifyRequest

      const result = await deleteUserActivityLog(req)

      expect(result.success).toBe(true)
    })

    it('deve confirmar que o perfil foi deletado', async () => {
      const req = {
        params: {
          id: createLogID,
        },
      } as FastifyRequest

      await expect(getUserActivityLogById(req)).rejects.toThrow()
    })

    it('deve retornar erro de ID inexistente', async () => {
      const req = {
        params: {
          id: '00000000-0000-0000-0000-000000000000',
        },
      } as FastifyRequest

      await expect(deleteUserActivityLog(req)).rejects.toThrow()
    })

    it('deve retornar erro ao deletar ID já deletado', async () => {
      const req = {
        params: {
          id: createLogID,
        },
      } as FastifyRequest

      await expect(deleteUserActivityLog(req)).rejects.toThrow()
    })
  })
})
