import Messages from "@/models/messages.js";
import Conversation from "@/models/conversation.js";

export class ChatRepository {

    static async salvarMensagemAudio(
        userId: string,
        companyId: string | null,
        content: string,
        conversationId?: string | null
    ) {
        // Usamos uma transação para garantir que, se a mensagem falhar, a conversa não fique órfã
        const transacao = await Messages.sequelize!.transaction();

        try {
            let activeConversationId = conversationId;

            // 1. Lógica de "Find or Create" para a conversa
            if (!activeConversationId) {
                const novaConversa = await Conversation.create({
                    user_id: userId,
                    company_id: companyId,
                    title: 'Nova Consulta por Áudio',
                    is_favorite: false,
                    last_message_at: new Date()
                }, { transaction: transacao });

                activeConversationId = novaConversa.id;
            } else {
                // Atualiza o timestamp da conversa existente
                await Conversation.update(
                    { last_message_at: new Date() },
                    { where: { id: activeConversationId }, transaction: transacao }
                );
            }

            // 2. Criação da mensagem com o metadata de áudio
            await Messages.create({
                conversations_id: activeConversationId,
                role: 'user',
                content: content,
                metadata: { origin: 'audio' }
            }, { transaction: transacao });

            await transacao.commit();

            return {
                texto: content,
                conversationId: activeConversationId
            };

        } catch (error) {
            await transacao.rollback();
            console.error('[ChatRepository] Erro ao salvar:', error);
            throw error;
        }
    }
}