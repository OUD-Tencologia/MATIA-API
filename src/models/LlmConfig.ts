import { DataTypes, type Optional, Model, Op } from 'sequelize'
import sequelize from '../db.js'

export interface LlmConfigAttributes {
    id: string
    provider: 'openai' | 'anthropic' | 'gemini'
    ia: 'gpt' | 'claude' | 'gemini'
    ia_model: string
    api_key: string
    nome: string
    ativo: boolean
    padrao: boolean
    max_tokens: number
    temperatura: number
    limite_custo: number
    created_at: Date
    updated_at: Date
}

// Sintaxe do Optional corrigida para o TypeScript
export interface LlmConfigCreationAttributes
    extends Optional<
        LlmConfigAttributes,
        | 'id'
        | 'ativo'
        | 'padrao'
        | 'max_tokens'
        | 'temperatura'
        | 'limite_custo'
        | 'created_at'
        | 'updated_at'
    > {}

class LlmConfig extends Model<LlmConfigAttributes, LlmConfigCreationAttributes> implements LlmConfigAttributes {
    declare public id: string
    declare public provider: 'openai' | 'anthropic' | 'gemini'
    declare public ia: 'gpt' | 'claude' | 'gemini'
    declare public ia_model: string
    declare public api_key: string
    declare public nome: string
    declare public ativo: boolean
    declare public padrao: boolean
    declare public max_tokens: number
    declare public temperatura: number
    declare public limite_custo: number
    declare public created_at: Date
    declare public updated_at: Date
}

LlmConfig.init(
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        provider: {
            type: DataTypes.ENUM('openai', 'anthropic', 'gemini'),
            allowNull: false
        },
        ia: {
            type: DataTypes.ENUM('gpt', 'claude', 'gemini'),
            allowNull: false
        },
        ia_model: {
            type: DataTypes.STRING,
            allowNull: false
        },
        api_key: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        nome: {
            type: DataTypes.STRING,
            allowNull: false
        },
        ativo: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        padrao: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        max_tokens: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 4096,
            validate: { min: 1 } // Trava de segurança contra erro na API
        },
        temperatura: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0.5,
            validate: { min: 0, max: 2 } // Limites reais aceitos pelos LLMs
        },
        limite_custo: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 100
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
    },
    {
        sequelize,
        tableName: 'llm_configs',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        hooks: {
            // Garante que só existe UM modelo padrão ativo
            beforeSave: async (instance) => {
                if (instance.padrao) {
                    await LlmConfig.update(
                        { padrao: false },
                        {
                            where: {
                                id: { [Op.ne]: instance.id }
                            }
                        }
                    );
                }
            }
        }
    }
)

export default LlmConfig