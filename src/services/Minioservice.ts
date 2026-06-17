import * as Minio from 'minio'
import { randomUUID } from 'crypto'
import path from 'path'

const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'minio',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ROOT_USER || 'admin',
    secretKey: process.env.MINIO_ROOT_PASSWORD || 'admin123456',
})

const BUCKET = process.env.MINIO_BUCKET || 'matia-documentos'

// Garante que o bucket existe ao iniciar
async function garantirBucket() {
    try {
        const existe = await minioClient.bucketExists(BUCKET)
        if (!existe) {
            await minioClient.makeBucket(BUCKET)
            console.log(`[MinioService] Bucket "${BUCKET}" criado com sucesso.`)
        }
    } catch (err) {
        console.error('[MinioService] Erro ao verificar/criar bucket:', err)
    }
}

garantirBucket()

export class MinioService {

    /**
     * Faz upload de um buffer para o MinIO
     * Organização de pastas:
     *   - Empresa:      documentos/{company_id}/{user_id}/{uuid}.ext
     *   - Super-Admin:  documentos/super-admin/{user_id}/{uuid}.ext
     */
    static async uploadBuffer(
        buffer: Buffer,
        originalName: string,
        mimeType: string,
        userId: string,
        companyId?: string | null
    ): Promise<string> {
        const ext = path.extname(originalName)
        const pasta = companyId ? companyId : 'super-admin'
        const objectName = `documentos/${pasta}/${userId}/${randomUUID()}${ext}`

        await minioClient.putObject(BUCKET, objectName, buffer, buffer.length, {
            'Content-Type': mimeType,
            'X-Original-Name': encodeURIComponent(originalName),
        })

        console.log(`[MinioService] Arquivo salvo: ${objectName}`)
        return objectName
    }

    /**
     * Gera uma URL pré-assinada para acesso temporário ao arquivo
     * Válida por 1 hora por padrão
     */
    static async gerarUrlTemporaria(objectName: string, expiracaoSegundos: number = 3600): Promise<string> {
        return await minioClient.presignedGetObject(BUCKET, objectName, expiracaoSegundos)
    }

    /**
     * Remove um arquivo do bucket
     */
    static async deletar(objectName: string): Promise<void> {
        await minioClient.removeObject(BUCKET, objectName)
        console.log(`[MinioService] Arquivo removido: ${objectName}`)
    }
}