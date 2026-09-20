import type { FastifyRequest } from 'fastify'
import type { UserRoleAttributes } from '../models/user_roles.js'
import UserRole from '../models/user_roles.js'
import {
  ValidationError,
  MissingFieldError,
  DocumentNotFoundError,
  InternalServerError,
  DataBaseError,
} from '../errors/errors.js'
import { ErrorCodes } from '../errors/errorCodes.js'
import { successResponse } from '../utils/response.js'

const ALLOWED_ROLES: ReadonlyArray<UserRoleAttributes['role']> = [
  'SUPER-ADMIN',
  'ADMIN',
  'USER',
]

interface CreateBody
  extends Omit<UserRoleAttributes, 'id' | 'created_at'> {}

interface UpdateBody extends Partial<CreateBody> {}

interface Params {
  id: string
}

export const createUserRole = async (request: FastifyRequest) => {
  try {
    const payload = request.body as CreateBody
    if (!payload || Object.keys(payload).length === 0) {
      throw new MissingFieldError()
    }
    if (!payload.user_id || !payload.role) {
      throw new MissingFieldError()
    }
    if (!ALLOWED_ROLES.includes(payload.role)) {
      throw new ValidationError('Dados inválidos', {
        code: ErrorCodes.VALIDATION_ERROR,
      })
    }
    const created = await UserRole.create(payload as any)
    const data = created.toJSON()
    return successResponse(data, 'Função associada com sucesso')
  } catch (err: any) {
    if (err instanceof ValidationError) throw err
    if (err && err.name === 'SequelizeValidationError') {
      throw new ValidationError('Dados inválidos', {
        code: ErrorCodes.VALIDATION_ERROR,
      })
    }
    throw new InternalServerError('Erro ao criar a associação de função', {
      code: ErrorCodes.CREATE_FAILED,
    })
  }
}

export const getUserRoleById = async (request: FastifyRequest) => {
  try {
    const { id } = request.params as Params
    const item = await UserRole.findByPk(id)
    const data = item?.toJSON()
    if (!item) throw new DocumentNotFoundError()
    return successResponse(data, 'Documento encontrado com sucesso')
  } catch (err: any) {
    throw new DocumentNotFoundError()
  }
}

export const getUserRole = async () => {
  try {
    const item = await UserRole.findAll()
    if (item.length === 0) {
      return successResponse([], 'nenhuma associação de função encontrada')
    }
    return successResponse(item, 'listando todas as associações de função')
  } catch (err: any) {
    throw new DataBaseError()
  }
}

export const updateUserRole = async (request: FastifyRequest) => {
  try {
    const { id } = request.params as Params
    const payload = request.body as UpdateBody
    if (!payload || Object.keys(payload).length === 0) {
      throw new MissingFieldError()
    }
    if (payload.role && !ALLOWED_ROLES.includes(payload.role)) {
      throw new ValidationError('Dados inválidos', {
        code: ErrorCodes.VALIDATION_ERROR,
      })
    }
    const [updatedRows] = await UserRole.update(payload, {
      where: { id },
    })
    if (updatedRows === 0) throw new DocumentNotFoundError()
    const updated = await UserRole.findByPk(id)
    const data = updated?.toJSON()
    return successResponse(data, 'Documento atualizado com sucesso')
  } catch (err: any) {
    if (err instanceof DocumentNotFoundError) throw err
    if (err instanceof ValidationError) throw err
    if (err && err.name === 'SequelizeValidationError') {
      throw new ValidationError('Dados inválidos', {
        code: ErrorCodes.VALIDATION_ERROR,
      })
    }
    throw new InternalServerError('Erro ao atualizar a associação de função', {
      code: ErrorCodes.UPDATE_FAILED,
    })
  }
}

export const deleteUserRole = async (request: FastifyRequest) => {
  try {
    const { id } = request.params as Params
    const deleted = await UserRole.destroy({ where: { id } })
    if (deleted === 0) throw new DocumentNotFoundError()
    return successResponse('Documento deletado com sucesso')
  } catch (err: any) {
    if (err instanceof DocumentNotFoundError) throw err
    throw new InternalServerError('Erro ao deletar a associação de função', {
      code: ErrorCodes.DELETE_FAILED,
    })
  }
}

export default {
  createUserRole,
  getUserRoleById,
  getUserRole,
  updateUserRole,
  deleteUserRole,
}
