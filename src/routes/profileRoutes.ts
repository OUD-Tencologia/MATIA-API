import type { FastifyInstance } from 'fastify'
// Alterado para importar a classe estática diretamente
import { ProfileController } from '../controllers/ProfileController.js'

import {
    createProfileSchema,
    profileParamsSchema,
    updateProfileSchema,
} from '../schemas/profileSchema.js'

const profileRoutes = async (fastify: FastifyInstance) => {
    // ROTA POST / (Criação)
    fastify.post(
        '/',
        {
            schema: {
                tags: ['Profile'],
                summary: 'Cria um novo usuário no sistema (vinculado à empresa do criador)',
                body: createProfileSchema.body,
            },
            // 🔒 ADICIONADO: Obrigatório estar logado para criar um perfil dentro da empresa
            preHandler: [fastify.authenticate],
            config: {
                rateLimit: {
                    max: 3,
                    timeWindow: '1 hour',
                },
            },
        },
        ProfileController.criar // Usando o método da nova classe
    )

    // ROTA GET /:id (Busca)
    fastify.get(
        '/:id',
        {
            schema: {
                tags: ['Profile'],
                summary: 'Busca um usuário pelo seu ID (somente da mesma empresa)',
                params: profileParamsSchema.params,
            },
            preHandler: [fastify.authenticate],
        },
        ProfileController.buscar
    )

    // ROTA GET / (Lista)
    fastify.get(
        '/',
        {
            schema: {
                tags: ['Profile'],
                summary: 'Lista todos os usuários da empresa',
            },
            preHandler: [fastify.authenticate],
        },
        ProfileController.listar
    )

    // ROTA PUT /:id (Atualização)
    fastify.put(
        '/:id',
        {
            schema: {
                tags: ['Profile'],
                summary: 'Atualiza informações de um usuário existente',
                params: profileParamsSchema.params,
                body: updateProfileSchema.body,
            },
            preHandler: [fastify.authenticate],
        },
        ProfileController.atualizar
    )

    // ROTA DELETE /:id (Deleção)
    fastify.delete(
        '/:id',
        {
            schema: {
                tags: ['Profile'],
                summary: 'Deleta um usuário pelo ID',
                params: profileParamsSchema.params,
            },
            preHandler: [fastify.authenticate],
        },
        ProfileController.excluir
    )
}

export default profileRoutes