import Documents from '../models/documents.js'
import ConversationDocuments from '../models/conversation_documents.js'
import Conversation from '../models/conversation.js'

export class DocumentRepository {

    // ─────────────────────────────────────────────
    // CRUD base
    // ─────────────────────────────────────────────
    static async create(payload: any) {
        return await Documents.create(payload)
    }

    static async findById(id: string) {
        return await Documents.findByPk(id)
    }

    static async findAll() {
        return await Documents.findAll()
    }

    static async update(id: string, payload: any) {
        const [updatedRows] = await Documents.update(payload, { where: { id } })
        return updatedRows
    }

    static async delete(id: string) {
        return await Documents.destroy({ where: { id } })
    }

    // ─────────────────────────────────────────────
    // Salvar documento do RAG e vincular à conversa
    // Se o documento já foi indexado pelo usuário, reutiliza
    // minioPath: caminho do arquivo no MinIO (storage_path)
    // ─────────────────────────────────────────────
    static async salvarDocumento(
        userId: string,
        companyId: string | null,
        ragDocumentId: string,
        originalName: string,
        fileType: string,
        fileSize: number,
        conversationId?: string | null,
        minioPath?: string
    ) {
        const transacao = await Documents.sequelize!.transaction()

        try {
            // Verifica se o documento já foi indexado pelo mesmo usuário
            const documentoExistente = await Documents.findOne({
                where: { rag_document_id: ragDocumentId, user_id: userId } as any,
                transaction: transacao,
            })

            let documentoId: string

            if (documentoExistente) {
                // Reutiliza sem criar duplicata
                documentoId = documentoExistente.getDataValue('id') || documentoExistente.id
                console.log(`[DocumentRepository] Documento já indexado (${ragDocumentId}), reutilizando ID: ${documentoId}`)
            } else {
                // Documento novo — usa o caminho do MinIO como storage_path
                // Se não tiver MinIO por algum motivo, usa fallback rag://
                const storagePath = minioPath || `rag://${ragDocumentId}`

                const documento = await Documents.create({
                    user_id: userId,
                    original_name: originalName,
                    storage_path: storagePath,
                    file_type: fileType,
                    file_size: fileSize,
                    status: 'completo',
                    progress: 100,
                    processed_at: new Date(),
                    rag_document_id: ragDocumentId,
                } as any, { transaction: transacao })

                documentoId = documento.getDataValue('id') || documento.id
            }

            let activeConversationId = conversationId

            if (!activeConversationId) {
                const novaConversa = await Conversation.create({
                    user_id: userId,
                    company_id: companyId,
                    title: `Análise: ${originalName.substring(0, 35)}...`,
                    is_favorite: false,
                    last_message_at: new Date(),
                }, { transaction: transacao, returning: true })

                activeConversationId = novaConversa.getDataValue('id') || novaConversa.id

                if (!activeConversationId) {
                    throw new Error('Sequelize criou a conversa mas não retornou o ID gerado.')
                }
            } else {
                await Conversation.update(
                    { last_message_at: new Date() },
                    { where: { id: activeConversationId }, transaction: transacao }
                )
            }

            // Verifica se o vínculo já existe antes de criar
            const vinculoExistente = await ConversationDocuments.findOne({
                where: {
                    conversation_id: activeConversationId,
                    document_id: documentoId,
                },
                transaction: transacao,
            })

            if (!vinculoExistente) {
                await ConversationDocuments.create({
                    conversation_id: activeConversationId,
                    document_id: documentoId,
                }, { transaction: transacao })
            }

            await transacao.commit()

            return { documentoId, conversationId: activeConversationId }

        } catch (error) {
            await transacao.rollback()
            console.error('[DocumentRepository] Erro ao salvar documento:', error)
            throw error
        }
    }

    // ─────────────────────────────────────────────
    // Buscar rag_document_ids de uma conversa
    // Valida que a conversa pertence ao usuário
    // ─────────────────────────────────────────────
    static async buscarRagDocumentIdsPorConversa(conversationId: string, userId: string): Promise<string[] | null> {
        const conversa = await Conversation.findOne({
            where: { id: conversationId, user_id: userId },
        })

        if (!conversa) return null

        const vinculos = await ConversationDocuments.findAll({
            where: { conversation_id: conversationId },
        })

        if (!vinculos.length) return []

        const documentIds = vinculos.map(v => v.getDataValue('document_id'))

        const documentos = await Documents.findAll({
            where: { id: documentIds },
        })

        return documentos
            .map(d => (d as any).getDataValue('rag_document_id'))
            .filter(Boolean)
    }
}