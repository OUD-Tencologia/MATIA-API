import {
  expect,
  it,
  beforeAll,
  afterAll,
  describe,
  vi,
  beforeEach,
} from 'vitest'
import Fastify from 'fastify'
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import sequelize from '../src/db.js'
import chatRoutes from '../src/routes/chatRoutes.js'
import Conversation from '../src/models/conversation.js'
import Messages from '../src/models/messages.js'
import Profile from '../src/models/profile.js'
import fastifyJwt from '@fastify/jwt'

// Interface para tipagem das mensagens
interface MessageResponse {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: Date
  metadata: object | null
}

// Mock do LLMService
vi.mock('../src/services/llmService.js', () => {
  const LLMService = vi.fn()
  LLMService.prototype.generateResponse = vi
    .fn()
    .mockResolvedValue('Resposta mockada da IA para teste')
  LLMService.prototype.generateConversationTitle = vi
    .fn()
    .mockResolvedValue('Título de Teste')
  LLMService.prototype.getUsageStats = vi.fn().mockReturnValue({
    totalTokens: 100,
    totalCost: 0.02,
    requestCount: 1,
  })
  return {
    default: LLMService,
  }
})

describe('ChatRoutes - Integration Tests', () => {
  let app: FastifyInstance
  let testUserId: string
  let testToken: string
  let testConversationId: string

  beforeAll(async () => {
    // Sync models in correct order: Profile first (parent), then Conversation (child with FK), then Messages (child)
    // This ensures foreign key constraints are satisfied
    await Profile.sync({ force: true })
    await Conversation.sync({ force: true })
    await Messages.sync({ force: true })

    // Configurar Fastify app
    app = Fastify()

    // Configurar JWT
    await app.register(fastifyJwt, {
      secret: 'test-secret-key-for-testing-only',
    })

    // ✅ Corrigido: adicionado return e tipagem correta
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

    // Registrar rotas de chat
    await app.register(chatRoutes, { prefix: '/api' })

    await app.ready()

    // Criar usuário de teste e token
    testUserId = crypto.randomUUID()

    // Create a test user in the database
    await Profile.create({
      id: testUserId,
      nome: 'Test User',
      email: 'test@example.com',
      cpf: '12345678901',
      telefone: '11999999999',
      data_nascimento: new Date('1990-01-01'),
      profile_password: 'hashedpassword',
    })

    testToken = app.jwt.sign({ id: testUserId })
  })

  afterAll(async () => {
    await app.close()
    await sequelize.close()
  })

  beforeEach(async () => {
    // Limpar dados entre testes
    await Messages.destroy({ where: {}, force: true })
    await Conversation.destroy({ where: {}, force: true })
  })

  describe('POST /api/chat/new', () => {
    it('deve retornar 200 e criar nova conversa com sucesso', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/chat/new',
        headers: {
          authorization: `Bearer ${testToken}`,
        },
        payload: {
          content: 'Olá, preciso de ajuda jurídica',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data.conversation_id).toBeDefined()
      expect(body.data.title).toBe('Título de Teste')
      expect(body.data.userMessage.content).toBe(
        'Olá, preciso de ajuda jurídica'
      )
      expect(body.data.assistantMessage.content).toBe(
        'Resposta mockada da IA para teste'
      )
    })

    it('deve retornar 401 sem token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/chat/new',
        payload: {
          content: 'Teste sem autenticação',
        },
      })

      expect(response.statusCode).toBe(401)
    })

    it('deve retornar 400 sem content', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/chat/new',
        headers: {
          authorization: `Bearer ${testToken}`,
        },
        payload: {},
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('POST /api/chat/message', () => {
    beforeEach(async () => {
      // Criar conversa de teste
      const conversation = await Conversation.create({
        user_id: testUserId,
        title: 'Conversa de Teste',
        is_favorite: false,
      })
      testConversationId = conversation.get('id')
    })

    it('deve retornar 200 e enviar mensagem com sucesso', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/chat/message',
        headers: {
          authorization: `Bearer ${testToken}`,
        },
        payload: {
          conversation_id: testConversationId,
          content: 'Qual o prazo para recurso?',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data.userMessage.content).toBe('Qual o prazo para recurso?')
      expect(body.data.assistantMessage.content).toBe(
        'Resposta mockada da IA para teste'
      )
    })

    it('deve retornar 401 sem token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/chat/message',
        payload: {
          conversation_id: testConversationId,
          content: 'Teste',
        },
      })

      expect(response.statusCode).toBe(401)
    })

    it('deve retornar 404 para conversation_id inválido', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/chat/message',
        headers: {
          authorization: `Bearer ${testToken}`,
        },
        payload: {
          conversation_id: crypto.randomUUID(),
          content: 'Mensagem em conversa inexistente',
        },
      })

      expect(response.statusCode).toBe(404)
    })

    it('deve retornar 400 sem content', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/chat/message',
        headers: {
          authorization: `Bearer ${testToken}`,
        },
        payload: {
          conversation_id: testConversationId,
        },
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('GET /api/chat/history/:id', () => {
    beforeEach(async () => {
      // Criar conversa de teste
      const conversation = await Conversation.create({
        user_id: testUserId,
        title: 'Conversa de Teste',
        is_favorite: false,
      })
      testConversationId = conversation.get('id')

      // Criar mensagens
      for (let i = 1; i <= 5; i++) {
        await Messages.create({
          conversations_id: testConversationId,
          content: `Mensagem ${i}`,
          role: i % 2 === 0 ? 'assistant' : 'user',
          metadata: {},
        })
      }
    })

    it('deve retornar array de mensagens', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/chat/history/${testConversationId}`,
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(Array.isArray(body.data)).toBe(true)
      expect(body.data.length).toBe(5)
    })

    it('deve retornar 401 sem token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/chat/history/${testConversationId}`,
      })

      expect(response.statusCode).toBe(401)
    })

    it('deve retornar 404 para conversa inexistente', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/chat/history/${crypto.randomUUID()}`,
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      })

      expect(response.statusCode).toBe(404)
    })

    it('deve suportar paginação', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/chat/history/${testConversationId}?page=1&limit=2`,
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data.length).toBe(2)
      expect(body.meta.page).toBe(1)
      expect(body.meta.limit).toBe(2)
    })

    it('deve filtrar por role', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/chat/history/${testConversationId}?role=user`,
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      // ✅ Corrigido: usando tipo específico ao invés de any
      expect(
        body.data.every((msg: MessageResponse) => msg.role === 'user')
      ).toBe(true)
    })
  })

  describe('GET /api/chat/conversations', () => {
    beforeEach(async () => {
      // Criar várias conversas
      for (let i = 1; i <= 3; i++) {
        await Conversation.create({
          user_id: testUserId,
          title: `Conversa ${i}`,
          is_favorite: i === 1,
          last_message_at: new Date(),
        })
      }
    })

    it('deve retornar lista paginada de conversas', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/chat/conversations',
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(Array.isArray(body.data)).toBe(true)
      expect(body.data.length).toBe(3)
      expect(body.meta).toBeDefined()
    })

    it('deve retornar 401 sem token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/chat/conversations',
      })

      expect(response.statusCode).toBe(401)
    })

    it('deve suportar paginação', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/chat/conversations?page=1&limit=2',
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data.length).toBe(2)
      expect(body.meta.limit).toBe(2)
    })

    it('deve filtrar por is_favorite', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/chat/conversations?is_favorite=true',
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data.length).toBe(1)
      expect(body.data[0].is_favorite).toBe(true)
    })
  })

  describe('DELETE /api/chat/conversation/:id', () => {
    beforeEach(async () => {
      const conversation = await Conversation.create({
        user_id: testUserId,
        title: 'Conversa para Deletar',
        is_favorite: false,
      })
      testConversationId = conversation.get('id')

      // Criar mensagens
      await Messages.create({
        conversations_id: testConversationId,
        content: 'Mensagem 1',
        role: 'user',
        metadata: {},
      })
    })

    it('deve deletar conversa com sucesso', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/chat/conversation/${testConversationId}`,
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)

      // Verificar que foi deletada
      const deleted = await Conversation.findByPk(testConversationId)
      expect(deleted).toBeNull()
    })

    it('deve retornar 401 sem token', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/chat/conversation/${testConversationId}`,
      })

      expect(response.statusCode).toBe(401)
    })

    it('deve retornar 404 para conversa inexistente', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/chat/conversation/${crypto.randomUUID()}`,
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      })

      expect(response.statusCode).toBe(404)
    })
  })
})
