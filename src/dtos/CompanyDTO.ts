export interface CreateCompanyDTO {
    name: string;
    code: string;
    cnpj: string;
    email: string;
    phone: string;
    plano: 'trial' | 'basico' | 'profissional' | 'enterprise';
    active?: boolean;
}

// Para atualização, todos os campos de criação tornam-se opcionais
export interface UpdateCompanyDTO extends Partial<CreateCompanyDTO> {}

// O que o frontend recebe (inclui campos gerados pelo banco)
export interface CompanyResponseDTO extends CreateCompanyDTO {
    id: string;
    data_cadastro: Date;
    usuarios_count: number | null;
    consulta_mes: number | null;
    custo_mes: number | null;
    created_at: Date;
    updated_at: Date;
}