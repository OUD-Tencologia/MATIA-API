import { DataTypes, type Optional, Model } from 'sequelize'
import sequelize from '../db.js'
// 1. Importe o Profile para criar o vínculo
import Profile from './profile.js'

export interface CompanyAttributes {
    id: string
    name: string
    code: string
    cnpj: string
    email: string
    phone: string
    active: boolean | null
    data_cadastro: Date
    usuarios_count: number | null
    consulta_mes: number | null
    custo_mes: number | null
    plano: 'trial' | 'basico' | 'profissional' | 'enterprise'
    created_at: Date
    updated_at: Date
}

export interface CompanyCreationAttributes
    extends Optional<
        CompanyAttributes,
        | 'id'
        | 'active'
        | 'usuarios_count'
        | 'consulta_mes'
        | 'custo_mes'
        | 'created_at'
        | 'updated_at'
        | 'data_cadastro'
    > {}

class Company extends Model<CompanyAttributes, CompanyCreationAttributes> implements CompanyAttributes {
    declare public id: string
    declare public name: string
    declare public code: string
    declare public cnpj: string
    declare public email: string
    declare  public phone: string
    declare public active: boolean | null
    declare public data_cadastro: Date
    declare public usuarios_count: number | null
    declare public consulta_mes: number | null
    declare public custo_mes: number | null
    declare public plano: 'trial' | 'basico' | 'profissional' | 'enterprise'
    declare public created_at: Date
    declare public updated_at: Date
}

Company.init(
    {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        name: { type: DataTypes.STRING, allowNull: false },
        code: { type: DataTypes.STRING, allowNull: false, unique: true },
        cnpj: { type: DataTypes.STRING, allowNull: false, unique: true },
        email: { type: DataTypes.STRING, allowNull: false, unique: true },
        phone: { type: DataTypes.STRING, allowNull: false, unique: true },
        active: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true },
        data_cadastro: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        usuarios_count: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
        consulta_mes: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
        custo_mes: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
        plano: { type: DataTypes.ENUM('trial', 'basico', 'profissional', 'enterprise'), allowNull: false },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
        sequelize,
        tableName: 'company',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
)

export default Company