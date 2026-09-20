import { it, describe, expect, afterAll, beforeAll } from 'vitest'
import Fastify from 'fastify'
import fastifyJwt, { FastifyJWT } from '@fastify/jwt'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import sequelize from '../src/db'
import documentsTagsRoutes from '../src/routes/documents_tagsRoutes'
import DocumentsTags from '../src/models/documents_tags'

describe('DocumentsTags', () => {
  let app: FastifyInstance
  let testToken: string
  let documentsTagsID: string

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

    await app.register(documentsTagsRoutes, { prefix: '/documents-tags' })

    await app.ready()

    testToken = app.jwt.sign({ id: 'some-id' })
  })

  afterAll(async () => {
    await app.close()
    await sequelize.close()
  })

  describe('POST /documents-tags', () => {
    it('Deve criar um documentsTags com sucesso', async () => {
      const documentsTags = {
        color: 'red',
        name: 'nome-da-tag',
      }

      const response = await app.inject({
        method: 'POST',
        url: '/documents-tags',
        headers: {
          authorization: `Bearer ${testToken}`,
        },
        payload: documentsTags,
      })

      const body = JSON.parse(response.body)

      console.log(response)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data.color).toBe('red')
      expect(body.data.id).toBeDefined()

      documentsTagsID = body.data.id
    })
  })

  describe('GET /documents-tags', () => {
    it('Deve encontrar o documentsTags com sucesso', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/documents-tags/${documentsTagsID}`,
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      })

      const body = JSON.parse(response.body)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data.id).toBe(documentsTagsID)
    })

    it('Deve retornar erro 401 ao tentar acessar sem o token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/documents-tags/${documentsTagsID}`,
      })

      expect(response.statusCode).toBe(401)
    })
  })
  describe('PUT /documents-tags', () => {
    it('Deve atualizar o documentsTags com sucesso', async () => {
      const novaAcao = 'verde'

      const response = await app.inject({
        method: 'PUT',
        url: `/documents-tags/${documentsTagsID}`,
        headers: {
          authorization: `Bearer ${testToken}`,
        },
        payload: {
          color: novaAcao,
        },
      })

      const body = JSON.parse(response.body)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data.color).toBe(novaAcao)
    })

    it('Deve retornar erro 401 ao tentar atualizar sem o token', async () => {
      const novaAcao2 = 'azul'

      const response = await app.inject({
        method: 'PUT',
        url: `/documents-tags/${documentsTagsID}`,
        payload: {
          color: novaAcao2,
        },
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('DELETE /documents-tags', () => {
    it('Deve deletar um documentsTags com sucesso', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/documents-tags/${documentsTagsID}`,
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      })

      const body = JSON.parse(response.body)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)

      const deleteddocumentsTags = await DocumentsTags.findByPk(documentsTagsID)
      expect(deleteddocumentsTags).toBeNull()
    })

    it('Deve retornar erro 401 ao tentar deletar sem o token', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/documents-tags/${documentsTagsID}`,
      })

      expect(response.statusCode).toBe(401)
    })
  })
})
