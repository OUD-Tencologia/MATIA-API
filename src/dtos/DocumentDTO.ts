// DTO para upload de documento
export interface UploadDocumentDTO {
    conversation_id?: string | null;
    response_style?: 'objetiva' | 'equilibrada' | 'detalhada' | 'didatica';
}

// DTO para pergunta sobre documento
export interface AskDocumentDTO {
    question: string;
    conversation_id: string; // obrigatório — precisa saber de qual conversa buscar os document_ids
    response_style?: 'objetiva' | 'equilibrada' | 'detalhada' | 'didatica';
}

// Resposta do upload
export interface UploadDocumentResponseDTO {
    document_id: string;         // ID interno do banco (Documents)
    rag_document_id: string;     // UUID devolvido pelo RAG
    filename: string;
    status: string;
    chunks_created: number;
    conversation_id: string;     // conversa vinculada (nova ou existente)
    usage: {
        embedding: {
            total_tokens: number;
        };
    };
    cost: {
        total: {
            brl: number;
            usd: number;
        };
    };
}

// Resposta do ask sobre documento
export interface AskDocumentResponseDTO {
    answer: string;
    conversation_id: string;
    sources: Array<{
        document_id: string;
        filename: string;
        trecho: string;
        score: number;
        page_start?: number;
        page_end?: number;
    }>;
    confidence: number;
    validation_status: string;
    risk_level: string;
    pdf_url?: string | null;
    usage: {
        llm: {
            total_tokens: number;
            input_tokens: number;
            output_tokens: number;
        };
        embedding: {
            total_tokens: number;
        };
    };
    cost: {
        total: {
            brl: number;
            usd: number;
        };
        exchange_rate: {
            usd_brl: number;
        };
    };
}