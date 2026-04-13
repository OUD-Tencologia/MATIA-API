import { it, describe, expect, afterAll, beforeAll } from 'vitest'
import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import sequelize from '../src/db'
import documentsRoutes from '../src/routes/documentsRoutes'
import Documents from '../src/models/documents'
import { createProfile } from '../src/controllers/ProfileController'

describe('DocumentsRoutes', () => {
  let app: FastifyInstance
  let testToken: string
  let profileID: string
  let documentsID: string

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

    await app.register(documentsRoutes, { prefix: '/documents' })

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
    sequelize.close()
    app.close()
  })

  describe('POST /documents', () => {
    it('Deve criar um documents com sucesso', async () => {
      const documents = {
        user_id: profileID,
        original_name: 'Nome original',
        storage_path: 'Caminho de armazenamento',
        file_type: 'Tipo de arquivo',
        file_size: 25,
        status: 'enviando',
        progress: 20,
      }

      const response = await app.inject({
        method: 'POST',
        url: '/documents',
        headers: {
          authorization: `Bearer ${testToken}`,
        },
        payload: documents,
      })

      const body = JSON.parse(response.body)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data.user_id).toBe(profileID)
      expect(body.data.id).toBeDefined()

      documentsID = body.data.id
    })
  })
  describe('GET /documents', () => {
    it('Deve encontrar um documento com sucesso', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/documents/${documentsID}`,
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      })

      const body = JSON.parse(response.body)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data.id).toBe(documentsID)
    })

    it('Deve retornar erro 401 ao tentar acessar sem o token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/documents/${documentsID}`,
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('PUT /documents', () => {
    it('Deve atualizar o documents com sucesso', async () => {
      const novaAcao = 28

      const response = await app.inject({
        method: 'PUT',
        url: `/documents/${documentsID}`,
        headers: {
          authorization: `Bearer ${testToken}`,
        },
        payload: {
          file_size: novaAcao,
        },
      })

      const body = JSON.parse(response.body)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data.file_size).toBe(novaAcao)
    })

    it('Deve retornar erro 401 ao tentar atualizar sem o token', async () => {
      const novaAcao2 = 34

      const response = await app.inject({
        method: 'PUT',
        url: `/documents/${documentsID}`,
        payload: {
          file_size: novaAcao2,
        },
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('DELETE /documents', () => {
    it('Deve deletar o documents com sucesso', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/documents/${documentsID}`,
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      })

      const body = JSON.parse(response.body)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)

      const deletedDouments = await Documents.findByPk(documentsID)
      expect(deletedDouments).toBeNull()
    })

    it('Deve retornar erro 401 ao tentar deletar sem o token', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/documents/${documentsID}`,
      })

      expect(response.statusCode).toBe(401)
    })
  })
})
