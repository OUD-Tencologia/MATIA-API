import { expect, it, beforeAll, describe, afterAll } from 'vitest'
import Fastify from 'fastify'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import fastifyJwt from '@fastify/jwt'
import sequelize from './helpers/registerAllModels.js'
import profileRoutes from '../src/routes/profileRoutes.js'
import Profile from '../src/models/profile.js'

// Hoje /profile é multi-tenant: toda rota exige autenticação, e o Controller
// lê `role`/`empresa_id` do token para decidir o que o usuário pode ver/criar
// (ver src/controllers/ProfileController.ts + src/repositories/UserRepository.ts).
describe('ProfileRoutes - Testes de Integração', () => {
  let app: FastifyInstance
  let adminToken: string
  let createdUserID: string

  const testUser = {
    nome: 'Usuário-de-Teste Rotas',
    email: 'test.routes@email.com',
    cpf: '52998224725',
    telefone: '11988887777',
    data_nascimento: '1995-05-15',
    profile_password: 'password123',
  }

  beforeAll(async () => {
    await sequelize.sync({ force: true })

    app = Fastify()

    await app.register(fastifyJwt, {
      secret: 'test-secret-key',
    })

    app.decorate(
      'authenticate',
      async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          await request.jwtVerify()
        } catch (err) {
          reply.code(401).send({ message: 'Unauthorized' })
        }
      }
    )

    await app.register(profileRoutes, { prefix: '/profile' })

    await app.ready()

    // SUPER-ADMIN com empresa_id null: ignora o filtro por empresa no
    // UserRepository, então consegue criar/ler/atualizar/apagar livremente.
    adminToken = app.jwt.sign({ id: 'admin-id', role: 'SUPER-ADMIN', empresa_id: null })
  })

  afterAll(async () => {
    await app.close()
    await sequelize.close()
  })

  describe('POST /profile', () => {
    it('deve retornar 401 ao tentar criar sem token (rota exige autenticação)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/profile',
        payload: testUser,
      })

      expect(response.statusCode).toBe(401)
    })

    it('deve criar um novo perfil com sucesso', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/profile',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: testUser,
      })

      const body = JSON.parse(response.body)

      expect(response.statusCode).toBe(201)
      expect(body.success).toBe(true)
      expect(body.data.nome).toBe(testUser.nome)
      expect(body.data.id).toBeDefined()

      createdUserID = body.data.id
    })

    it('deve rejeitar email duplicado', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/profile',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: { ...testUser, cpf: '71428793860', telefone: '11977776666' },
      })

      expect(response.statusCode).toBe(409)
    })
  })

  describe('GET /profile/:id', () => {
    it('deve buscar um perfil por id quando autenticado', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/profile/${createdUserID}`,
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      })

      const body = JSON.parse(response.body)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data.id).toBe(createdUserID)
    })

    it('deve retornar 401 ao tentar acessar sem token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/profile/${createdUserID}`,
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('PUT /profile/:id', () => {
    it('deve atualizar o nome do perfil', async () => {
      const novoNome = 'Nome Atualizado'

      const response = await app.inject({
        method: 'PUT',
        url: `/profile/${createdUserID}`,
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          nome: novoNome,
        },
      })

      const body = JSON.parse(response.body)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data.nome).toBe(novoNome)
    })

    it('deve retornar 401 ao tentar atualizar sem token', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/profile/${createdUserID}`,
        payload: {
          nome: 'Outro Nome',
        },
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('DELETE /profile/:id', () => {
    it('deve deletar o perfil com sucesso', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/profile/${createdUserID}`,
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      })

      expect(response.statusCode).toBe(204)

      const userAfterDelete = await Profile.findByPk(createdUserID)
      expect(userAfterDelete).toBeNull()
    })

    it('Deve retornar erro 401 ao tentar acessar sem token', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/profile/${createdUserID}`,
      })

      expect(response.statusCode).toBe(401)
    })
  })
})
