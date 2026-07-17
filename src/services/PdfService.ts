import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const PDFDocument = require('pdfkit');

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
        if (q.includes('relatorio') || q.includes('relacao')) return 'Relatório';
        if (q.includes('resumo')) return 'Resumo de Auto-Avaliação';
        if (q.includes('contrato')) return 'Análise de Contrato';
        if (q.includes('peticao')) return 'Petição';
        if (q.includes('notificacao')) return 'Notificação';
        if (q.includes('recurso')) return 'Recurso';
        if (q.includes('defesa')) return 'Defesa';
        if (q.includes('memorial')) return 'Memorial';
        if (q.includes('laudo')) return 'Laudo';
        if (q.includes('analise')) return 'Análise Técnica';
        if (q.includes('declaracao')) return 'Declaração';
        if (q.includes('consulta')) return 'Consulta Técnica';

        return 'Documento Oficial';
    }

    static async generateFromText(text: string, options?: { title?: string }): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    margin: 55,
                    size: 'A4',
                    bufferPages: true
                });
                const chunks: Buffer[] = [];

                doc.on('data', (chunk: Buffer) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                // Espaçamento estável entre linhas
                doc.lineGap(3);

                const primaryColor = '#1A365D';
                const textColor = '#2D3748';
                const lightGrey = '#E2E8F0';

                doc.fillColor(textColor);

                if (options?.title) {
                    doc.font('Helvetica-Bold')
                        .fontSize(20)
                        .fillColor(primaryColor)
                        .text(options.title.toUpperCase(), { align: 'center' });
                    doc.moveDown(1.5);
                }

                const lines = text.split('\n');

                for (let line of lines) {
                    let trimmed = line.trim();
                    if (trimmed.length === 0) {
                        doc.moveDown(0.4);
                        continue;
                    }

                    if (trimmed === '---') {
                        doc.moveDown(0.2);
                        doc.moveTo(doc.page.margins.left, doc.y)
                            .lineTo(doc.page.width - doc.page.margins.right, doc.y)
                            .strokeColor(lightGrey)
                            .lineWidth(1)
                            .stroke();
                        doc.moveDown(0.4);
                        continue;
                    }

                    if (line.startsWith('# ')) {
                        const content = line.replace('# ', '');
                        doc.font('Helvetica-Bold').fontSize(16).fillColor(primaryColor).text(content);
                        doc.moveDown(0.6);
                        continue;
                    }
                    if (line.startsWith('## ')) {
                        const content = line.replace('## ', '');
                        doc.font('Helvetica-Bold').fontSize(13).fillColor(primaryColor).text(content);
                        doc.moveDown(0.5);
                        continue;
                    }
                    if (line.startsWith('### ')) {
                        const content = line.replace('### ', '');
                        doc.font('Helvetica-Bold').fontSize(11).fillColor('#4A5568').text(content);
                        doc.moveDown(0.4);
                        continue;
                    }
                    if (line.startsWith('#### ')) {
                        const content = line.replace('#### ', '');
                        doc.font('Helvetica-BoldOblique').fontSize(10).fillColor('#718096').text(content);
                        doc.moveDown(0.3);
                        continue;
                    }

                    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                        const content = trimmed.replace(/^[-*]\s+/, '');
                        doc.font('Helvetica').fontSize(10.5).fillColor(textColor);

                        doc.text('  •  ', { continued: true });
                        this.renderInlineFormatting(doc, content);
                        doc.moveDown(0.3);
                        continue;
                    }

                    doc.font('Helvetica').fontSize(10.5).fillColor(textColor);
                    this.renderInlineFormatting(doc, trimmed);
                    doc.moveDown(0.4);
                }

                // ─────────────────────────────────────────────────────────────
                // CORREÇÃO DOS RODAPÉS (FIM DAS PÁGINAS FANTASMAS)
                // ─────────────────────────────────────────────────────────────
                const range = doc.bufferedPageRange();
                for (let i = range.start; i < range.start + range.count; i++) {
                    doc.switchToPage(i);

                    // Salvamos a margem antiga e zeramos para ignorar auto-breaks de rodapé
                    const oldBottomMargin = doc.page.margins.bottom;
                    doc.page.margins.bottom = 0;

                    doc.font('Helvetica').fontSize(8.5).fillColor('#718096');
                    doc.text(
                        `Página ${i + 1} de ${range.count}`,
                        doc.page.margins.left,
                        doc.page.height - 35, // Escreve com segurança na margem física inferior
                        {
                            align: 'center',
                            width: doc.page.width - doc.page.margins.left - doc.page.margins.right
                        }
                    );

                    // Restauramos a margem original para manter o documento íntegro
                    doc.page.margins.bottom = oldBottomMargin;
                }

                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }

    private static renderInlineFormatting(doc: any, text: string) {
        const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isLast = i === parts.length - 1;

            if (part.startsWith('**') && part.endsWith('**')) {
                const cleanText = part.slice(2, -2);
                doc.font('Helvetica-Bold').text(cleanText, { continued: !isLast });
            } else {
                doc.font('Helvetica').text(part, { continued: !isLast });
            }
        }
    }
}