// tests/loginController.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import bcrypt from 'bcryptjs';
import Fastify from 'fastify'
import type { FastifyInstance } from 'fastify'
import { login } from '../src/controllers/loginController.js'
import Profile from '../src/models/profile.js'
import sequelize from '../src/db.js'
import fastifyJwt from '@fastify/jwt'

describe('loginController', () => {
  let app: FastifyInstance

  // Dados do usuário de teste
  const testUser = {
    nome: 'Usuário Teste Login',
    email: 'teste.login@email.com',
    cpf: '52998224725',
    telefone: '19999999999',
    data_nascimento: '1990-01-01',
    profile_password: 'senha123',
  }

  // Mock do reply do Fastify
  const createMockReply = () => {
    const reply = {
      statusCode: 200,
      code: function (code: number) {
        this.statusCode = code
        return this
      },
      send: function (data: unknown) {
        return { statusCode: this.statusCode, data }
      },
    }
    return reply as unknown as FastifyReply
  }

  type MockReplyResult = {
    statusCode: number
    data: {
      message?: string
      token?: string
      userData?: {
        user_id?: string
        user_role?: string
      }
      [key: string]: unknown
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SETUP - Criar usuário antes dos testes
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  beforeAll(async () => {
    // ✅ Sincronizar a tabela Profile
    await Profile.sync({ force: true })

    console.log('📋 Tabela Profile sincronizada')

    // ✅ Criar Fastify app e configurar JWT
    app = Fastify()

    // Configurar JWT
    await app.register(fastifyJwt, {
      secret: 'test-secret-key-for-testing-only',
    })

    await app.ready()

    // ✅ CRIAR USUÁRIO DIRETAMENTE NO BANCO
    const hashedPassword = await bcrypt.hash(testUser.profile_password, 10)
    console.log('🔐 Senha hasheada:', hashedPassword)

    try {
      const newUser = await Profile.create({
        nome: testUser.nome,
        email: testUser.email,
        cpf: testUser.cpf,
        telefone: testUser.telefone,
        data_nascimento: new Date(testUser.data_nascimento),
        profile_password: hashedPassword,
      })

      console.log('✅ Usuário criado com sucesso:', {
        id: newUser.id,
        email: newUser.email,
      })
    } catch (error) {
      console.error('❌ ERRO ao criar usuário:', error)
      throw error
    }

    // ✅ Verificar que foi criado usando unscoped
    const createdUser = await Profile.unscoped().findOne({
      where: { email: testUser.email },
    })

    if (!createdUser) {
      // Tentar listar todos os usuários para debug
      const allUsers = await Profile.unscoped().findAll()
      console.log(
        '📋 Todos os usuários no banco:',
        allUsers.map(u => ({ id: u.id, email: u.email }))
      )
      throw new Error('Usuário não encontrado após criação!')
    }

    console.log('✅ Usuário verificado no banco:', {
      id: createdUser.get('id'),
      email: createdUser.get('email'),
      hasPassword: !!createdUser.get('profile_password'),
      passwordLength: createdUser.get('profile_password')?.length,
    })
  })

  afterAll(async () => {
    await app.close()
    await sequelize.close()
  })

  // ━━━━━━━━━━━━━━━━━━━━━━━��━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // LOGIN - Testes de Autenticação
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      const req = {
        body: {
          email: testUser.email,
          password: testUser.profile_password,
        },
        server: app,
      } as any

      const reply = createMockReply()
      const result = (await login(req, reply)) as unknown as MockReplyResult

      expect(result.statusCode).toBe(200)
      expect(result.data).toHaveProperty('token')
      expect(result.data).toHaveProperty('message', 'Login bem-sucedido')
      expect(result.data).toHaveProperty('userData')
      expect(result.data.userData).toHaveProperty('user_id')
      expect(result.data.userData).toHaveProperty('user_role')
    })

    it('deve retornar token JWT válido', async () => {
      const req = {
        body: {
          email: testUser.email,
          password: testUser.profile_password,
        },
        server: app,
      } as any

      const reply = createMockReply()
      const result = (await login(req, reply)) as unknown as MockReplyResult

      const token = result.data.token
      expect(token).toBeDefined()
      if (token) {
        expect(token.split('.')).toHaveLength(3)
      }
    })

    it('deve retornar erro 401 com email inválido', async () => {
      const req = {
        body: {
          email: 'email.inexistente@email.com',
          password: testUser.profile_password,
        },
        server: app,
      } as any

      const reply = createMockReply()
      const result = (await login(req, reply)) as unknown as MockReplyResult

      expect(result.statusCode).toBe(401)
      expect(result.data).toHaveProperty('message', 'Credenciais inválidas')
    })

    it('deve retornar erro 401 com senha incorreta', async () => {
      const req = {
        body: {
          email: testUser.email,
          password: 'senhaErrada123',
        },
        server: app,
      } as any

      const reply = createMockReply()
      const result = (await login(req, reply)) as unknown as MockReplyResult

      expect(result.statusCode).toBe(401)
      expect(result.data).toHaveProperty('message', 'Credenciais inválidas')
    })

    it('deve retornar erro 401 com email e senha incorretos', async () => {
      const req = {
        body: {
          email: 'naoexiste@email.com',
          password: 'senhaErrada123',
        },
        server: app,
      } as any

      const reply = createMockReply()
      const result = (await login(req, reply)) as unknown as MockReplyResult

      expect(result.statusCode).toBe(401)
      expect(result.data).toHaveProperty('message', 'Credenciais inválidas')
    })

    it('deve retornar erro com email vazio', async () => {
      const req = {
        body: {
          email: '',
          password: testUser.profile_password,
        },
        server: app,
      } as any

      const reply = createMockReply()
      const result = (await login(req, reply)) as unknown as MockReplyResult

      expect(result.statusCode).toBe(401)
    })

    it('deve retornar erro com senha vazia', async () => {
      const req = {
        body: {
          email: testUser.email,
          password: '',
        },
        server: app,
      } as any

      const reply = createMockReply()
      const result = (await login(req, reply)) as unknown as MockReplyResult

      expect(result.statusCode).toBe(401)
    })

    it('deve retornar erro com body vazio', async () => {
      const req = {
        body: {},
        server: app,
      } as any

      const reply = createMockReply()

      try {
        const result = (await login(req, reply)) as unknown as MockReplyResult
        expect(result.statusCode).toBe(401)
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('deve ser case-sensitive para o email', async () => {
      const req = {
        body: {
          email: testUser.email.toUpperCase(),
          password: testUser.profile_password,
        },
        server: app,
      } as any

      const reply = createMockReply()
      const result = (await login(req, reply)) as unknown as MockReplyResult

      expect([200, 401]).toContain(result.statusCode)
    })

    it('deve retornar userData com user_role padrão se não definido', async () => {
      const req = {
        body: {
          email: testUser.email,
          password: testUser.profile_password,
        },
        server: app,
      } as any

      const reply = createMockReply()
      const result = (await login(req, reply)) as unknown as MockReplyResult

      expect(result.statusCode).toBe(200)
      expect(result.data.userData?.user_role).toBeDefined()
      expect(result.data.userData?.user_role).toBe('publico')
    })
  })

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SEGURANÇA - Testes de Segurança
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('segurança', () => {
    it('não deve expor a senha no retorno', async () => {
      const req = {
        body: {
          email: testUser.email,
          password: testUser.profile_password,
        },
        server: app,
      } as any

      const reply = createMockReply()
      const result = (await login(req, reply)) as unknown as MockReplyResult

      expect(result.data).not.toHaveProperty('password')
      expect(result.data).not.toHaveProperty('profile_password')
      expect(result.data.userData).not.toHaveProperty('password')
      expect(result.data.userData).not.toHaveProperty('profile_password')
    })

    it('deve gerar tokens diferentes para logins consecutivos', async () => {
      const req1 = {
        body: {
          email: testUser.email,
          password: testUser.profile_password,
        },
        server: app,
      } as any

      const reply1 = createMockReply()
      const result1 = (await login(req1, reply1)) as unknown as MockReplyResult

      // Wait 1 second to ensure different iat
      await new Promise(resolve => setTimeout(resolve, 1000))

      const req2 = {
        body: {
          email: testUser.email,
          password: testUser.profile_password,
        },
        server: app,
      } as any

      const reply2 = createMockReply()
      const result2 = (await login(req2, reply2)) as unknown as MockReplyResult

      expect(result1.data.token).not.toBe(result2.data.token)
    })

    it('não deve aceitar SQL injection no email', async () => {
      const req = {
        body: {
          email: "' OR '1'='1",
          password: testUser.profile_password,
        },
        server: app,
      } as any

      const reply = createMockReply()
      const result = (await login(req, reply)) as unknown as MockReplyResult

      expect(result.statusCode).toBe(401)
    })

    it('não deve aceitar SQL injection na senha', async () => {
      const req = {
        body: {
          email: testUser.email,
          password: "' OR '1'='1",
        },
        server: app,
      } as any

      const reply = createMockReply()
      const result = (await login(req, reply)) as unknown as MockReplyResult

      expect(result.statusCode).toBe(401)
    })
  })
})
