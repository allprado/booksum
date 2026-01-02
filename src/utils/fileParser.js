
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';

// Configurar o worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const extractTextFromFile = async (file) => {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        return await extractTextFromPDF(file);
    } else if (fileType === 'application/epub+zip' || fileName.endsWith('.epub')) {
        return await extractTextFromEPUB(file);
    } else {
        throw new Error('Formato de arquivo não suportado. Use PDF ou EPUB.');
    }
};

const extractTextFromPDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(' ');
        fullText += `\n\n--- Página ${i} ---\n\n${pageText}`;
    }

    return fullText;
};

const extractTextFromEPUB = async (file) => {
    const zip = new JSZip();
    const content = await zip.loadAsync(file);
    let fullText = '';

    // Encontrar o arquivo container.xml para localizar o OPF
    // Simplificação: Iterar por arquivos XHTML/HTML comuns em EPUBs
    // Uma abordagem mais robusta seria parsear o OPF, mas isso requer mais complexidade.
    // Vamos iterar por arquivos .html ou .xhtml e extrair texto.

    const textFiles = [];

    zip.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir && (relativePath.endsWith('.html') || relativePath.endsWith('.xhtml'))) {
            textFiles.push(relativePath);
        }
    });

    // Ordenar arquivos pode ser complicado sem o OPF, mas vamos tentar alfabeticamente ou manter ordem
    textFiles.sort();

    for (const filePath of textFiles) {
        const fileContent = await zip.file(filePath).async('string');
        const parser = new DOMParser();
        const doc = parser.parseFromString(fileContent, 'text/html');
        const text = doc.body.textContent || '';
        if (text.trim().length > 0) {
            fullText += `\n\n--- Seção: ${filePath} ---\n\n${text.trim()}`;
        }
    }

    if (!fullText) {
        throw new Error('Não foi possível extrair texto do EPUB. Verifique se é um arquivo válido.');
    }

    return fullText;
};
