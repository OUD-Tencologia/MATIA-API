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
     * Faz upload de um PDF gerado pela IA
     * Organização: pdfs/{company_id ou super-admin}/{user_id}/{uuid}.pdf
     */
    static async uploadPdfBuffer(
        buffer: Buffer,
        fileName: string,
        userId: string,
        companyId?: string | null
    ): Promise<string> {
        const pasta = companyId ? companyId : 'super-admin'
        const objectName = `pdfs/${pasta}/${userId}/${randomUUID()}-${fileName}`

        await minioClient.putObject(BUCKET, objectName, buffer, buffer.length, {
            'Content-Type': 'application/pdf',
        })

        console.log(`[MinioService] PDF salvo: ${objectName}`)

        // Utiliza o método corrigido para retornar a URL acessível pelo navegador externo
        return await this.gerarUrlTemporaria(objectName, 3600)
    }

    static async gerarUrlTemporaria(objectName: string, expiracaoSegundos: number = 3600): Promise<string> {
        const url = await minioClient.presignedGetObject(BUCKET, objectName, expiracaoSegundos)

        // Corrige o host interno do Docker para o IP público da VPS acessível de fora
        return url.replace('minio:9000', '192.168.17.22:9000')
    }

    static async deletar(objectName: string): Promise<void> {
        await minioClient.removeObject(BUCKET, objectName)
        console.log(`[MinioService] Arquivo removido: ${objectName}`)
    }
}