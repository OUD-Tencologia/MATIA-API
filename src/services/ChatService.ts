import axios from 'axios';
import { UserRepository } from '@/repositories/UserRepository.js';
import { CompanyRepository } from '@/repositories/CompanyRepository.js';
// IMPORT NOVO: Repositório de configurações de LLM
import { LlmConfigRepository } from '@/repositories/LlmConfigRepository.js';
import { UserNotFoundError, InternalServerError } from '@/errors/errors.js';
import { AskQuestionDTO, ChatResponseDTO } from "@/dtos/ChatDTO.js";
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
                companyId = "matia-super-admin";
            }

            // 3. 🔥 NOVO FLUXO: Buscar a IA Padrão do Banco de Dados
            const config = await LlmConfigRepository.findPadrao();

            // Trava de segurança: se o Super Admin desativar todas as IAs por engano
            if (!config) {
                throw new Error('Nenhuma configuração de Inteligência Artificial ativa foi encontrada no sistema.');
            }

            // 4. Disparar a requisição para o motor RAG em Python
            const pythonResponse = await axios.post('http://103.204.193.6:4001/ask', {
                question: dto.question,
                user_id: userId,
                company_id: companyId,

                // 🔥 VARIÁVEIS DINÂMICAS: Injetando os dados do banco direto no Python
                ia: config.ia,
                ia_model: config.ia_model,
                client_api_key: config.api_key,
                temperature: config.temperatura, // Enviando a temperatura do banco
                max_tokens: config.max_tokens,   // Enviando o limite de tokens

                chat_history: [],
                include_sources: true,
                response_style: dto.response_style || "equilibrada"
            }, {
                headers: {
                    'X-API-Key': process.env['MATIA_RAG_API_KEY'],
                    'Content-Type': 'application/json'
                },
                proxy: false,
                httpAgent: new http.Agent({ keepAlive: true }),
                httpsAgent: new https.Agent({ keepAlive: true })
            });


            // 5. Retornar no contrato exigido
            const data = pythonResponse.data;

// 🚀 NOVA IMPLEMENTAÇÃO: Atualizar as estatísticas do perfil no banco
            try {
                await UserRepository.updateStats(
                    userId,
                    data.usage?.llm?.total_tokens || 0,
                    data.cost?.total?.brl || 0
                );
            } catch (statsError) {
                // Apenas logamos o erro para não quebrar a resposta do chat caso o update falhe
                console.error(`[ChatService] Erro ao atualizar estatísticas do usuário ${userId}:`, statsError);
            }

            return {
                answer: data.answer,
                sources: data.sources || [],
                interaction_id: data.metadata?.interaction_id?.toString() || "gerado-localmente",

                usage: {
                    llm: {
                        total_tokens: data.usage?.llm?.total_tokens || 0,
                        input_tokens: data.usage?.llm?.input_tokens || 0,
                        output_tokens: data.usage?.llm?.output_tokens || 0,
                        thoughts_tokens: data.usage?.llm?.thoughts_tokens
                    }
                },

                // 💰 Bilhetagem
                cost: {
                    total: {
                        brl: data.cost?.total?.brl || 0,
                        usd: data.cost?.total?.usd || 0
                    },
                    exchange_rate: {
                        usd_brl: data.cost?.exchange_rate?.usd_brl || 0
                    }
                },

                // 🔍 Auditoria
                confidence: data.confidence,
                risk_level: data.risk_level
            };

        } catch (error: any) {
            if (error.response) {
                console.error(`[ChatService] Erro da API Python (${error.response.status}):`, JSON.stringify(error.response.data));
            } else {
                console.error(`[ChatService] Falha na integração RAG:`, error.message || error);
            }

            throw new InternalServerError('Não foi possível processar a dúvida jurídica neste momento.', { originalError: error.message });
        }
    }
}