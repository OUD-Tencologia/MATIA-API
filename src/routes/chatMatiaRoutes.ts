import type { FastifyInstance } from 'fastify';
import { ChatMatiaController } from '../controllers/ChatMatiaController.js';

const chatMatiaRoutes = async (fastify: FastifyInstance) => {

    // Rota principal para a IA responder (O motor do RAG)
    fastify.post(
        '/matia/ask',
        {
            schema: {
                tags: ['Matia AI'],
                summary: 'Faz uma pergunta jurídica para a IA (RAG)',
                description: 'Envia a pergunta para o motor Python, valida a empresa/SaaS e retorna a resposta com fontes.',
                security: [{ bearerAuth: [] }],
            },
            // 🌟 Usamos o mesmo middleware de autenticação que o projeto já possui
            preHandler: [fastify.authenticate],
        },
        ChatMatiaController.askQuestion
    );
};

export default chatMatiaRoutes;