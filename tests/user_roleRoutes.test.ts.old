import { it, describe, expect, afterAll, beforeAll } from 'vitest'
import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import sequelize from '../src/db'
import userRoleRoutes from '../src/routes/user_roleRoutes'
import UserRole from '../src/models/user_roles'
import { createProfile } from '../src/controllers/ProfileController'

describe('UserRoleRoutes', () => {
  let app: FastifyInstance
  let testToken: string
  let profileID: string
  let userRoleID: string

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
          return reply.code(401).send({ message: 'Unauthorized' })
        }
      }
    )

    await app.register(userRoleRoutes, { prefix: '/user-role' })

    await app.ready()

    testToken = app.jwt.sign({ user_id: 'test-user-id', user_role: 'admin' })

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
    await app.close()
    await sequelize.close()
  })

  describe('POST /user-role', () => {
    it('Deve criar um userRole com sucesso', async () => {
      const userRole = {
        user_id: profileID,
        role: 'admin',
      }

      const response = await app.inject({
        method: 'POST',
        url: '/user-role',
        headers: {
          authorization: `Bearer ${testToken}`,
        },
        payload: userRole,
      })

      const body = JSON.parse(response.body)

      console.log(response)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data.user_id).toBe(profileID)
      expect(body.data.id).toBeDefined()

      userRoleID = body.data.id
    })
  })

  describe('GET /user-role', () => {
    it('Deve encontrar o userRole com sucesso', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/user-role/${userRoleID}`,
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      })

      const body = JSON.parse(response.body)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data.user_id).toBe(profileID)
    })

    it('Deve retornar erro 401 ao tentar acessar sem o token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/user-role/${userRoleID}`,
      })

      expect(response.statusCode).toBe(401)
    })
  })
  describe('PUT /user-role', () => {
    it('Deve atualizar o UserRole com sucesso', async () => {
      const novaAcao = 'publico'

      const response = await app.inject({
        method: 'PUT',
        url: `/user-role/${userRoleID}`,
        headers: {
          authorization: `Bearer ${testToken}`,
        },
        payload: {
          role: novaAcao,
        },
      })

      const body = JSON.parse(response.body)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data.role).toBe(novaAcao)
    })

    it('Deve retornar erro 401 ao tentar atualizar sem o token', async () => {
      const novaAcao2 = 'publico'

      const response = await app.inject({
        method: 'PUT',
        url: `/user-role/${userRoleID}`,
        payload: {
          role: novaAcao2,
        },
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('DELETE /user-role', () => {
    it('Deve deletar um UserRole com sucesso', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/user-role/${userRoleID}`,
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      })

      const body = JSON.parse(response.body)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)

      const deletedUserRole = await UserRole.findByPk(userRoleID)
      expect(deletedUserRole).toBeNull()
    })

    it('Deve retornar erro 401 ao tentar deletar sem o token', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/user-role/${userRoleID}`,
      })

      expect(response.statusCode).toBe(401)
    })
  })
})
