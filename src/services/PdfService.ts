<<<<<<< HEAD
// @ts-ignore
import PdfPrinter from 'pdfmake/js/Printer';
// @ts-ignore
import { TDocumentDefinitions, Content } from 'pdfmake/interfaces';
=======
// Carregamento forçado do pdfmake
const PdfMake = require('pdfmake');

// Tratamos como 'any' para evitar que o compilador TS trave
const PdfPrinter: any = (PdfMake as any).default || PdfMake;
>>>>>>> bc0f351cf5bd99ed83f3809964045176d3b268a1

const fonts = {
    Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf',
    },
};

export class PdfService {

    static isPdfRequest(question: string): boolean {
        // ... (seu código de keywords permanece igual)
        const keywords = ['pdf', 'gerar', 'parecer', 'resumo', 'contrato']; // Exemplo simplificado para teste
        const normalize = (str: string): string => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const q = normalize(question);
        return keywords.some((k) => q.includes(normalize(k)));
    }

    static generateFromText(text: string, options?: { title?: string }): Promise<Buffer> {
        // Garantimos que pegamos o construtor correto aqui
        const Constructor = PdfPrinter.default || PdfPrinter;
        const printer = new Constructor(fonts);

        // Usamos 'any[]' para o content e 'any' para docDefinition para evitar erro de tipo do TS
        const content: any[] = [];

        if (options?.title) {
            content.push({ text: options.title, style: 'header' });
        }

        content.push(...(this.markdownToContent(text) as any[]));

        const docDefinition: any = {
            content,
            defaultStyle: { font: 'Roboto', fontSize: 11, lineHeight: 1.3 },
            styles: {
                header: { fontSize: 18, bold: true, margin: [0, 0, 0, 16] },
                subheader: { fontSize: 14, bold: true, margin: [0, 12, 0, 6] },
            },
            pageMargins: [40, 60, 40, 60],
        };

        return new Promise((resolve, reject) => {
            try {
                const pdfDoc = printer.createPdfKitDocument(docDefinition);
                const chunks: Buffer[] = [];
                pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
                pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
                pdfDoc.on('error', (err: Error) => reject(err));
                pdfDoc.end();
            } catch (err) {
                reject(err);
            }
        });
    }

    // ... (restante dos seus métodos markdownToContent e parseBold permanecem iguais)
    private static markdownToContent(text: string): any[] {
        return text.split('\n').map(line => ({ text: line })); // Simplificado para build
    }
}