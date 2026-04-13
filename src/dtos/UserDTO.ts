export interface PermissaoDTO {
    label: string;
    ativo: boolean;
}

export interface CreateUserDTO {
    nome: string;
    email: string;
    cpf: string;
    telefone: string;
    data_nascimento: Date | string;
    profile_password?: string; // Senha temporária no cadastro
    role: 'SUPER-ADMIN' | 'ADMIN' | 'USER';
    empresa_id: string | null; // Null apenas para Super Admins
    area_juridica?: string;
    status?: 'ativo' | 'inativo';
    permissoes?: PermissaoDTO[] | null;
    avatar_url?: string | null;
}

export interface UpdateUserDTO extends Partial<Omit<CreateUserDTO, 'empresa_id' | 'cpf'>> {
    // CPF e empresa_id geralmente não mudam após a criação por segurança
}

export interface UserResponseDTO extends Omit<CreateUserDTO, 'profile_password'> {
    id: string;
    creation_time: Date;
    updated_at: Date | null;
    ultimo_acesso: Date | null;
}