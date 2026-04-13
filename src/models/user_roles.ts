import type { Optional } from 'sequelize'
import { DataTypes, Model } from 'sequelize'
import sequelize from '../db.js'

// ✅ Atualizando o Enum para os papéis do seu SaaS
const AppRoleEnum = DataTypes.ENUM('SUPER-ADMIN', 'ADMIN', 'USER')

export interface UserRoleAttributes {
    id: string
    user_id: string
    role: 'SUPER-ADMIN' | 'ADMIN' | 'USER' // ✅ Atualizado
    created_at: Date
}

export interface UserRoleCreationAttributes
    extends Optional<UserRoleAttributes, 'id' | 'created_at'> {}

class UserRole
    extends Model<UserRoleAttributes, UserRoleCreationAttributes>
    implements UserRoleAttributes
{
    public id!: string
    public user_id!: string
    public role!: 'SUPER-ADMIN' | 'ADMIN' | 'USER' // ✅ Atualizado
    public created_at!: Date
}

UserRole.init(
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
                model: 'profile', // Aponta para a tabela principal de usuários
                key: 'id',
            },
        },
        role: {
            type: AppRoleEnum,
            allowNull: false,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'user_role',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
    }
)

export default UserRole