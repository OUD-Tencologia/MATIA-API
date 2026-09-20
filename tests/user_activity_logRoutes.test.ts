import { expect, it, describe, afterAll, beforeAll } from 'vitest'
import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import sequelize from '../src/db.js'
import userActivityLogsRoutes from '../src/routes/user_activity_logRoutes.js'
import UserActivityLog from '../src/models/user_activity_log.js'
import { createProfile } from '../src/controllers/ProfileController.js'

describe('UserActivityLogRoutes', async () => {
  let app: FastifyInstance
  let testToken: string
  let createdUserActivityLogID: string
  let profileID: string

  const testUser = {
    body: {
      nome: 'Usuário-de-Teste Rotas',
      email: 'test.routes@email.com',
      cpf: '52998224725',
      telefone: '11988887777',
      data_nascimento: '1995-05-15',
      profile_password: 'password123',
    },
  } as FastifyRequest

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

    await app.register(userActivityLogsRoutes, { prefix: '/user-activity-log' })

    await app.ready()

    testToken = app.jwt.sign({ id: 'some-id' })

    const profileBody = await createProfile(testUser)

    profileID = profileBody.data.id
  })

  afterAll(async () => {
    await app.close()
    await sequelize.close()
  })

  describe('POST /user-activity-log', () => {
    it('deve criar um UserActivityLog com sucesso', async () => {
      const testLog = {
        user_id: profileID,
        action_type: 'login',
        resource_type: 'resource de teste',
        resource_id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
        ip_address: '200.148.12.188',
        user_agent: 'Chrome',
      }

      const response = await app.inject({
        method: 'POST',
        url: '/user-activity-log',
        headers: {
          authorization: `Bearer ${testToken}`,
        },
        payload: testLog,
      })

      const body = JSON.parse(response.body)

      console.log(response)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data.user_id).toBe(testLog.user_id)
      expect(body.data.id).toBeDefined()

      createdUserActivityLogID = body.data.id
    })
  })

  describe('GET /user-activity-log/:id', () => {
    it('Deve buscar um perfil por id quando autenticado', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/user-activity-log/${createdUserActivityLogID}`,
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      })

      const body = JSON.parse(response.body)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data.id).toBe(createdUserActivityLogID)
    })

    it('Deve retornar erro 401 ao tentar acessar sem o token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/user-activity-log/${createdUserActivityLogID}`,
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('PUT /user-activity-log/:id', () => {
    it('Deve atualizar o tipo de ação do usuário', async () => {
      const novaAcao = 'password_changed'

      const response = await app.inject({
        method: 'PUT',
        url: `/user-activity-log/${createdUserActivityLogID}`,
        headers: {
          authorization: `Bearer ${testToken}`,
        },
        payload: {
          action_type: novaAcao,
        },
      })

      const body = JSON.parse(response.body)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data.action_type).toBe(novaAcao)
    })

    it('Deve retornar erro 401 ao tentar atualizar sem token', async () => {
      const novaAcao2 = 'document_uploaded'

      const response = await app.inject({
        method: 'PUT',
        url: `/user-activity-log/${createdUserActivityLogID}`,
        payload: {
          action_type: novaAcao2,
        },
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('DELETE /user-activity-log/:id', () => {
    it('Deve deletar o usuário com sucesso', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/user-activity-log/${createdUserActivityLogID}`,
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      })

      const body = JSON.parse(response.body)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)

      const deletedDocument = await UserActivityLog.findByPk(
        createdUserActivityLogID
      )
      expect(deletedDocument).toBeNull()
    })
    it('Deve retornar erro 401 ao tentar deletar sem token', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/user-activity-log/${createdUserActivityLogID}`,
      })

      expect(response.statusCode).toBe(401)
    })
  })
})
