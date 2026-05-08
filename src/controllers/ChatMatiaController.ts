import { FastifyRequest, FastifyReply } from 'fastify';
import { ChatService } from '@/services/ChatService.js';
import {AskQuestionDTO} from "@/dtos/ChatDTO.js";

export class ChatMatiaController {

    static async askQuestion(request: FastifyRequest, reply: FastifyReply) {
        try {
            // 1. Extrair os dados do corpo da requisição (O contrato que definimos no DTO)
            const dto = request.body as AskQuestionDTO;

            // 2. Extrair o ID do usuário autenticado
            // ⚠️ ATENÇÃO: Isso depende de como o seu middleware JWT salva os dados na requisição.
            // Geralmente fica em request.user.id ou algo parecido.
            const userId = (request as any).user?.id;

            // Validações básicas de entrada
            if (!userId) {
                return reply.status(401).send({ error: 'Acesso negado. Usuário não autenticado.' });
            }

            if (!dto.question || dto.question.trim() === '') {
                return reply.status(400).send({ error: 'A pergunta jurídica não pode estar vazia.' });
            }

            // 3. Passar a bola para o Service fazer a mágica (e a bilhetagem do SaaS)
            const response = await ChatService.askMatia(dto, userId);

            // 4. Devolver a resposta da IA com sucesso para o Angular
            return reply.status(200).send(response);

        } catch (error: any) {
            console.error('[ChatMatiaController] Erro na rota:', error.message);

            // Se for um dos seus erros personalizados (que já tem statusCode), usamos ele.
            // Se não for, devolvemos um 500 genérico.
            const statusCode = error.statusCode || 500;
            return reply.status(statusCode).send({
                error: error.message || 'Erro interno ao processar a pergunta com a Inteligência Artificial.'
            });
        }
    }
}