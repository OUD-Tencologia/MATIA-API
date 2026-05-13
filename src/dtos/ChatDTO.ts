// chat.dto.ts

export interface AskQuestionDTO {
    question: string;
    conversation_id?: string;
    response_style?: 'objetiva' | 'equilibrada' | 'detalhada';
}

export interface SourceDTO {
    titulo: string;
    numero_norma?: string;
    artigo?: string;
    url_oficial?: string;
    trecho: string;
    score: number | null; // Alterado para null pois o log mostrou score nulo em fontes MCP
    ano_norma?: number;
    source_type?: string;
}

export interface ChatResponseDTO {
    answer: string;
    sources: SourceDTO[];
    interaction_id: string;

    // 🔥 Novos campos para Estatísticas e Perfil
    confidence?: number;
    risk_level?: string;
    validation_status?: string;

    // Métricas de Consumo (Usage)
    usage?: {
        llm: {
            input_tokens: number;
            output_tokens: number;
            total_tokens: number;
            thoughts_tokens?: number; // Captura o novo campo de 'raciocínio' da IA
        };
        embedding?: {
            total_tokens: number;
        };
    };

    // Bilhetagem (Cost)
    cost?: {
        total: {
            usd: number;
            brl: number; // Campo essencial para o seu Dashboard de Admin
        };
        exchange_rate?: {
            usd_brl: number;
        };
    };
}