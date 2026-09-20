import { it, describe, expect, afterAll, beforeAll } from 'vitest'
import Fastify from 'fastify'
import fastifyJwt, { FastifyJWT } from '@fastify/jwt'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import sequelize from '../src/db'
import { createProfile } from '../src/controllers/ProfileController'
import { createConversation } from '../src/controllers/conversationController'
import { createDocuments } from '../src/controllers/documentsController'
import conversationsRoutes from '../src/routes/conversationRoutes'
import Conversation from '../src/models/conversation'

describe('DocumentAnalysisRoutes', () => {
  let app: FastifyInstance
  let testToken: string
  let profileID: string
  let conversationID: string

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

    await app.register(conversationsRoutes, {
      prefix: '/conversation',
    })

    await app.ready()

    testToken = app.jwt.sign({ id: 'some-id' })

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
    sequelize.close()
    app.close()
  })
  describe('POST /conversation', () => {
    it('deve criar um conversation com sucesso', async () => {
      const conversation = {
        user_id: profileID,
        title: 'titulo-teste',
        is_favorite: true,
        last_message_at: '20-10-2004',
      }

      const response = await app.inject({
        method: 'POST',
        url: '/conversation',
        headers: {
          authorization: `Bearer ${testToken}`,
        },
        payload: conversation,
      })

      const body = JSON.parse(response.body)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data.user_id).toBe(profileID)
      expect(body.data.id).toBeDefined()

      conversationID = body.data.id
    })
  })

  describe('GET /conversation', () => {
    it('Deve encontrar o conversation com sucesso', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/conversation/${conversationID}`,
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      })

      const body = JSON.parse(response.body)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data.id).toBe(conversationID)
    })

    it('Deve retornar erro 401 ao acessar sem token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/conversation/${conversationID}`,
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('PUT /conversation', () => {
    it('Deve atualizar o conversation com sucesso', async () => {
      const novaAcao = 'titulo-teste-2'

      const response = await app.inject({
        method: 'PUT',
        url: `/conversation/${conversationID}`,
        headers: {
          authorization: `Bearer ${testToken}`,
        },
        payload: {
          title: novaAcao,
        },
      })

      const body = JSON.parse(response.body)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data.title).toBe(novaAcao)
    })

    it('Deve retornar erro 401 ao tentar atualizar sem token', async () => {
      const novaAcao2 = 'titulo-teste-2'

      const response = await app.inject({
        method: 'PUT',
        url: `/conversation/${conversationID}`,
        payload: {
          title: novaAcao2,
        },
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('DELETE /conversation', () => {
    it('Deve deletar o conversation com sucesso', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/conversation/${conversationID}`,
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      })

      const body = JSON.parse(response.body)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)

      const deletedBody = await Conversation.findByPk(conversationID)
      expect(deletedBody).toBeNull()
    })

    it('Deve retornar erro 401 ao tentar acessar sem token', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/conversation/${conversationID}`,
      })

      expect(response.statusCode).toBe(401)
    })
  })
})
