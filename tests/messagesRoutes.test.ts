import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import sequelize from '../src/db'
import messagesRoutes from '../src/routes/messagesRoutes'
import Profile from '../src/models/profile'
import Messages from '../src/models/messages'
import { createProfile } from '../src/controllers/ProfileController'
import { createConversation } from '../src/controllers/conversationController'

describe('MessagesRoutes', () => {
  let app: FastifyInstance
  let testToken: string
  let profileID: string
  let conversationsID: string
  let messagesID: string

  beforeAll(async () => {
    await sequelize.sync({ force: true })

    app = await Fastify()

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

    await app.register(messagesRoutes, { prefix: '/messages' })

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

    const conversationReq = {
      body: {
        user_id: profileID,
        title: 'titulo-teste',
        is_favorite: true,
        last_message_at: '2004-10-20',
      },
    } as FastifyRequest

    const conversationsBody = await createConversation(conversationReq)

    conversationsID = conversationsBody.data.id
  })

  afterAll(async () => {
    sequelize.close()
    app.close()
  })

  describe('POST /messages', () => {
    it('deve criar uma mensagem com sucesso', async () => {
      const messages = {
        conversations_id: conversationsID,
        content: 'Conteudo',
        role: 'user',
      }

      const response = await app.inject({
        method: 'POST',
        url: '/messages',
        headers: {
          authorization: `Bearer ${testToken}`,
        },
        payload: messages,
      })

      const body = JSON.parse(response.body)

      messagesID = body.data.id

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data.conversations_id).toBe(conversationsID)
      expect(body.data.id).toBeDefined()
    })
  })
  describe('GET /messages', () => {
    it('Deve encontrar o messages com sucesso', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/messages/${messagesID}`,
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      })

      const body = JSON.parse(response.body)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data.conversations_id).toBe(conversationsID)
    })

    it('Deve retornar erro 401 ao tentar acessar sem o token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/messages/${messagesID}`,
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('PUT /messages', async () => {
    it('Deve atualizar o messages com sucesso', async () => {
      const novaAcao = 'Conteudo2'

      const response = await app.inject({
        method: 'PUT',
        url: `/messages/${messagesID}`,
        headers: {
          authorization: `Bearer ${testToken}`,
        },
        payload: {
          content: novaAcao,
        },
      })

      const body = JSON.parse(response.body)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data.content).toBe(novaAcao)
    })

    it('Deve retornar erro 401 ao tentar acessar sem o token', async () => {
      const novaAcao2 = 'teste2'

      const response = await app.inject({
        method: 'GET',
        url: `/messages/${messagesID}`,
        payload: {
          content: novaAcao2,
        },
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('DELETE /messages', () => {
    it('Deve deletar o messages com sucesso', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/messages/${messagesID}`,
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      })

      const body = JSON.parse(response.body)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)

      const deletedMessages = await Messages.findByPk(messagesID)
      expect(deletedMessages).toBeNull()
    })

    it('Deve retornar erro 401 ao tentar deletar sem o token', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/messages/${messagesID}`,
      })

      expect(response.statusCode).toBe(401)
    })
  })
})
