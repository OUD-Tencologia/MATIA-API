import { createRequire } from 'module';
import { TDocumentDefinitions, Content } from "pdfmake/interfaces.js";

const require = createRequire(import.meta.url);

const pdfMakeModule = require('pdfmake/build/pdfmake.js');
const vfsFontsModule = require('pdfmake/build/vfs_fonts.js');

const pdfMake = pdfMakeModule.pdfMake || pdfMakeModule.default || pdfMakeModule;
const vfs = vfsFontsModule.vfs || vfsFontsModule.pdfMake?.vfs || vfsFontsModule;

pdfMake.vfs = vfs;
pdfMake.fonts = {
    Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf',
    }
};

export class PdfService {

    static isPdfRequest(question: string): boolean {
        const keywords = [
            'pdf', 'gerar documento', 'gere um documento', 'criar documento', 'crie um documento',
            'gerar parecer', 'gere um parecer', 'emitir parecer', 'elaborar parecer',
            'gerar relatorio', 'gere um relatorio', 'criar relatorio',
            'gerar resumo', 'gere um resumo', 'resumo em documento',
            'gerar arquivo', 'gere um arquivo', 'criar arquivo',
            'exportar', 'baixar documento', 'baixar arquivo', 'download',
            'salvar como pdf', 'converter em pdf', 'converter para pdf',
            'em formato pdf', 'no formato pdf', 'versao em pdf', 'quero em pdf',
            'manda em pdf', 'me manda um pdf', 'anexa em pdf',
            'gerar peticao', 'gere uma peticao', 'elaborar peticao',
            'gerar notificacao', 'gere uma notificacao',
            'gerar recurso', 'gere um recurso',
            'gerar defesa', 'gere uma defesa',
            'gerar laudo', 'gere um laudo',
            'gerar declaracao', 'gere uma declaracao',
            'gerar analise', 'gere uma analise',
            'gerar consulta', 'gere uma consulta',
            'gerar memorial', 'gere um memorial',
            'gerar contrato', 'gere um contrato', 'analisar contrato',
        ];

        const normalize = (str: string): string =>
            str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        const q = normalize(question);
        return keywords.some((k) => q.includes(normalize(k)));
    }

    static getTitleFromQuestion(question: string): string {
        const normalize = (str: string) =>
            str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        const q = normalize(question);

        if (q.includes('parecer')) return 'Parecer Jurídico';
        if (q.includes('relatorio') || q.includes('relacao')) return 'Relatório Jurídico';
        if (q.includes('resumo')) return 'Resumo Jurídico';
        if (q.includes('contrato')) return 'Análise de Contrato';
        if (q.includes('peticao')) return 'Petição';
        if (q.includes('notificacao')) return 'Notificação';
        if (q.includes('recurso')) return 'Recurso';
        if (q.includes('defesa')) return 'Defesa';
        if (q.includes('memorial')) return 'Memorial';
        if (q.includes('laudo')) return 'Laudo';
        if (q.includes('analise')) return 'Análise Jurídica';
        if (q.includes('declaracao')) return 'Declaração';
        if (q.includes('consulta')) return 'Consulta Jurídica';

        return 'Documento Jurídico';
    }

    static async generateFromText(text: string, options?: { title?: string }): Promise<Buffer> {
        const content: Content[] = [];

        if (options?.title) {
            content.push({ text: options.title, style: 'header' });
        }

        content.push(...this.markdownToContent(text));

        const docDefinition: TDocumentDefinitions = {
            content,
            defaultStyle: { font: 'Roboto', fontSize: 11, lineHeight: 1.3 },
            styles: {
                header: { fontSize: 18, bold: true, margin: [0, 0, 0, 16] },
                subheader: { fontSize: 14, bold: true, margin: [0, 12, 0, 6] },
            },
            pageMargins: [40, 60, 40, 60],
            footer: (currentPage: number, pageCount: number) => ({
                text: `Página ${currentPage} de ${pageCount}`,
                alignment: 'center',
                fontSize: 8,
                margin: [0, 10, 0, 0],
            }),
        };

        const pdfDocGenerator = pdfMake.createPdf(docDefinition);

        return await new Promise<Buffer>((resolve, reject) => {
            try {
                const result = pdfDocGenerator.getBuffer((buffer: any) => {
                    if (buffer) resolve(buffer as Buffer);
                });

                if (result instanceof Promise) {
                    result.then((buffer: any) => resolve(buffer as Buffer)).catch(reject);
                }
            } catch (err) {
                reject(err);
            }
        });
    }

    private static markdownToContent(text: string): Content[] {
        const lines = text.split('\n').filter((line) => line.trim().length > 0);

        return lines.map((line) => {
            const trimmed = line.trim();

            if (trimmed.startsWith('## ')) return { text: trimmed.replace(/^##\s*/, ''), style: 'subheader' };
            if (trimmed.startsWith('# ')) return { text: trimmed.replace(/^#\s*/, ''), style: 'header' };

            if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                return { text: `•  ${this.parseBold(trimmed.replace(/^[-*]\s*/, ''))}`, margin: [10, 2, 0, 2] } as Content;
            }

            const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
            if (numberedMatch) {
                return { text: `${numberedMatch[1]}. ${this.parseBold(numberedMatch[2])}`, margin: [10, 2, 0, 2] } as Content;
            }

            return { text: this.parseBold(trimmed), margin: [0, 2, 0, 2] };
        });
    }

    private static parseBold(text: string): any {
        const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
        if (parts.length === 1) return text;

        return parts.map((part) => {
            if (part.startsWith('**') && part.endsWith('**')) return { text: part.slice(2, -2), bold: true };
            return { text: part };
        });
    }
}