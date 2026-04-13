import type { FastifyInstance } from 'fastify'
import { CompanyController } from '../controllers/companyController.js'
import {
    createCompanySchema,
    updateCompanySchema,
    companyParamsSchema,
} from '../schemas/companySchema.js'

const companyRoutes = async (fastify: FastifyInstance) => {

    fastify.post(
        '/',
        {
            schema: {
                tags: ['Company'],
                summary: 'Cria uma nova empresa e seu primeiro Administrador',
                body: createCompanySchema.body,
            },
            // Protegido: Apenas usuários logados (Superadmins) podem criar empresas
          //  preHandler: [fastify.authenticate],
        },
        CompanyController.registrar
    )

    fastify.get(
        '/:id',
        {
            schema: {
                tags: ['Company'],
                summary: 'Busca uma empresa pelo ID',
                params: companyParamsSchema.params,
            },
            preHandler: [fastify.authenticate],
        },
        CompanyController.buscar
    )

    fastify.get(
        '/',
        {
            schema: {
                tags: ['Company'],
                summary: 'Lista todas as empresas',
            },
            preHandler: [fastify.authenticate],
        },
        CompanyController.listar
    )

    fastify.put(
        '/:id',
        {
            schema: {
                tags: ['Company'],
                summary: 'Atualiza uma empresa existente',
                params: companyParamsSchema.params,
                body: updateCompanySchema.body,
            },
            preHandler: [fastify.authenticate],
        },
        CompanyController.atualizar
    )

    fastify.delete(
        '/:id',
        {
            schema: {
                tags: ['Company'],
                summary: 'Deleta uma empresa pelo ID (Com Cascade para usuários)',
                params: companyParamsSchema.params,
            },
            preHandler: [fastify.authenticate],
        },
        CompanyController.excluir
    )
}

export default companyRoutes