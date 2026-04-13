import { it, describe, expect, afterAll, beforeAll } from 'vitest'
import Fastify from 'fastify'
import fastifyJwt, { FastifyJWT } from '@fastify/jwt'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import sequelize from '../src/db'
import documentsTagsRelationsRoutes from '../src/routes/documents_tags_relationsRoutes'
import DocumentsTagsRelation from '../src/models/documents_tags_relation'
import { createProfile } from '../src/controllers/ProfileController'
import { createDocuments } from '../src/controllers/documentsController'
import { createDocumentsTags } from '../src/controllers/documents_tagsController'

describe('DocumentsTagsRelations', () => {
  let app: FastifyInstance
  let tagID: string
  let profileID: string
  let docID: string
  let relationID: string
  let testToken: string

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

    await app.register(documentsTagsRelationsRoutes, {
      prefix: '/documents-tags-relation',
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

    const docTagReq = {
      body: {
        name: 'nome-de-tag',
        color: 'vermelho',
      },
    } as FastifyRequest

    const docTagBody = await createDocumentsTags(docTagReq)

    tagID = docTagBody.data.id
  })

  afterAll(async () => {
    await app.close()
    await sequelize.close()
  })

  describe('POST /documents-tag-relations', () => {
    it('Deve criar um documentsTagsRelation com sucesso', async () => {
      const documentsTagsRelation = {
        tag_id: tagID,
        document_id: docID,
      }

      const response = await app.inject({
        method: 'POST',
        url: '/documents-tags-relation',
        headers: {
          authorization: `Bearer ${testToken}`,
        },
        payload: documentsTagsRelation,
      })

      const body = JSON.parse(response.body)

      console.log(response)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data.tag_id).toBe(tagID)
      expect(body.data.id).toBeDefined()

      relationID = body.data.id
    })
  })

  describe('GET /documents-tag-relations', () => {
    it('Deve encontrar o documentsTagsRelation com sucesso', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/documents-tags-relation/${relationID}`,
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      })

      const body = JSON.parse(response.body)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data.tag_id).toBe(tagID)
    })

    it('Deve retornar erro 401 ao tentar acessar sem o token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/documents-tags-relation/${relationID}`,
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('DELETE /documents-tag-relations', () => {
    it('Deve deletar um documentsTagsRelation com sucesso', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/documents-tags-relation/${relationID}`,
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      })

      const body = JSON.parse(response.body)

      expect(response.statusCode).toBe(200)
      expect(body.success).toBe(true)

      const deleteddocumentsTagsRelation =
        await DocumentsTagsRelation.findByPk(relationID)
      expect(deleteddocumentsTagsRelation).toBeNull()
    })

    it('Deve retornar erro 401 ao tentar deletar sem o token', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/documents-tags-relation/${relationID}`,
      })

      expect(response.statusCode).toBe(401)
    })
  })
})
