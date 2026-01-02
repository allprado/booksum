// Vercel Serverless Function para proxy de downloads
// Contorna problemas de CORS ao baixar livros

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
      return res.status(response.status).json({ 
        error: `Failed to download: ${response.status} ${response.statusText}` 
      });
    }

    // Pegar o conteúdo
    const buffer = await response.arrayBuffer();
    
    // Validar tamanho mínimo (10KB)
    if (buffer.byteLength < 10000) {
      return res.status(400).json({ 
        error: 'File too small (possibly HTML error page)' 
      });
    }

    // Detectar tipo de conteúdo
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Verificar assinatura do arquivo
    const bytes = new Uint8Array(buffer);
    const isPdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46; // %PDF
    const isZip = bytes[0] === 0x50 && bytes[1] === 0x4B; // PK (ZIP/EPUB)
    
    if (!isPdf && !isZip) {
      console.error('Invalid file signature');
      return res.status(400).json({ 
        error: 'Invalid file format (not PDF or EPUB)' 
      });
    }

    // Retornar o arquivo
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buffer.byteLength);
    res.setHeader('Content-Disposition', 'attachment');
    
    return res.status(200).send(Buffer.from(buffer));

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      error: 'Proxy failed',
      message: error.message 
    });
  }
}
