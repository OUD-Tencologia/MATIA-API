import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { FastifyRequest } from 'fastify'
import sequelize from './helpers/registerAllModels.js'
import { AuthController } from '../src/controllers/AuthController.js'
import { createProfile } from './helpers/createTestProfile.js'
import { createMockReply } from './helpers/mockReply.js'

// login() virou AuthController.login (a antiga src/controllers/loginController.ts
// não existe mais). O corpo esperado agora usa `profile_password`, não `password`
// (ver src/dtos/AuthDTO.ts), e a resposta de sucesso inclui um cookie de
// refresh token além do access token no corpo.
describe('AuthController', () => {
  const testUser = {
    nome: 'Usuário Teste Login',
    email: 'teste.login@email.com',
    cpf: '52998224725',
    telefone: '19999999999',
    data_nascimento: '1990-01-01',
    profile_password: 'senha123',
  }

  beforeAll(async () => {
    await sequelize.sync({ force: true })
    await createProfile({ body: testUser })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  describe('login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      const { reply, result } = createMockReply()
      const request = {
        body: { email: testUser.email, profile_password: testUser.profile_password },
      } as unknown as FastifyRequest

      await AuthController.login(request, reply)

      expect(result.statusCode).toBe(200)
      expect(result.body.success).toBe(true)
      expect(result.body).toHaveProperty('token')
      expect(result.body.user.email).toBe(testUser.email)
      expect(result.body.user.role).toBeDefined()
    })

    it('deve retornar um token JWT válido (3 partes)', async () => {
      const { reply, result } = createMockReply()
      const request = {
        body: { email: testUser.email, profile_password: testUser.profile_password },
      } as unknown as FastifyRequest

      await AuthController.login(request, reply)

      expect(result.body.token.split('.')).toHaveLength(3)
    })

    it('não deve expor a senha no retorno', async () => {
      const { reply, result } = createMockReply()
      const request = {
        body: { email: testUser.email, profile_password: testUser.profile_password },
      } as unknown as FastifyRequest

      await AuthController.login(request, reply)

      expect(result.body).not.toHaveProperty('refreshToken')
      expect(result.body.user).not.toHaveProperty('profile_password')
    })

    it('deve rejeitar email inexistente', async () => {
      const { reply } = createMockReply()
      const request = {
        body: { email: 'nao-existe@email.com', profile_password: testUser.profile_password },
      } as unknown as FastifyRequest

      await expect(AuthController.login(request, reply)).rejects.toThrow()
    })

    it('deve rejeitar senha incorreta', async () => {
      const { reply } = createMockReply()
      const request = {
        body: { email: testUser.email, profile_password: 'senhaErrada123' },
      } as unknown as FastifyRequest

      await expect(AuthController.login(request, reply)).rejects.toThrow()
    })

    it('deve gerar tokens diferentes para logins consecutivos', async () => {
      const { reply: reply1, result: result1 } = createMockReply()
      await AuthController.login(
        { body: { email: testUser.email, profile_password: testUser.profile_password } } as unknown as FastifyRequest,
        reply1
      )

      await new Promise(resolve => setTimeout(resolve, 1000))

      const { reply: reply2, result: result2 } = createMockReply()
      await AuthController.login(
        { body: { email: testUser.email, profile_password: testUser.profile_password } } as unknown as FastifyRequest,
        reply2
      )

      expect(result1.body.token).not.toBe(result2.body.token)
    })
  })

  describe('logout', () => {
    it('deve encerrar a sessão com sucesso', async () => {
      const { reply, result } = createMockReply()
      const request = {} as unknown as FastifyRequest

      await AuthController.logout(request, reply)

      expect(result.statusCode).toBe(200)
      expect(result.body.success).toBe(true)
    })
  })
})
