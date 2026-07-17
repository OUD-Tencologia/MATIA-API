export function getRagBaseUrl(): string {
    // Busca a URL da variável de ambiente. Se não existir, usa um fallback (pode ajustar se lembrar o IP exato da rede interna que usou)
    return process.env.RAG_BASE_URL || 'http://172.17.0.1:4001';
}