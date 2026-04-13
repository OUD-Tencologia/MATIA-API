// src/models/setupAssociations.ts

import Company from "./company.js";
import Profile from "./profile.js";

export function setupAssociations() {
    console.log('🔗 Montando associações do banco de dados...');

    // 1:N -> Uma Empresa tem Vários Perfis
    Company.hasMany(Profile, {
        foreignKey: 'empresa_id',
        as: 'profiles', // Como vai aparecer nas consultas com 'include'
        onDelete: 'CASCADE'
    });

    // N:1 -> Um Perfil pertence a Uma Empresa
    Profile.belongsTo(Company, {
        foreignKey: 'empresa_id',
        as: 'company'
    });

    // No futuro, você vai colocar os hasMany de Documents, Messages, etc. aqui!
}