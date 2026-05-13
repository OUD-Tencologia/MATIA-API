import { UserRepository } from '../repositories/UserRepository.js';
import type { CreateUserDTO, UpdateUserDTO, UserResponseDTO } from '../dtos/UserDTO.js';
import { UserNotFoundError, DuplicateEmailError } from '../errors/errors.js';
import Profile from '../models/profile.js';
import bcrypt from 'bcryptjs'

export class ProfileService {

    private static mapToResponseDTO(user: Profile): UserResponseDTO {
        const data = user.get({ plain: true }) as any;

        return {
            id: data.id,
            nome: data.nome,
            email: data.email,
            cpf: data.cpf,
            telefone: data.telefone,
            avatar_url: data.avatar_url ?? undefined,
            empresa_id: data.empresa_id,
            area_juridica: data.area_juridica ?? 'Geral',
            permissoes: data.permissoes,
            role: data.role as 'SUPER-ADMIN' | 'ADMIN' | 'USER',
            status: data.status as 'ativo' | 'inativo',
            data_nascimento: data.data_nascimento ? new Date(data.data_nascimento) : new Date(),
            creation_time: data.creation_time || data.createdAt || new Date(),
            updated_at: data.updated_at || data.updatedAt || null,
            ultimo_acesso: data.ultimo_acesso ?? null,
            primeiro_acesso: data.primeiro_acesso,
            total_consultas: data.total_consultas || 0,
            total_tokens: Number(data.total_tokens) || 0, // Garante que BigInt vire Number para o JSON
            total_custo_brl: Number(data.total_custo_brl) || 0,
            two_factor_enabled: !!data.two_factor_enabled
        };
    }



    /**
     * 🔍 BUSCAR POR ID (🌟 Injetado role e tipagem null)
     */
    static async buscarPorId(id: string, role: string, empresaId: string | null): Promise<UserResponseDTO> {
        const usuario = await UserRepository.findByIdAndEmpresa(id, role, empresaId);
        if (!usuario) throw new UserNotFoundError();

        return this.mapToResponseDTO(usuario);
    }

    /**
     * 🔍 LISTAR POR EMPRESA (🌟 Agora usa o findAllUsers com Raio-X)
     */
    static async listarPorEmpresa(role: string, empresaId: string | null): Promise<UserResponseDTO[]> {
        const usuarios = await UserRepository.findAllUsers(role, empresaId);
        return usuarios.map(u => this.mapToResponseDTO(u));
    }

    /**
     * ➕ CADASTRAR
     */
    static async cadastrar(data: CreateUserDTO, empresaIdLogada: string | null): Promise<UserResponseDTO> {
        const emailExiste = await UserRepository.findByEmail(data.email);
        if (emailExiste) throw new DuplicateEmailError(data.email);

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(data.profile_password!, salt);

        const novoUsuario = await UserRepository.create({
            ...data,
            profile_password: hashedPassword,
            empresa_id: empresaIdLogada
        });

        return this.mapToResponseDTO(novoUsuario);
    }

    /**
     * 📝 ATUALIZAR (🌟 Injetado role e tipagem null)
     */
    static async atualizar(id: string, role: string, empresaId: string | null, data: UpdateUserDTO): Promise<UserResponseDTO> {
        if (data.profile_password) {
            const salt = await bcrypt.genSalt(12);
            data.profile_password = await bcrypt.hash(data.profile_password, salt);
        }

        const atualizado = await UserRepository.update(id, role, empresaId, data);
        if (!atualizado) throw new UserNotFoundError();

        return this.mapToResponseDTO(atualizado);
    }

    /**
     * 🗑️ EXCLUIR (🌟 Injetado role e tipagem null)
     */
    static async excluir(id: string, role: string, empresaId: string | null): Promise<void> {
        const rows = await UserRepository.delete(id, role, empresaId);
        if (rows === 0) throw new UserNotFoundError();
    }

    /**
     * 👤 BUSCAR MEU PERFIL (🌟 Injetado role e tipagem null)
     */
    static async obterMeuPerfil(userId: string): Promise<UserResponseDTO> {
        // Usamos o findProfileData que criamos no UserRepository
        const usuario = await UserRepository.findProfileData(userId);
        if (!usuario) throw new UserNotFoundError();

        return this.mapToResponseDTO(usuario);
    }
}