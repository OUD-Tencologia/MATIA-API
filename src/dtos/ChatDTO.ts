// chat.dto.ts

export interface AskQuestionDTO {
    question: string;
    conversation_id?: string;
    response_style?: 'objetiva' | 'equilibrada' | 'detalhada' | 'didatica';
}

export interface SourceDTO {
    titulo: string;
    numero_norma?: string;
    artigo?: string;
    url_oficial?: string;
    trecho: string;
    score: number | null;
    ano_norma?: number;
    source_type?: string;
}

export interface ChatResponseDTO {
    answer: string;
    sources: SourceDTO[];
    interaction_id: string;
    conversation_id?: string;
    confidence?: number;
    risk_level?: string;
    validation_status?: string;
    pdf_url?: string | null;


    usage?: {
        llm: {
            input_tokens: number;
            output_tokens: number;
            total_tokens: number;
            thoughts_tokens?: number;
        };
        embedding?: {
            total_tokens: number;
        };
    };

    cost?: {
        total: {
            usd: number;
            brl: number;
        };
        exchange_rate?: {
            usd_brl: number;
        };
    };
}