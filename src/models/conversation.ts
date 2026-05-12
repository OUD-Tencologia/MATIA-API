import type { Optional } from 'sequelize'
import { DataTypes, Model } from 'sequelize'
import sequelize from '../db.js'

export interface ConversationAttributes {
    id: string
    user_id: string
    company_id: string | null // <-- Nova coluna
    title: string
    is_favorite: boolean
    last_message_at: Date | null
    created_at: Date
    updated_at: Date
}

export interface ConversationCreationAttributes
    extends Optional<
        ConversationAttributes,
        'id' | 'created_at' | 'updated_at' | 'last_message_at' | 'company_id'
    > {}

class Conversation
    extends Model<ConversationAttributes, ConversationCreationAttributes>
    implements ConversationAttributes
{
    public id!: string
    public user_id!: string
    public company_id!: string | null
    public title!: string
    public is_favorite!: boolean
    public last_message_at!: Date | null
    public created_at!: Date
    public updated_at!: Date
}

Conversation.init(
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'profile', // ou 'users'
                key: 'id',
            },
        },
        company_id: { // <-- Nova coluna
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'company',
                key: 'id',
            },
        },
        title: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        is_favorite: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        last_message_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'conversation',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
)

export default Conversation