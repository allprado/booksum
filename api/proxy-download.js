// Vercel Serverless Function para proxy de downloads
// Contorna problemas de CORS ao baixar livros

export const config = {
  maxDuration: 60, // 60 segundos para download
};

export default async function handler(req, res) {
  // Permitir CORS do seu domínio
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    console.log('Proxy downloading:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/octet-stream, application/pdf, application/epub+zip, */*',
        'Referer': 'https://libgen.li/'
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      console.error(`Download failed with status ${response.status}`);
      return res.status(502).json({ 
        error: `Source server error: ${response.status} ${response.statusText}`,
        details: 'O servidor de origem não retornou o arquivo corretamente'
      });
    }

    // Pegar o conteúdo
    const buffer = await response.arrayBuffer();
    
    console.log(`Downloaded ${buffer.byteLength} bytes`);
    
    // Validar tamanho mínimo (10KB) - mas com mais tolerância
    if (buffer.byteLength < 1000) {
      const preview = Buffer.from(buffer).toString('utf-8', 0, Math.min(500, buffer.byteLength));
      console.error('File too small. Preview:', preview);
      return res.status(502).json({ 
        error: 'File too small (possibly HTML error page)',
        details: 'O servidor retornou um arquivo muito pequeno, provavelmente uma página de erro',
        size: buffer.byteLength
      });
    }

    // Detectar tipo de conteúdo
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Verificar assinatura do arquivo
    const bytes = new Uint8Array(buffer);
    const isPdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46; // %PDF
    const isZip = bytes[0] === 0x50 && bytes[1] === 0x4B; // PK (ZIP/EPUB)
    const isMobi = bytes[0] === 0x4D && bytes[1] === 0x4F && bytes[2] === 0x42 && bytes[3] === 0x49; // MOBI
    
    // Se começar com < ou <!DOCTYPE, é HTML
    const isHtml = bytes[0] === 0x3C && (bytes[1] === 0x21 || bytes[1] === 0x68 || bytes[1] === 0x48);
    
    if (isHtml) {
      const preview = Buffer.from(buffer).toString('utf-8', 0, Math.min(500, buffer.byteLength));
      console.error('HTML detected instead of book file. Preview:', preview);
      return res.status(502).json({ 
        error: 'Invalid file format (HTML page returned)',
        details: 'O servidor retornou uma página HTML ao invés de um arquivo de livro'
      });
    }
    
    if (!isPdf && !isZip && !isMobi) {
      const signature = Array.from(bytes.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' ');
      console.error(`Invalid file signature: ${signature}`);
      
      // Relaxar validação - permitir passar mesmo se não reconhecer
      console.warn('Unknown file format, but allowing download');
    }

    console.log(`Valid book file detected. Type: ${isPdf ? 'PDF' : isZip ? 'EPUB/ZIP' : isMobi ? 'MOBI' : 'UNKNOWN'}, Size: ${(buffer.byteLength / 1024 / 1024).toFixed(2)}MB`);

    // Retornar o arquivo
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buffer.byteLength);
    res.setHeader('Content-Disposition', 'attachment');
    
    return res.status(200).send(Buffer.from(buffer));

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      error: 'Proxy failed',
      message: error.message,
      details: 'Erro interno ao processar o download'
    });
  }
}
