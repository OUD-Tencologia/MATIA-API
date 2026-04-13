import { AppError } from './appError.js'
import type { ErrorDetails } from './appError.js'
import { ErrorCodes } from './errorCodes.js'

export class ValidationError extends AppError {
  constructor(message: string, details?: ErrorDetails) {
    super(400, ErrorCodes.VALIDATION_ERROR, message, details)
  }
}

export class MissingFieldError extends ValidationError {
  constructor() {
    super('Dados faltando', {
      code: ErrorCodes.MISSING_FIELD,
    })
  }
}

export class InvalidCPFError extends ValidationError {
  constructor(cpf?: string) {
    super('CPF inválido', {
      field: 'cpf',
      value: cpf,
      code: ErrorCodes.INVALID_CPF,
    })
  }
}

export class InvalidOABError extends ValidationError {
  constructor(oab?: string) {
    super('Número de OAB inválido', {
      field: 'oab',
      value: oab,
      code: ErrorCodes.INVALID_OAB,
    })
  }
}

export class InvalidProcessNumberError extends ValidationError {
  constructor(processNumber?: string) {
    super('Número de processo Inválido (CNJ)', {
      field: 'processNumber',
      value: processNumber,
      code: ErrorCodes.INVALID_PROCESS_NUMBER,
    })
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Não autorizado. Por favor, faça login.') {
    super(401, ErrorCodes.UNAUTHORIZED, message)
  }
}

export class InvalideCredentialsError extends UnauthorizedError {
  constructor() {
    super('Email ou senha incorretos')
    this.code = ErrorCodes.INVALID_CREDENTIALS
  }
}

export class TokenExpiredError extends UnauthorizedError {
  constructor() {
    super('Token expirado. Por favor, faça login novamente.')
    this.code = ErrorCodes.TOKEN_EXPIRED
  }
}

export class InvalidTokenError extends UnauthorizedError {
  constructor() {
    super('Token inválido')
    this.code = ErrorCodes.INVALID_TOKEN
  }
}

export class ForbiddenError extends AppError {
  constructor(
    message = 'Acesso negado. Você não tem permissão para acessar este recurso.'
  ) {
    super(403, ErrorCodes.FORBIDDEN, message)
  }
}

export class InsufficientPermissionsError extends ForbiddenError {
  constructor(requiredPermission?: string) {
    super(
      requiredPermission
        ? `Permissão necessária: ${requiredPermission}`
        : 'Você não possui as permissões necessárias para esta operação'
    )
    this.code = ErrorCodes.INSUFFICIENT_PERMISSIONS
    this.details = { requiredPermission }
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} com identificador "${identifier}" não foi encontrado`
      : `${resource} não encontrado`

    super(404, ErrorCodes.NOT_FOUND, message, {
      resource,
      identifier,
    })
  }
}

export class UserNotFoundError extends NotFoundError {
  constructor(identifier?: string) {
    super('Usuário', identifier)
    this.code = ErrorCodes.USER_NOT_FOUND
  }
}

export class DocumentNotFoundError extends NotFoundError {
  constructor(identifier?: string) {
    super('Documento', identifier)
    this.code = ErrorCodes.DOCUMENT_NOT_FOUND
  }
}

export class ProcessNotFoundError extends NotFoundError {
  constructor(identifier?: string) {
    super('Processo', identifier)
    this.code = ErrorCodes.PROCESS_NOT_FOUND
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: ErrorDetails) {
    super(409, ErrorCodes.CONFLICT, message, details)
  }
}

export class DuplicateEmailError extends ConflictError {
  constructor(email: string) {
    super('Este email já está em uso.', {
      field: 'email',
      value: email,
      code: ErrorCodes.DUPLICATE_EMAIL,
    })
  }
}

export class DuplicateCPFError extends ConflictError {
  constructor(cpf: string) {
    super('Este CPF já está em uso.', {
      field: 'cpf',
      value: cpf,
      code: ErrorCodes.DUPLICATE_CPF,
    })
  }
}

export class DuplicateNumberError extends ConflictError {
  constructor(phone: string) {
    super('Este número de telefone já está em uso.', {
      field: 'phone',
      value: phone,
      code: ErrorCodes.DUPLICATE_PHONE,
    })
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string, details?: ErrorDetails) {
    super(422, ErrorCodes.BUSINESS_RULE_VIOLATION, message, details)
  }
}

export class InvalideStateError extends BusinessRuleError {
  constructor(resource: string, currentState: string, expectedState: string) {
    super(
      `${resource} está no estado "${currentState}", mas esperava-se "${expectedState}"`,
      {
        resource,
        currentState,
        expectedState,
        code: ErrorCodes.INVALID_STATE,
      }
    )
  }
}

export class TooManyRequestError extends AppError {
  constructor(retryAfter?: number) {
    super(
      429,
      ErrorCodes.TOO_MANY_REQUESTS,
      'Muitas requisições. Por favor, tente novamente mais tarde.',
      { retryAfter }
    )
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Erro Interno do servidor', details?: ErrorDetails) {
    super(500, ErrorCodes.INTERNAL_SERVER_ERROR, message, details, false)
  }
}

export class DataBaseError extends InternalServerError {
  constructor(originalError?: Error) {
    super('Erro ao acessar o Banco de dados', {
      code: ErrorCodes.DATABASE_ERROR,
      originalError: originalError,
    })
  }
}

export class ExternalServiceError extends InternalServerError {
  constructor(serviceName: string, originalError?: Error) {
    super(`Erro ao se comunicar com o serviço: ${serviceName} `, {
      serviceName,
      originalMessage: originalError?.message,
      code: ErrorCodes.EXTERNAL_SERVICE_ERROR,
    })
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Muitas requisições. Tente novamente mais tarde.') {
    // 👇 Ordem correta: (statusCode, errorCode, message)
    super(429, 'TOO_MANY_REQUESTS' as any, message)
  }
}

export class TimeoutError extends InternalServerError {
  constructor(operation: string, timeout: number) {
    super(`Operação "${operation}" excedeu o tempo limite de ${timeout}ms`, {
      code: ErrorCodes.TIMEOUT_ERROR,
      operation,
      timeout,
    })
  }


}
