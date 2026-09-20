import { it, describe, expect, afterAll, beforeAll } from 'vitest'
import Fastify from 'fastify'
import fastifyJwt, { FastifyJWT } from '@fastify/jwt'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import sequelize from '../src/db'
import documentsAnalysisRoutes from '../src/routes/documents_analysisRoutes'
import DocumentsAnalysis from '../src/models/documents_analysis'
import { createProfile } from '../src/controllers/ProfileController'
import { createConversation } from '../src/controllers/conversationController'
import { createDocuments } from '../src/controllers/documentsController'

describe('DocumentAnalysisRoutes', () => {
  let app: FastifyInstance
  let testToken: string
  let docID: string
  let profileID: string
  let conversationID: string
  let analysisID: string

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

    await app.register(documentsAnalysisRoutes, {
      prefix: '/documents-analysis',
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

  describe('POST /documents-analysis', () => {
    it('Deve criar um userRole com sucesso', async () => {
      const documentAnalysis = {
        conversation_id: conversationID,
        document_id: docID,
        analysis_type: 'sumario',
        confidence_score: 7,
      }

      const response = await app.inject({
        method: 'POST',
        url: '/documents-analysis',
        headers: {
          authorization: `Bearer ${testToken}`,
        },
        payload: documentAnalysis,
      })

      const body = JSON.parse(response.body)

      console.log(response.payload)
      console.log(response.body)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data.conversation_id).toBe(conversationID)
      expect(body.data.id).toBeDefined()

      analysisID = body.data.id
    })
  })

  describe('GET /documents-analysis', () => {
    it('Deve encontrar o userRole com sucesso', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/documents-analysis/${analysisID}`,
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      })

      const body = JSON.parse(response.body)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data.conversation_id).toBe(conversationID)
      expect(body.data.document_id).toBe(docID)
    })

    it('Deve retornar erro 401 ao tentar acessar sem o token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/documents-analysis/${analysisID}`,
      })

      expect(response.statusCode).toBe(401)
    })
  })
  describe('PUT /documents-analysis', () => {
    it('Deve atualizar o DocumentAnalysis com sucesso', async () => {
      const novaAcao = 'analise_legal'

      const response = await app.inject({
        method: 'PUT',
        url: `/documents-analysis/${analysisID}`,
        headers: {
          authorization: `Bearer ${testToken}`,
        },
        payload: {
          analysis_type: novaAcao,
        },
      })

      const body = JSON.parse(response.body)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data.analysis_type).toBe(novaAcao)
    })

    it('Deve retornar erro 401 ao tentar atualizar sem o token', async () => {
      const novaAcao2 = 'analise_legal'

      const response = await app.inject({
        method: 'PUT',
        url: `/documents-analysis/${analysisID}`,
        payload: {
          analysis_type: novaAcao2,
        },
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('DELETE /documents-analysis', () => {
    it('Deve deletar um UserRole com sucesso', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/documents-analysis/${analysisID}`,
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      })

      const body = JSON.parse(response.body)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)

      const deletedUserRole = await DocumentsAnalysis.findByPk(analysisID)
      expect(deletedUserRole).toBeNull()
    })

    it('Deve retornar erro 401 ao tentar deletar sem o token', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/documents-analysis/${analysisID}`,
      })

      expect(response.statusCode).toBe(401)
    })
  })
})
