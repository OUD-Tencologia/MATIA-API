const DEFAULT_RAG_BASE_URL = 'http://api-rag:8001'

export function getRagBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
    const configuredUrl = env['MATIA_RAG_BASE_URL']?.trim() || DEFAULT_RAG_BASE_URL

    let parsedUrl: URL
    try {
        parsedUrl = new URL(configuredUrl)
    } catch {
        throw new Error('MATIA_RAG_BASE_URL deve ser uma URL HTTP(S) válida.')
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('MATIA_RAG_BASE_URL deve usar o protocolo http ou https.')
    }

    return configuredUrl.replace(/\/+$/, '')
}
