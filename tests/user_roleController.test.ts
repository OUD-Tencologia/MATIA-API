import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import {
  createUserRole,
  getUserRoleById,
  updateUserRole,
  deleteUserRole,
} from '../src/controllers/user_roleController.js'
import type { FastifyRequest } from 'fastify'
import sequelize from '../src/db.js'
import { createProfile } from '../src/controllers/ProfileController.js'

describe('UserRoleController', () => {
  let createUserRoleId: string
  let profileID: string

  beforeAll(async () => {
    await sequelize.sync({ force: true })

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
  })

  afterAll(async () => {
    await sequelize.close()
  })

  describe('createUserRole', () => {
    it('deve criar um log com sucesso', async () => {
      const req = {
        body: {
          user_id: profileID,
          role: 'admin',
        },
      } as FastifyRequest

      const result = await createUserRole(req)

      expect(result.success).toBe(true)
      expect(result.data.role).toBe('admin')
      expect(result.data).toHaveProperty('role')

      createUserRoleId = result.data.id
    })

    it('deve retornar erro ao enviar a requisição sem os campos obrigatórios', async () => {
      const req = {
        body: {
          role: undefined,
        },
      } as FastifyRequest

      await expect(createUserRole(req)).rejects.toThrow()
    })

    it('deve retornar erro ao enviar a requisição vazia', async () => {
      const req = {
        body: {},
      } as FastifyRequest

      await expect(createUserRole(req)).rejects.toThrow()
    })

    it('deve retornar erro ao enviar a requisição com campos nao presentes nas opções', async () => {
      const req = {
        body: {
          user_id: profileID,
          role: 'administrador',
        },
      } as FastifyRequest

      await expect(createUserRole(req)).rejects.toThrow()
    })
  })

  describe('getUserRoleById', () => {
    it('deve encontrar o log com sucesso', async () => {
      const req = {
        params: {
          id: createUserRoleId,
        },
      } as FastifyRequest

      const result = await getUserRoleById(req)

      expect(result.success).toBe(true)
      expect(result.data?.role).toBe('admin')
    })

    it('deve retornar erro para ID inexistente', async () => {
      const req = {
        params: {
          id: '00000000-0000-0000-0000-000000000000',
        },
      } as FastifyRequest

      await expect(getUserRoleById(req)).rejects.toThrow()
    })

    it('deve retornar erro para ID inválido', async () => {
      const req = {
        params: {
          id: 'ID inválido',
        },
      } as FastifyRequest

      await expect(getUserRoleById(req)).rejects.toThrow()
    })
  })

  describe('updateUserRole', () => {
    it('deve retornar sucesso ao atualizar o log', async () => {
      const req = {
        params: {
          id: createUserRoleId,
        },
        body: {
          role: 'Teste',
        },
      } as FastifyRequest

      const result = await updateUserRole(req)

      expect(result.success).toBe(true)
      expect(result.data?.role).toBe('Teste')
    })

    it('deve retornar erro ao atualizar ID inexistente', async () => {
      const req = {
        params: { id: '00000000-0000-0000-0000-000000000000' },
        body: { nome: 'Teste' },
      } as FastifyRequest

      await expect(updateUserRole(req)).rejects.toThrow()
    })

    it('não deve atualizar com body vazio', async () => {
      const req = {
        params: {
          id: createUserRoleId,
        },
        body: {},
      } as FastifyRequest

      await expect(updateUserRole(req)).rejects.toThrow()
    })
  })

  describe('deleteUserRole', () => {
    it('deve deletar o log com sucesso', async () => {
      const req = {
        params: {
          id: createUserRoleId,
        },
      } as FastifyRequest

      const result = await deleteUserRole(req)

      expect(result.success).toBe(true)
    })

    it('deve confirmar que o log foi deletado', async () => {
      const req = {
        params: {
          id: createUserRoleId,
        },
      } as FastifyRequest

      await expect(getUserRoleById(req)).rejects.toThrow()
    })

    it('deve retornar erro ao deletar ID inexistente', async () => {
      const req = {
        params: { id: '00000000-0000-0000-0000-000000000000' },
      } as FastifyRequest

      await expect(deleteUserRole(req)).rejects.toThrow()
    })
  })
})
