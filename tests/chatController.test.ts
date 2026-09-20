import {
  expect,
  it,
  beforeAll,
  afterAll,
  describe,
  vi,
  beforeEach,
} from 'vitest'
import {
  sendMessage,
  getConversationHistory,
  startNewConversation,
  getConversationsList,
  deleteConversation,
} from '../src/controllers/chatController.js'
import sequelize from '../src/db.js'
import Conversation from '../src/models/conversation.js'
import Messages from '../src/models/messages.js'
import Profile from '../src/models/profile.js' // ✅ IMPORTANTE: Importar Profile para que seja sincronizado
import type { FastifyRequest } from 'fastify'
import { createProfile } from '../src/controllers/ProfileController.js'

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
    .mockResolvedValue('Esta é uma resposta mockada da IA')
  LLMService.prototype.generateConversationTitle = vi
    .fn()
    .mockResolvedValue('Título Gerado pela IA')
  LLMService.prototype.getUsageStats = vi.fn().mockReturnValue({
    totalTokens: 100,
    totalCost: 0.02,
    requestCount: 1,
  })
  return {
    default: LLMService,
  }
})

describe('ChatController', () => {
  let testUserId: string
  let testConversationId: string

  beforeAll(async () => {
    // ✅ IMPORTANTE: Sincronizar os modelos na ORDEM CORRETA
    // Profile deve ser criado ANTES de Conversation (por causa da foreign key)
    await Profile.sync({ force: true })
    await Conversation.sync({ force: true })
    await Messages.sync({ force: true })

    const profileReq = {
      body: {
        nome: 'Teste',
        email: 'teste@email.com',
        cpf: '52998224725',
        telefone: '19999999999',
        data_nascimento: '1990-01-01',
        profile_password: 'senha123',
      },
    } as FastifyRequest

    const profileBody = await createProfile(profileReq)

    testUserId = profileBody.data.id
  })

  afterAll(async () => {
    await sequelize.close()
  })

  // Clean data to ensure isolation between tests
  beforeEach(async () => {
    // Limpar dados para garantir isolamento entre testes
    await Messages.destroy({ where: {}, force: true })
    await Conversation.destroy({ where: {}, force: true })
  })

  describe('startNewConversation', () => {
    it('deve criar nova conversa com sucesso', async () => {
      const req = {
        body: {
          content: 'Olá, preciso de ajuda com um processo',
        },
        user: { id: testUserId },
        id: crypto.randomUUID(),
      } as FastifyRequest

      const result = await startNewConversation(req)

      expect(result.success).toBe(true)
      expect(result.data.conversation_id).toBeDefined()
      expect(result.data.title).toBe('Título Gerado pela IA')
      expect(result.data.userMessage.content).toBe(
        'Olá, preciso de ajuda com um processo'
      )
      expect(result.data.assistantMessage.content).toBe(
        'Esta é uma resposta mockada da IA'
      )

      testConversationId = result.data.conversation_id
    })

    it('deve criar nova conversa com título customizado', async () => {
      const req = {
        body: {
          content: 'Qual o prazo para recurso?',
          title: 'Meu Título Personalizado',
        },
        user: { id: testUserId },
        id: crypto.randomUUID(),
      } as FastifyRequest

      const result = await startNewConversation(req)

      expect(result.success).toBe(true)
      expect(result.data.title).toBe('Meu Título Personalizado')
    })

    it('deve salvar primeira mensagem do usuário', async () => {
      const req = {
        body: {
          content: 'Teste de mensagem',
        },
        user: { id: testUserId },
        id: crypto.randomUUID(),
      } as FastifyRequest

      const result = await startNewConversation(req)

      expect(result.data.userMessage.role).toBe('user')
      expect(result.data.userMessage.content).toBe('Teste de mensagem')
    })

    it('deve salvar resposta da IA', async () => {
      const req = {
        body: {
          content: 'Teste de mensagem',
        },
        user: { id: testUserId },
        id: crypto.randomUUID(),
      } as FastifyRequest

      const result = await startNewConversation(req)

      expect(result.data.assistantMessage.role).toBe('assistant')
      expect(result.data.assistantMessage.content).toBe(
        'Esta é uma resposta mockada da IA'
      )
    })

    it('deve falhar quando content está faltando', async () => {
      const req = {
        body: {},
        user: { id: testUserId },
        id: crypto.randomUUID(),
      } as FastifyRequest

      await expect(startNewConversation(req)).rejects.toThrow()
    })
  })

  describe('sendMessage', () => {
    beforeEach(async () => {
      // Criar conversa de teste
      const conversation = await Conversation.create({
        user_id: testUserId,
        title: 'Conversa de Teste',
        is_favorite: false,
        last_message_at: new Date(),
      })
      testConversationId = conversation.get('id')

      // Criar algumas mensagens de histórico
      await Messages.create({
        conversations_id: testConversationId,
        content: 'Mensagem anterior',
        role: 'user',
        metadata: {},
      })
    })

    it('deve enviar mensagem com sucesso', async () => {
      const req = {
        body: {
          conversation_id: testConversationId,
          content: 'Nova mensagem de teste',
        },
        user: { id: testUserId },
        id: crypto.randomUUID(),
      } as FastifyRequest

      const result = await sendMessage(req)

      expect(result.success).toBe(true)
      expect(result.data.userMessage.content).toBe('Nova mensagem de teste')
      expect(result.data.assistantMessage.content).toBe(
        'Esta é uma resposta mockada da IA'
      )
    })

    it('deve buscar histórico antes de enviar para LLM', async () => {
      const req = {
        body: {
          conversation_id: testConversationId,
          content: 'Mensagem com histórico',
        },
        user: { id: testUserId },
        id: crypto.randomUUID(),
      } as FastifyRequest

      const result = await sendMessage(req)

      expect(result.success).toBe(true)
      expect(result.data.userMessage).toBeDefined()
    })

    it('deve salvar mensagem do usuário', async () => {
      const req = {
        body: {
          conversation_id: testConversationId,
          content: 'Mensagem para salvar',
        },
        user: { id: testUserId },
        id: crypto.randomUUID(),
      } as FastifyRequest

      const result = await sendMessage(req)

      expect(result.data.userMessage.role).toBe('user')
      expect(result.data.userMessage.content).toBe('Mensagem para salvar')
    })

    it('deve salvar resposta da IA', async () => {
      const req = {
        body: {
          conversation_id: testConversationId,
          content: 'Teste',
        },
        user: { id: testUserId },
        id: crypto.randomUUID(),
      } as FastifyRequest

      const result = await sendMessage(req)

      expect(result.data.assistantMessage.role).toBe('assistant')
    })

    it('deve atualizar last_message_at', async () => {
      const beforeUpdate = await Conversation.findByPk(testConversationId)
      const oldTimestamp = beforeUpdate?.get('last_message_at')

      await new Promise(resolve => setTimeout(resolve, 100))

      const req = {
        body: {
          conversation_id: testConversationId,
          content: 'Atualizar timestamp',
        },
        user: { id: testUserId },
        id: crypto.randomUUID(),
      } as FastifyRequest

      await sendMessage(req)

      const afterUpdate = await Conversation.findByPk(testConversationId)
      const newTimestamp = afterUpdate?.get('last_message_at')

      expect(newTimestamp).toBeDefined()
      expect(new Date(newTimestamp!).getTime()).toBeGreaterThan(
        new Date(oldTimestamp!).getTime()
      )
    })

    it('deve falhar com conversation_id inválido', async () => {
      const req = {
        body: {
          conversation_id: crypto.randomUUID(),
          content: 'Mensagem',
        },
        user: { id: testUserId },
        id: crypto.randomUUID(),
      } as FastifyRequest

      await expect(sendMessage(req)).rejects.toThrow()
    })

    it('deve falhar sem conversation_id', async () => {
      const req = {
        body: {
          content: 'Mensagem',
        },
        user: { id: testUserId },
        id: crypto.randomUUID(),
      } as FastifyRequest

      await expect(sendMessage(req)).rejects.toThrow()
    })

    it('deve falhar sem content', async () => {
      const req = {
        body: {
          conversation_id: testConversationId,
        },
        user: { id: testUserId },
        id: crypto.randomUUID(),
      } as FastifyRequest

      await expect(sendMessage(req)).rejects.toThrow()
    })
  })

  describe('getConversationHistory', () => {
    beforeEach(async () => {
      // Criar conversa de teste
      const conversation = await Conversation.create({
        user_id: testUserId,
        title: 'Conversa de Teste',
        is_favorite: false,
      })
      testConversationId = conversation.get('id')

      // Criar várias mensagens
      for (let i = 1; i <= 5; i++) {
        await Messages.create({
          conversations_id: testConversationId,
          content: `Mensagem ${i}`,
          role: i % 2 === 0 ? 'assistant' : 'user',
          metadata: {},
        })
      }
    })

    it('deve retornar histórico completo', async () => {
      const req = {
        params: { id: testConversationId },
        query: {},
        user: { id: testUserId },
        id: crypto.randomUUID(),
      } as FastifyRequest

      const result = await getConversationHistory(req)

      expect(result.success).toBe(true)
      expect(result.data.length).toBe(5)
    })

    it('deve ordenar por data (mais antigas primeiro)', async () => {
      const req = {
        params: { id: testConversationId },
        query: {},
        user: { id: testUserId },
        id: crypto.randomUUID(),
      } as FastifyRequest

      const result = await getConversationHistory(req)

      expect(result.data[0].content).toBe('Mensagem 1')
      expect(result.data[4].content).toBe('Mensagem 5')
    })

    it('deve filtrar por role', async () => {
      const req = {
        params: { id: testConversationId },
        query: { role: 'user' },
        user: { id: testUserId },
        id: crypto.randomUUID(),
      } as FastifyRequest

      const result = await getConversationHistory(req)

      expect(result.success).toBe(true)
      expect(result.data.length).toBe(3)
      expect(
        result.data.every((msg: MessageResponse) => msg.role === 'user')
      ).toBe(true)
    })

    it('deve paginar corretamente', async () => {
      const req = {
        params: { id: testConversationId },
        query: { page: 1, limit: 2 },
        user: { id: testUserId },
        id: crypto.randomUUID(),
      } as FastifyRequest

      const result = await getConversationHistory(req)

      expect(result.data.length).toBe(2)
      expect(result.meta?.page).toBe(1)
      expect(result.meta?.limit).toBe(2)
      expect(result.meta?.total).toBe(5)
    })

    it('deve falhar para conversa inexistente', async () => {
      const req = {
        params: { id: crypto.randomUUID() },
        query: {},
        user: { id: testUserId },
        id: crypto.randomUUID(),
      } as FastifyRequest

      await expect(getConversationHistory(req)).rejects.toThrow()
    })
  })

  describe('getConversationsList', () => {
    beforeEach(async () => {
      // Criar várias conversas
      for (let i = 1; i <= 5; i++) {
        await Conversation.create({
          user_id: testUserId,
          title: `Conversa ${i}`,
          is_favorite: i === 1,
          last_message_at: new Date(Date.now() - i * 1000),
        })
      }
    })

    it('deve retornar lista de conversas', async () => {
      const req = {
        query: {},
        user: { id: testUserId },
        id: crypto.randomUUID(),
      } as FastifyRequest

      const result = await getConversationsList(req)

      expect(result.success).toBe(true)
      expect(result.data.length).toBe(5)
    })

    it('deve filtrar por is_favorite', async () => {
      const req = {
        query: { is_favorite: true },
        user: { id: testUserId },
        id: crypto.randomUUID(),
      } as FastifyRequest

      const result = await getConversationsList(req)

      expect(result.success).toBe(true)
      expect(result.data.length).toBe(1)
      expect(result.data[0].is_favorite).toBe(true)
    })

    it('deve paginar corretamente', async () => {
      const req = {
        query: { page: 1, limit: 2 },
        user: { id: testUserId },
        id: crypto.randomUUID(),
      } as FastifyRequest

      const result = await getConversationsList(req)

      expect(result.data.length).toBe(2)
      expect(result.meta?.page).toBe(1)
      expect(result.meta?.limit).toBe(2)
      expect(result.meta?.total).toBe(5)
    })
  })

  describe('deleteConversation', () => {
    beforeEach(async () => {
      const conversation = await Conversation.create({
        user_id: testUserId,
        title: 'Conversa para Deletar',
        is_favorite: false,
      })
      testConversationId = conversation.get('id')

      // Criar mensagens associadas
      await Messages.create({
        conversations_id: testConversationId,
        content: 'Mensagem 1',
        role: 'user',
        metadata: {},
      })
    })

    it('deve deletar conversa com sucesso', async () => {
      const req = {
        params: { id: testConversationId },
        user: { id: testUserId },
        id: crypto.randomUUID(),
      } as FastifyRequest

      const result = await deleteConversation(req)

      expect(result.success).toBe(true)

      // Verificar que foi deletada
      const deleted = await Conversation.findByPk(testConversationId)
      expect(deleted).toBeNull()
    })

    it('deve deletar mensagens associadas', async () => {
      const req = {
        params: { id: testConversationId },
        user: { id: testUserId },
        id: crypto.randomUUID(),
      } as FastifyRequest

      await deleteConversation(req)

      // Verificar que as mensagens foram deletadas
      const messages = await Messages.findAll({
        where: { conversations_id: testConversationId },
      })
      expect(messages.length).toBe(0)
    })

    it('deve falhar para conversa inexistente', async () => {
      const req = {
        params: { id: crypto.randomUUID() },
        user: { id: testUserId },
        id: crypto.randomUUID(),
      } as FastifyRequest

      await expect(deleteConversation(req)).rejects.toThrow()
    })
  })
})
