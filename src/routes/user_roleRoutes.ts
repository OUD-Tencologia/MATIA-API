
/*
import type { FastifyInstance } from 'fastify'

import * as userRoleController from '../controllers/user_roleController.js'
import { adminOnly } from '../middleware/authorize.js'

import {
  createUserRoleSchema,
  userRoleParamsSchema,
  updateUserRoleSchema,
} from '../schemas/user_rolesSchema.js'

const userRoleRoutes = async (fastify: FastifyInstance) => {
  // CREATE - Apenas admin pode associar roles a usuários
  fastify.post(
    '/',
    {
      schema: {
        tags: ['UserRole'],
        summary: 'Associa uma nova função (role) a um usuário - Admin only',
        body: createUserRoleSchema.body,
      },

      preHandler: [fastify.authenticate, adminOnly()],
    },
    userRoleController.createUserRole
  )

  // READ by ID - Qualquer usuário autenticado
  fastify.get(
    '/:id',
    {
      schema: {
        tags: ['UserRole'],
        summary:
          'Busca a associação de função de um usuário existente/função pelo ID',
        params: userRoleParamsSchema.params,
      },

      preHandler: [fastify.authenticate],
    },
    userRoleController.getUserRoleById
  )

  // READ ALL - Qualquer usuário autenticado
  fastify.get(
    '/',
    {
      schema: {
        tags: ['UserRole'],
        summary: 'Busca a todas as associações de um usuário existente',
      },

      preHandler: [fastify.authenticate],
    },
    userRoleController.getUserRole
  )

  // UPDATE - Apenas admin pode atualizar roles
  fastify.put(
    '/:id',
    {
      schema: {
        tags: ['UserRole'],
        summary:
          'Atualiza a associação de função de um usuário existente - Admin only',
        params: userRoleParamsSchema.params,
        body: updateUserRoleSchema.body,
      },

      preHandler: [fastify.authenticate, adminOnly()],
    },
    userRoleController.updateUserRole
  )

  // DELETE - Apenas admin pode remover roles
  fastify.delete(
    '/:id',
    {
      schema: {
        tags: ['UserRole'],
        summary:
          'Remove a função de um usuário pelo ID da associação - Admin only',
        params: userRoleParamsSchema.params,
      },

      preHandler: [fastify.authenticate, adminOnly()],
    },
    userRoleController.deleteUserRole
  )
}

export default userRoleRoutes
*/