import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { FastifyRequest } from 'fastify'
import sequelize from './helpers/registerAllModels.js'
import { ProfileController } from '../src/controllers/ProfileController.js'
import { createProfile } from './helpers/createTestProfile.js'
import { createMockReply } from './helpers/mockReply.js'

// ProfileController.ts virou uma classe estática multi-tenant: cada método
// recebe (request, reply) e lê `role`/`empresa_id` de `request.user` (o
// payload do JWT). Aqui testamos os métodos diretamente, sem subir um
// servidor Fastify (isso já é coberto, via HTTP, por profileRoutes.test.ts).
describe('ProfileController', () => {
  let adminUser: { id: string; role: 'SUPER-ADMIN'; empresa_id: null }
  let createdUserId: string

  beforeAll(async () => {
    await sequelize.sync({ force: true })
    adminUser = { id: 'admin-id', role: 'SUPER-ADMIN', empresa_id: null }
  })

  afterAll(async () => {
    await sequelize.close()
  })

  describe('criar', () => {
    it('deve criar um perfil com dados válidos', async () => {
      const { reply, result } = createMockReply()
      const request = {
        user: adminUser,
        body: {
          nome: 'João Silva',
          email: 'joao@email.com',
          cpf: '52998224725',
          telefone: '19999999999',
          data_nascimento: '1990-01-01',
          profile_password: 'senha123',
        },
      } as unknown as FastifyRequest

      await ProfileController.criar(request, reply)

      expect(result.statusCode).toBe(201)
      expect(result.body.success).toBe(true)
      expect(result.body.data.nome).toBe('João Silva')
      expect(result.body.data).not.toHaveProperty('profile_password')

      createdUserId = result.body.data.id
    })

    it('deve rejeitar email duplicado', async () => {
      const { reply } = createMockReply()
      const request = {
        user: adminUser,
        body: {
          nome: 'Outro João',
          email: 'joao@email.com',
          cpf: '71428793860',
          telefone: '19888888888',
          data_nascimento: '1995-05-15',
          profile_password: 'senha456',
        },
      } as unknown as FastifyRequest

      await expect(ProfileController.criar(request, reply)).rejects.toThrow()
    })
  })

  describe('buscar', () => {
    it('deve retornar um perfil existente pelo ID', async () => {
      const { reply, result } = createMockReply()
      const request = {
        params: { id: createdUserId },
        user: adminUser,
      } as unknown as FastifyRequest

      await ProfileController.buscar(request, reply)

      expect(result.body.success).toBe(true)
      expect(result.body.data.id).toBe(createdUserId)
      expect(result.body.data).not.toHaveProperty('profile_password')
    })

    it('deve rejeitar ID inexistente', async () => {
      const { reply } = createMockReply()
      const request = {
        params: { id: '00000000-0000-0000-0000-000000000000' },
        user: adminUser,
      } as unknown as FastifyRequest

      await expect(ProfileController.buscar(request, reply)).rejects.toThrow()
    })
  })

  describe('atualizar', () => {
    it('deve atualizar o nome do perfil', async () => {
      const { reply, result } = createMockReply()
      const request = {
        params: { id: createdUserId },
        user: adminUser,
        body: { nome: 'João Silva Atualizado' },
      } as unknown as FastifyRequest

      await ProfileController.atualizar(request, reply)

      expect(result.body.success).toBe(true)
      expect(result.body.data.nome).toBe('João Silva Atualizado')
    })
  })

  describe('excluir', () => {
    it('deve deletar um perfil existente', async () => {
      const { reply, result } = createMockReply()
      const request = {
        params: { id: createdUserId },
        user: adminUser,
      } as unknown as FastifyRequest

      await ProfileController.excluir(request, reply)

      expect(result.statusCode).toBe(204)
    })

    it('deve rejeitar ao deletar um ID já deletado', async () => {
      const { reply } = createMockReply()
      const request = {
        params: { id: createdUserId },
        user: adminUser,
      } as unknown as FastifyRequest

      await expect(ProfileController.excluir(request, reply)).rejects.toThrow()
    })
  })

  describe('getSelf', () => {
    it('deve retornar o próprio perfil do usuário logado', async () => {
      const { data: created } = await createProfile({
        body: {
          nome: 'Usuário Self',
          email: 'self@email.com',
          cpf: '70963685074',
          telefone: '19977776666',
          data_nascimento: '1992-02-02',
          profile_password: 'senha123',
        },
      })

      const { reply, result } = createMockReply()
      const request = { user: { id: created.id } } as unknown as FastifyRequest

      await ProfileController.getSelf(request, reply)

      expect(result.statusCode).toBe(200)
      expect(result.body.id).toBe(created.id)
    })
  })

  describe('listar', () => {
    it('lista os perfis visíveis para um SUPER-ADMIN', async () => {
      const { reply, result } = createMockReply()
      const request = { user: adminUser } as unknown as FastifyRequest

      await ProfileController.listar(request, reply)

      expect(result.body.success).toBe(true)
      expect(Array.isArray(result.body.data)).toBe(true)
      expect(result.body.data.length).toBeGreaterThan(0)
    })
  })
})
