export interface CreateLlmConfigDTO {
    provider: 'openai' | 'anthropic' | 'gemini'
    ia: 'gpt' | 'claude' | 'gemini'
    ia_model: string
    api_key: string
    nome: string
    ativo?: boolean
    padrao?: boolean
    max_tokens?: number
    temperatura?: number
    limite_custo?: number
}

export interface UpdateLlmConfigDTO {
    ia_model?: string
    api_key?: string
    nome?: string
    ativo?: boolean
    padrao?: boolean
    max_tokens?: number
    temperatura?: number
    limite_custo?: number
}

export interface LlmConfigResponseDTO {
    id: string

    // 🔥 AJUSTE 1: Mantendo a tipagem estrita para o Angular saber exatamente o que vem
    provider: 'openai' | 'anthropic' | 'gemini'
    ia: 'gpt' | 'claude' | 'gemini'

    ia_model: string
    nome: string
    ativo: boolean
    padrao: boolean
    max_tokens: number
    temperatura: number
    limite_custo: number

    // 🔥 AJUSTE 2: O Fastify transforma o Date do BD em String ao enviar o JSON
    created_at: Date | string
    updated_at: Date | string

    // api_key propositalmente omitida da resposta 🔒
}