import axios from 'axios';
import { UserRepository } from '@/repositories/UserRepository.js';
import { CompanyRepository } from '@/repositories/CompanyRepository.js';
import { UserNotFoundError, InternalServerError } from '@/errors/errors.js';
import {AskQuestionDTO, ChatResponseDTO} from "@/dtos/ChatDTO.js";
import * as http from "node:http";
import * as https from "node:https";

export class ChatService {

    static async askMatia(dto: AskQuestionDTO, userId: string): Promise<ChatResponseDTO> {
        try {
            // 1. Validar o Usuário
            const user = await UserRepository.findByIdForAuth(userId);
            if (!user) throw new UserNotFoundError(userId);

            const rawUser = user.get ? user.get({ plain: true }) : user;
            const role = rawUser.role; // Capturamos o nível de acesso
            let companyId = rawUser.empresa_id;

            // 2. VALIDAÇÃO SUTIL: Tratamento por Hierarquia (SaaS vs Admin)
            if (role !== 'SUPER-ADMIN') {
                // Se for cliente (USER ou ADMIN), TEM que ter empresa e ela TEM que estar ativa
                if (!companyId) {
                    throw new Error('Usuário não possui uma empresa vinculada para acessar a IA.');
                }

                const company = await CompanyRepository.findById(companyId);
                if (!company) {
                    throw new Error('Empresa vinculada ao usuário não encontrada.');
                }

                const rawCompany = company.get ? company.get({ plain: true }) : company;
                if (rawCompany.active === false) {
                    throw new Error('O acesso desta empresa está suspenso.');
                }
            } else {
                // Se for SUPER-ADMIN, o companyId é null, mas passamos uma tag para a auditoria do Python
                companyId = "matia-super-admin";
            }

            // 3. Pegar a chave (MVP: .env | Futuro: lógica para puxar do banco se for cliente)
            const clientApiKey = process.env.OPENAI_API_KEY;

            // 4. Disparar a requisição para o motor RAG em Python
            const pythonResponse = await axios.post('http://103.204.193.6:4001/ask', {
                question: dto.question,
                user_id: userId,
                company_id: companyId,
                ia: "gemini",
                ia_model: "gemini-2.5-flash",
                // 🌟 SUA CHAVE: Enviando daqui, o Python não usará a dele (caso não tenha saldo)
                client_api_key: process.env.GEMINI_API_KEY,
                chat_history: [],
                include_sources: true,
                response_style: dto.response_style || "equilibrada"
            }, {
                headers: {
                    'X-API-Key': 'hORvJGwnDvT3GCNi6WHMEXFzE4kZOwnV',
                    'Content-Type': 'application/json'
                },
                // Mantendo a proteção contra o proxy da dbseller que vimos no log
                proxy: false,
                httpAgent: new http.Agent({ keepAlive: true }),
                httpsAgent: new https.Agent({ keepAlive: true })
            });

            // 5. Retornar no contrato exigido
            return {
                answer: pythonResponse.data.answer,
                sources: pythonResponse.data.sources || [],
                interaction_id: pythonResponse.data.metadata?.interaction_id?.toString() || "gerado-localmente"
            };

        } catch (error: any) {
            //Isso vai mostrar se é erro de chave, erro no Python ou erro de rede
            if (error.response) {
                console.error(`[ChatService] Erro da API Python (${error.response.status}):`, JSON.stringify(error.response.data));
            } else {
                console.error(`[ChatService] Falha na integração RAG:`, error.message || error);
            }

            throw new InternalServerError('Não foi possível processar a dúvida jurídica neste momento.', { originalError: error.message });
        }
    }
}