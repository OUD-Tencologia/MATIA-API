// Mock mínimo de FastifyReply para testar controllers que recebem
// (request, reply) diretamente, sem subir um servidor Fastify de verdade.
import type { FastifyReply } from 'fastify'

export interface MockReplyResult {
  statusCode: number
  body: any
}

export function createMockReply() {
  const result: MockReplyResult = { statusCode: 200, body: undefined }

  const reply = {
    status(code: number) {
      result.statusCode = code
      return reply
    },
    code(code: number) {
      result.statusCode = code
      return reply
    },
    send(payload?: unknown) {
      result.body = payload
      return result
    },
  }

  return { reply: reply as unknown as FastifyReply, result }
}
