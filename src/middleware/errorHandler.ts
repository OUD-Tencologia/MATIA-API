import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { AppError } from '../errors/appError.js'
import { ZodError } from 'zod'
import {InternalServerError, ValidationError, UnauthorizedError, TooManyRequestsError} from '../errors/errors.js'


interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    statusCode: number
    details?: unknown
    timestamp: string
    path: string
    requestId: string
    stack?: string
  }
}

const isDevelopment = process.env.NODE_ENV === 'development'

function logError(
  error: Error | AppError,
  request: FastifyRequest,
  logger: FastifyRequest['log']
) {
  const errorInfo = {
    requestId: request.id,
    method: request.method,
    url: request.url,
    ip: request.ip,
    userId: (request as any).user?.id,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error instanceof AppError && {
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
        isOperational: error.isOperational,
      }),
    },
  }

  if (error instanceof AppError && error.isOperational) {
    logger.warn(errorInfo, 'Operational error ocurred')
  } else {
    logger.error(errorInfo, 'Non-operational error ocurred')
  }
}

function handleZodError(error: ZodError): AppError {
  const details = error.issues.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }))

  return new ValidationError('Erro de validação dos dados enviados', {
    error: details,
  })
}

function handleFastifyError(error: FastifyError): AppError {
  // O const {...} = require(...) foi deletado!
  // O Node agora pega as classes direto do import lá no topo.

  if (error.validation) {
    return new ValidationError('Erro de validação', {
      errors: error.validation,
    })
  }

  if (error.statusCode === 401) {
    return new UnauthorizedError(error.message)
  }

  if (error.statusCode === 429) {
    return new TooManyRequestsError()
  }

  return new InternalServerError(error.message)
}
function normalizeError(error: Error | AppError | FastifyError): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof ZodError) {
    return handleZodError(error)
  }

  if ('statusCode' in error && 'validation' in error) {
    return handleFastifyError(error as FastifyError)
  }

  return new InternalServerError(
    isDevelopment ? error.message : 'Erro interno do servidor',
    {
      originalError: error.name,
      originalMessage: error.message,
    }
  )
}

function createErrorResponse(
  error: AppError,
  request: FastifyRequest
): ErrorResponse {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
      timestamp: error.timestamp,
      path: request.url,
      requestId: request.id,
      ...(isDevelopment && { stack: error.stack }),
    },
  }
}

export function errorHandler(
  error: Error | AppError | FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const normalizedError = normalizeError(error)

  logError(normalizedError, request, request.log)

  const ErrorResponse = createErrorResponse(normalizedError, request)

  return reply.status(normalizedError.statusCode).send(ErrorResponse)
}

export function setupGlobalErrorHandlers(logger: any) {
  process.on(
    'unhandledRejection',
    (reason: Error, promise: Promise<unknown>) => {
      logger.error(
        {
          err: reason,
          promise,
        },
        'Unhandled Rejection'
      )

      if (!isDevelopment) {
        process.exit(1)
      }
    }
  )

  process.on('uncaughtException', (error: Error) => {
    logger.fatal(
      {
        err: error,
      },
      'Uncaught Exception'
    )
  })

  process.on('SIGTERM', () => {
    logger.info('SIGTEM signal received: closing HTTP server')
    process.exit(0)
  })

  process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server')
    process.exit(0)
  })
}
