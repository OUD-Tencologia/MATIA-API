// Helper de teste: cria um Profile válido direto pelo ProfileService, sem passar
// pela camada HTTP/JWT. Substitui a antiga `createProfile` que era exportada
// como função solta por `src/controllers/ProfileController.ts` antes desse
// arquivo virar a classe `ProfileController` (multi-tenant, com `request.user`).
import { ProfileService } from '../../src/services/ProfileService.js'
import type { CreateUserDTO } from '../../src/dtos/UserDTO.js'

export interface CreateTestProfileRequest {
  body: Partial<CreateUserDTO> & Record<string, unknown>
}

/**
 * Mantém a mesma forma de uso dos testes antigos: `createProfile({ body: {...} })`
 * retornando `{ success: true, data }`, para minimizar o diff nos call sites.
 */
export async function createProfile(request: CreateTestProfileRequest) {
  const body = (request.body ?? {}) as Partial<CreateUserDTO>

  const empresaId = (body.empresa_id as string | null | undefined) ?? null
  const role = body.role ?? 'SUPER-ADMIN'

  const data = await ProfileService.cadastrar(
    {
      ...body,
      role,
    } as CreateUserDTO,
    empresaId
  )

  return { success: true as const, data }
}
