import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const PDFDocument = require('pdfkit');

export class PdfService {

    static isPdfRequest(question: string): boolean {
        const keywords = ['pdf', 'gerar', 'documento', 'parecer', 'relatorio', 'contrato', 'peticao'];
        return keywords.some(k => question.toLowerCase().includes(k));
    }

    static getTitleFromQuestion(question: string): string {
        return "Documento Jurídico";
    }

    static async generateFromText(text: string, options?: { title?: string }): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                // PDFKit direto: Não usa fontes externas, não busca arquivos, não trava.
                const doc = new PDFDocument({ margin: 50, size: 'A4' });
                const chunks: Buffer[] = [];

                doc.on('data', (chunk: Buffer) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                if (options?.title) {
                    doc.fontSize(20).text(options.title, { align: 'center' });
                    doc.moveDown();
                }

                // Texto plano (fonte padrão nativa)
                doc.fontSize(12).text(text);

                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }
}