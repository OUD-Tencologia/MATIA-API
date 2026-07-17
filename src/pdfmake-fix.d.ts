declare module 'pdfmake/js/Printer' {
    import { TFontDictionary } from 'pdfmake/interfaces';
    class PdfPrinter {
        constructor(fontDescriptors: TFontDictionary);
        createPdfKitDocument(docDefinition: any, options?: any): any;
    }
    export default PdfPrinter;
}
