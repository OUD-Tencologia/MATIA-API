import { expect, it, beforeAll, afterAll, describe } from 'vitest'
import {
  createActivityLogs,
  getActivityLogsById,
  updateActivityLogs,
  deleteActivityLogs,
} from '../src/controllers/activity_logsController.js'
import sequelize from '../src/db.js'
import type { FastifyRequest } from 'fastify'
import { createProfile } from '../src/controllers/ProfileController.js'

describe('ActivityLogs', () => {
  let createActivityLogsID: string
  let profileID1: string
  let profileID2: string

  beforeAll(async () => {
    await sequelize.sync({ force: true })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  describe('createActivityLogs', () => {
    it('deve criar um ActivityLog com sucesso', async () => {
      const profileReq1 = {
        body: {
          nome: 'Usuário-de-Teste Rotas',
          email: 'test.routes@email.com',
          cpf: '52998224725',
          telefone: '11988887777',
          data_nascimento: '1995-05-15',
          profile_password: 'password123',
        },
      } as FastifyRequest

      const profileBody1 = await createProfile(profileReq1)

      profileID1 = profileBody1.data.id

      const profileReq2 = {
        body: {
          nome: 'Usuário-de-Teste Rtas',
          email: 'test.routss@email.com',
          cpf: '70963685074',
          telefone: '11988887677',
          data_nascimento: '1995-04-15',
          profile_password: 'password1234',
        },
      } as FastifyRequest

      const profileBody2 = await createProfile(profileReq2)

      profileID2 = profileBody2.data.id

      const req = {
        body: {
          user_id: profileID1,
          action: 'login',
          entity_id: profileID2,
          entity_type: 'document',
        },
      } as FastifyRequest

      const result = await createActivityLogs(req)

      createActivityLogsID = result.data.id

      expect(result.success).toBe(true)
      expect(result.data.action).toBe('login')
      expect(result.data.user_id).toBe(profileID1)
      expect(result.data.entity_type).toBe('document')
    })

    it('deve rejeitar quando campos obrigatórios estão faltando', async () => {
      const req = {
        body: {
          entity_type: 'user',
        },
      } as FastifyRequest

      await expect(createActivityLogs(req)).rejects.toThrow()
    })

    it('deve rejeitar body vazio', async () => {
      const req = {
        body: {},
      } as FastifyRequest

      await expect(createActivityLogs(req)).rejects.toThrow()
    })

    it('deve rejeitar caso o item de action não esteja na lista de opções', async () => {
      const req = {
        body: {
          action: 'testando',
        },
      } as FastifyRequest

      await expect(createActivityLogs(req)).rejects.toThrow()
    })

    it('deve rejeitar caso o item de entity_type não esteja na lista de opções', async () => {
      const req = {
        body: {
          entity_type: 'testando',
        },
      } as FastifyRequest

      await expect(createActivityLogs(req)).rejects.toThrow()
    })
  })

  describe('getActivityLogsById', () => {
    it('Deve retornar o ActivityLog com sucesso', async () => {
      const req = {
        params: {
          id: createActivityLogsID,
        },
      } as FastifyRequest

      const result = await getActivityLogsById(req)

      expect(result.success).toBe(true)
      expect(result.data?.user_id).toBe(profileID1)
    })

    it('deve retornar erro para ID inexistente', async () => {
      const req = {
        params: { id: '00000000-0000-0000-0000-000000000000' },
      } as FastifyRequest

      await expect(getActivityLogsById(req)).rejects.toThrow()
    })

    it('deve retornar erro para ID inválido', async () => {
      const req = {
        params: { id: 'id-invalido' },
      } as FastifyRequest

      await expect(getActivityLogsById(req)).rejects.toThrow()
    })
  })

  describe('updateMessages', () => {
    it('Deve atualizar o ActivityLog com sucesso', async () => {
      const req = {
        params: {
          id: createActivityLogsID,
        },
        body: {
          entity_type: 'user',
        },
      } as FastifyRequest

      const result = await updateActivityLogs(req)

      expect(result.success).toBe(true)
      expect(result.data?.entity_type).toBe('user')
    })

    it('deve atualizar múltiplos campos', async () => {
      const req = {
        params: { id: createActivityLogsID },
        body: {
          ip_address: 'testando-multiplos-mudando-o-ip',
          entity_type: 'conversation',
        },
      } as FastifyRequest

      const result = await updateActivityLogs(req)

      expect(result.success).toBe(true)
      expect(result.data?.ip_address).toBe('testando-multiplos-mudando-o-ip')
      expect(result.data?.entity_type).toBe('conversation')
    })

    it('deve rejeitar body vazio', async () => {
      const req = {
        body: {},
      } as FastifyRequest

      await expect(updateActivityLogs(req)).rejects.toThrow()
    })
  })

  describe('deleteActivityLogs', () => {
    it('Deve deletar o ActivityLog com sucesso', async () => {
      const req = {
        params: {
          id: createActivityLogsID,
        },
      } as FastifyRequest

      const result = await deleteActivityLogs(req)

      expect(result.success).toBe(true)
    })

    it('deve confirmar que o ActivityLog foi deletado', async () => {
      const req = {
        params: { id: createActivityLogsID },
      } as FastifyRequest

      await expect(getActivityLogsById(req)).rejects.toThrow()
    })

    it('deve retornar erro ao deletar ID inexistente', async () => {
      const req = {
        params: { id: '00000000-0000-0000-0000-000000000000' },
      } as FastifyRequest

      await expect(deleteActivityLogs(req)).rejects.toThrow()
    })

    it('deve retornar erro ao deletar ID já deletado', async () => {
      const req = {
        params: { id: createActivityLogsID },
      } as FastifyRequest

      await expect(deleteActivityLogs(req)).rejects.toThrow()
    })
  })
})
