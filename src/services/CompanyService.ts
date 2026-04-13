import sequelize from '../db.js';
import Company from '../models/company.js';
import { CompanyRepository } from '../repositories/CompanyRepository.js';
import { UserRepository } from '../repositories/UserRepository.js';
import type {
    CreateCompanyDTO,
    CompanyResponseDTO,
    UpdateCompanyDTO
} from '../dtos/CompanyDTO.js';
import type { CreateUserDTO } from '../dtos/UserDTO.js';
import {
    ConflictError,
    InternalServerError,
    UserNotFoundError
} from '../errors/errors.js';
import bcrypt from 'bcryptjs';

export class CompanyService {

    /**
     * 🛠️ MAPPER PRIVADO
     */
    private static mapToResponseDTO(company: Company): CompanyResponseDTO {
        const raw = company.get({ plain: true });

        return {
            id: raw.id,
            name: raw.name,
            code: raw.code,
            cnpj: raw.cnpj,
            email: raw.email,
            phone: raw.phone,
            active: raw.active ?? true,
            data_cadastro: new Date(raw.data_cadastro),
            usuarios_count: raw.usuarios_count ?? 0,
            consulta_mes: raw.consulta_mes ?? 0,
            custo_mes: raw.custo_mes ?? 0,
            plano: raw.plano,
            created_at: raw.created_at,
            updated_at: raw.updated_at
        };
    }

    /**
     * 🚀 CREATE: Registro de Empresa + Administrador (Transação Atômica)
     */
    static async registrarNovaEmpresa(
        companyData: CreateCompanyDTO,
        adminData: CreateUserDTO
    ): Promise<{ empresa: CompanyResponseDTO, admin: any }> {

        // 1. Validação de Segurança
        const emailExiste = await UserRepository.findByEmail(adminData.email);
        if (emailExiste) {
            throw new ConflictError('O e-mail informado já está vinculado a um usuário.');
        }

        const transaction = await sequelize.transaction();

        try {
            // 2. Criar a Empresa
            const novaEmpresa = await CompanyRepository.create(companyData, transaction);

            // Garantia extra: se por algum motivo o ID não vier, paramos aqui
            if (!novaEmpresa.id) throw new Error('Erro ao gerar ID da empresa.');

            // 3. Preparar Segurança (Hash da Senha)
            if (!adminData.profile_password) {
                throw new Error('A senha do administrador é obrigatória.');
            }
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(adminData.profile_password, salt);

            // 4. Criar o Administrador VINCULADO
            // Forçamos o empresa_id aqui para não haver erro de undefined
            const adminPayload: CreateUserDTO = {
                ...adminData,
                profile_password: hashedPassword,
                empresa_id: novaEmpresa.id, // Vínculo essencial
                role: 'ADMIN',
                status: 'ativo'
            };

            const novoAdmin = await UserRepository.create(adminPayload, transaction);

            // 5. Finalização
            await transaction.commit();

            const adminPlain = novoAdmin.get({ plain: true });

            return {
                empresa: this.mapToResponseDTO(novaEmpresa),
                admin: {
                    id: adminPlain.id,
                    nome: adminPlain.nome,
                    email: adminPlain.email,
                    role: adminPlain.role,
                    empresa_id: adminPlain.empresa_id // 👈 Adicionado para conferência no Swagger
                }
            };

        } catch (error: any) {
            if (transaction) await transaction.rollback();
            console.error(`[CompanyService] Erro crítico no registro: ${error.message}`);
            if (error instanceof ConflictError) throw error;
            throw new InternalServerError('Falha ao registrar empresa e administrador.');
        }
    }

    // ... (restante dos métodos listarTodas, buscarPorId, atualizar e excluir permanecem iguais)

    static async listarTodas(): Promise<CompanyResponseDTO[]> {
        const empresas = await CompanyRepository.findAll();
        return empresas.map(empresa => this.mapToResponseDTO(empresa));
    }

    static async buscarPorId(id: string): Promise<CompanyResponseDTO> {
        const empresa = await CompanyRepository.findById(id);
        if (!empresa) throw new UserNotFoundError();
        return this.mapToResponseDTO(empresa);
    }

    static async atualizar(id: string, data: UpdateCompanyDTO): Promise<CompanyResponseDTO> {
        const atualizada = await CompanyRepository.update(id, data);
        if (!atualizada) throw new InternalServerError('Empresa não encontrada');
        return this.mapToResponseDTO(atualizada);
    }

    static async excluir(id: string): Promise<void> {
        const empresa = await CompanyRepository.findById(id);
        if (!empresa) throw new UserNotFoundError();
        await empresa.destroy();
    }
}