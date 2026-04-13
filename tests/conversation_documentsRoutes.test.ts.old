import { it, describe, expect, afterAll, beforeAll } from 'vitest'
import Fastify from 'fastify'
import fastifyJwt, { FastifyJWT } from '@fastify/jwt'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import sequelize from '../src/db'
import conversationDocumentsRoutes from '../src/routes/conversation_documentsRoutes'
import { createProfile } from '../src/controllers/ProfileController'
import { createConversation } from '../src/controllers/conversationController'
import { createDocuments } from '../src/controllers/documentsController'
import ConversationDocuments from '../src/models/conversation_documents'

describe('DocumentAnalysisRoutes', () => {
  let app: FastifyInstance
  let conversationID: string
  let docID: string
  let testToken: string
  let profileID: string
  let conversationDocumentsID: string

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

    await app.register(conversationDocumentsRoutes, {
      prefix: '/conversation-documents',
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

    const docReq = {
      body: {
        user_id: profileID,
        original_name: 'Nome original',
        storage_path: 'Caminho de armazenamento',
        file_type: 'Tipo de arquivo',
        file_size: 25,
        status: 'enviando',
        progress: 20,
      },
    } as FastifyRequest

    const docBody = await createDocuments(docReq)

    docID = docBody.data.id

    const conversationReq = {
      body: {
        user_id: profileID,
        title: 'titulo-teste',
        is_favorite: true,
        last_message_at: '20-10-2004',
      },
    } as FastifyRequest

    const conversationBody = await createConversation(conversationReq)

    conversationID = conversationBody.data.id
  })

  afterAll(async () => {
    sequelize.close()
    app.close()
  })
  describe('POST /conversation-documents', () => {
    it('deve criar um conversation com sucesso', async () => {
      const conversationDocuments = {
        conversation_id: conversationID,
        document_id: docID,
      }

      const response = await app.inject({
        method: 'POST',
        url: '/conversation-documents',
        headers: {
          authorization: `Bearer ${testToken}`,
        },
        payload: conversationDocuments,
      })

      const body = JSON.parse(response.body)

      console.log(response.body)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data.conversation_id).toBe(conversationID)
      expect(body.data.id).toBeDefined()

      conversationDocumentsID = body.data.id
    })
  })

  describe('GET /conversation-documents', () => {
    it('Deve encontrar o conversationDocuments com sucesso', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/conversation-documents/${conversationDocumentsID}`,
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      })

      const body = JSON.parse(response.body)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data.id).toBe(conversationDocumentsID)
    })

    it('Deve retornar erro 401 ao acessar sem token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/conversation-documents/${conversationDocumentsID}`,
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('DELETE /conversation-documents', () => {
    it('Deve deletar o conversationDocuments com sucesso', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/conversation-documents/${conversationDocumentsID}`,
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      })

      const body = JSON.parse(response.body)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)

      const deletedBody = await ConversationDocuments.findByPk(
        conversationDocumentsID
      )
      expect(deletedBody).toBeNull()
    })

    it('Deve retornar erro 401 ao tentar acessar sem token', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/conversation-documents/${conversationDocumentsID}`,
      })

      expect(response.statusCode).toBe(401)
    })
  })
})
