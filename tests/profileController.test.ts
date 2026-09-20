import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createRequire } from 'module';
import {FastifyRequest} from "fastify";

const require = createRequire(import.meta.url);

// Imports corrigidos (sem .js se forem arquivos .ts)


describe('profileController', () => {
  let createdUserId: string;

  // Configuração antes de todos os testes
  beforeAll(async () => {
    // CUIDADO: sync({force: true}) apaga os dados do banco do Docker!
    await sequelize.sync({ force: true });
  });

  // Limpa após todos os testes
  afterAll(async () => {
    await sequelize.close();
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CREATE - Testes de Criação
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('createProfile', () => {
    it('deve criar um perfil com dados válidos', async () => {
      const req = {
        body: {
          nome: 'João Silva',
          email: 'joao@email.com',
          cpf: '52998224725',
          telefone: '19999999999',
          data_nascimento: '1990-01-01',
          profile_password: 'senha123',
        },
        // Mock básico de logger caso o controller use req.log
        log: { info: () => {}, error: () => {} }
      } as unknown as FastifyRequest;

      const result = (await createProfile(req)) as any;

      expect(result.success).toBe(true);
      expect(result.data.nome).toBe('João Silva');
      expect(result.data).not.toHaveProperty('profile_password');

      createdUserId = result.data.id;
    });

    it('deve rejeitar CPF inválido', async () => {
      const req = {
        body: {
          nome: 'Teste',
          email: 'teste@email.com',
          cpf: '00000000000',
          telefone: '19999999999',
          data_nascimento: '1990-01-01',
          profile_password: 'senha123',
        },
      } as unknown as FastifyRequest;

      await expect(createProfile(req)).rejects.toThrow();
    });

    it('deve rejeitar email duplicado', async () => {
      const req = {
        body: {
          nome: 'Outro João',
          email: 'joao@email.com',
          cpf: '71428793860',
          telefone: '19888888888',
          data_nascimento: '1995-05-15',
          profile_password: 'senha456',
        },
      } as unknown as FastifyRequest;

      await expect(createProfile(req)).rejects.toThrow();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // READ - Testes de Leitura
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('getProfileById', () => {
    it('deve retornar um perfil existente pelo ID', async () => {
      const req = {
        params: { id: createdUserId },
      } as unknown as FastifyRequest;

      const result = await getProfileById(req);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(createdUserId);
      expect(result.data).not.toHaveProperty('profile_password');
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // UPDATE - Testes de Atualização
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('updateProfile', () => {
    it('deve atualizar o nome do perfil', async () => {
      const req = {
        params: { id: createdUserId },
        body: { nome: 'João Silva Atualizado' },
      } as unknown as FastifyRequest;

      const result = await updateProfile(req);

      expect(result.success).toBe(true);
      expect(result.data.nome).toBe('João Silva Atualizado');
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DELETE - Testes de Deleção
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('deleteProfile', () => {
    it('deve deletar um perfil existente', async () => {
      const req = {
        params: { id: createdUserId },
      } as unknown as FastifyRequest;

      const result = await deleteProfile(req);
      expect(result.success).toBe(true);
    });
  });
});