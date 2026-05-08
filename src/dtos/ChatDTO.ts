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
    score: number;
}

export interface ChatResponseDTO {
    answer: string;
    sources: SourceDTO[];
    interaction_id: string;
}