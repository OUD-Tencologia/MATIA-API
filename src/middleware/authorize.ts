import type { FastifyReply, FastifyRequest } from 'fastify'
import { ForbiddenError } from '../errors/errors.js'

/**
 * Middleware de autorização que verifica se o usuário tem o role necessário
 * @param allowedRoles - Array de roles permitidos
 * @returns Função middleware para usar em preHandler
 */
export function authorize(...allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Primeiro verifica se está autenticado
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.code(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Acesso negado: Token inválido ou expirado.',
          statusCode: 401,
        },
      })
      return
    }

    // Extrai o role do JWT (payload atual: { id, empresa_id, role })
    const userPayload = request.user as { id: string; role: string }
    const userRole = userPayload?.role

    // Verifica se o usuário tem um dos roles permitidos (case-insensitive,
    // já que os roles reais são 'SUPER-ADMIN' | 'ADMIN' | 'USER')
    const normalizedAllowed = allowedRoles.map(r => r.toUpperCase())
    if (!userRole || !normalizedAllowed.includes(userRole.toUpperCase())) {
      throw new ForbiddenError(
        `Acesso negado. Roles necessários: ${allowedRoles.join(', ')}`
      )
    }
  }
}

/**
 * Variante simplificada para apenas um role
 */
export function authorizeRole(role: string) {
  return authorize(role)
}

/**
 * Variante para admin apenas
 */
export function adminOnly() {
  return authorize('admin')
}

/**
 * Cria uma função que pode ser reutilizada
 */
export function createAuthorizeMiddleware(role: string) {
  return authorize(role)
}
