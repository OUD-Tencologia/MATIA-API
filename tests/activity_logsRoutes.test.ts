import { it, describe, expect, afterAll, beforeAll } from 'vitest'
import Fastify from 'fastify'
import fastifyJwt, { FastifyJWT } from '@fastify/jwt'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import sequelize from '../src/db'
import activityLogsRoutes from '../src/routes/activity_logsRoutes'
import { createProfile } from '../src/controllers/ProfileController'
import { createConversation } from '../src/controllers/conversationController'
import { createDocuments } from '../src/controllers/documentsController'
import ConversationDocuments from '../src/models/conversation_documents'
import ActivityLog from '../src/models/activity_logs'

describe('DocumentAnalysisRoutes', () => {
  let app: FastifyInstance
  let profileID2: string
  let testToken: string
  let profileID1: string
  let activityLogID: string

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

    await app.register(activityLogsRoutes, {
      prefix: '/activity-logs',
    })

    await app.ready()

    testToken = app.jwt.sign({ id: 'some-id' })

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
  })

  afterAll(async () => {
    sequelize.close()
    app.close()
  })
  describe('POST /activity-logs', () => {
    it('deve criar um activityLogs com sucesso', async () => {
      const activityLogs = {
        user_id: profileID1,
        action: 'login',
        entity_id: profileID2,
        entity_type: 'document',
      }

      const response = await app.inject({
        method: 'POST',
        url: '/activity-logs',
        headers: {
          authorization: `Bearer ${testToken}`,
        },
        payload: activityLogs,
      })

      const body = JSON.parse(response.body)

      console.log(response.body)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data.user_id).toBe(profileID1)
      expect(body.data.id).toBeDefined()

      activityLogID = body.data.id
    })
  })

  describe('GET /activity-logs', () => {
    it('Deve encontrar o ActivtyLogs com sucesso', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/activity-logs/${activityLogID}`,
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      })

      const body = JSON.parse(response.body)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data.id).toBe(activityLogID)
    })

    it('Deve retornar erro 401 ao acessar sem token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/activity-logs/${activityLogID}`,
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('DELETE /activity-logs', () => {
    it('Deve deletar o activityLogs com sucesso', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/activity-logs/${activityLogID}`,
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      })

      const body = JSON.parse(response.body)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)

      const deletedBody = await ActivityLog.findByPk(activityLogID)
      expect(deletedBody).toBeNull()
    })

    it('Deve retornar erro 401 ao tentar acessar sem token', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/activity-logs/${activityLogID}`,
      })

      expect(response.statusCode).toBe(401)
    })
  })
})
