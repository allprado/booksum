import { useState, useCallback } from 'react'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import BookList from './components/BookList'
import BookDetail from './components/BookDetail'
import SummaryView from './components/SummaryView'
import Toast from './components/Toast'
import { extractTextFromFile } from './utils/fileParser'
import './App.css'

function App() {
  const [view, setView] = useState('home') // home, detail, summary
  const [books, setBooks] = useState([])
  const [selectedBook, setSelectedBook] = useState(null)
  const [summary, setSummary] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [toast, setToast] = useState(null)

  // Configurações de áudio
  const [selectedVoice, setSelectedVoice] = useState('pt-BR-FranciscaNeural')
  const [speechRate, setSpeechRate] = useState('1.0')

  // Fonte de busca e Modelo de resumo
  const [searchSource, setSearchSource] = useState('google')
  const [summaryModel, setSummaryModel] = useState('gemini') // gemini, openrouter

  const availableVoices = [
    { id: 'pt-BR-FranciscaNeural', label: 'Francisca (Feminina)', gender: 'Female' },
    { id: 'pt-BR-AntonioNeural', label: 'Antonio (Masculino)', gender: 'Male' },
    { id: 'pt-BR-DonatoNeural', label: 'Donato (Masculino)', gender: 'Male' },
    { id: 'pt-BR-BrendaNeural', label: 'Brenda (Feminina)', gender: 'Female' },
    { id: 'pt-BR-ThalitaNeural', label: 'Thalita (Jovem)', gender: 'Female' }
  ]

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) return

    setIsSearching(true)
    try {
      let formattedBooks = []

      if (searchSource === 'google') {
        const response = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&langRestrict=pt&maxResults=20&printType=books`
        )
        const data = await response.json()

        if (data.items && data.items.length > 0) {
          formattedBooks = data.items
            .filter(item => item.volumeInfo.industryIdentifiers && item.volumeInfo.industryIdentifiers.length > 0 && item.volumeInfo.language?.startsWith('pt'))
            .map(item => ({
              id: item.id,
              title: item.volumeInfo.title || 'Título não disponível',
              authors: item.volumeInfo.authors || ['Autor desconhecido'],
              publisher: item.volumeInfo.publisher || 'Editora não informada',
              publishedDate: item.volumeInfo.publishedDate || 'Data não informada',
              description: item.volumeInfo.description || 'Descrição não disponível',
              pageCount: item.volumeInfo.pageCount || 0,
              categories: item.volumeInfo.categories || [],
              thumbnail: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
              language: item.volumeInfo.language,
              averageRating: item.volumeInfo.averageRating,
              ratingsCount: item.volumeInfo.ratingsCount,
              isbn: item.volumeInfo.industryIdentifiers.find(id => id.type === 'ISBN_13')?.identifier ||
                item.volumeInfo.industryIdentifiers.find(id => id.type === 'ISBN_10')?.identifier
            }))
        }
      } else if (searchSource === 'annas') {
        const rapidKey = import.meta.env.VITE_RAPIDAPI_KEY
        if (!rapidKey || rapidKey === 'sua_chave_rapidapi_aqui') {
          throw new Error('Configure sua API Key do RapidAPI (Anna\'s Archive) no arquivo .env')
        }

        const searchParams = new URLSearchParams({
          q: query,
          cat: 'fiction, nonfiction, comic, magazine, musicalscore, other, unknown',
          page: '1',
          ext: 'pdf, epub, mobi, azw3',
          source: 'libgenLi, libgenRs'
        });
        const url = `https://annas-archive-api.p.rapidapi.com/search?${searchParams.toString()}`;

        console.log('Searching Anna\'s:', url);

        const response = await fetch(
          url,
          {
            headers: {
              'x-rapidapi-key': rapidKey,
              'x-rapidapi-host': 'annas-archive-api.p.rapidapi.com'
            }
          }
        )

        if (!response.ok) throw new Error(`Erro na busca do Anna's Archive: ${response.status}`)
        const data = await response.json()

        if (data && data.books && data.books.length > 0) {
          formattedBooks = data.books.map(item => ({
            id: item.md5,
            md5: item.md5,
            title: item.title,
            authors: item.author ? [item.author] : ['Autor desconhecido'],
            publisher: 'Editora não informada',
            publishedDate: item.year || 'Ano não informado',
            description: `Formato: ${item.format?.toUpperCase()} | Tamanho: ${item.size}`,
            pageCount: 0,
            categories: [item.genre || 'Livro'],
            thumbnail: item.imgUrl ? item.imgUrl.replace('sk//', 'sk/') : null,
            language: 'Desconhecido',
            isbn: 'N/A',
            source: 'annas'
          }))
        }
      } else {
        // Open Library Search
        // Removemos language=por para trazer mais resultados, filtramos no cliente se possível
        const response = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`
        )
        const data = await response.json()

        if (data.docs && data.docs.length > 0) {
          formattedBooks = data.docs
            .slice(0, 20)
            .map(item => ({
              id: item.key, // formato "/works/OL..."
              title: item.title,
              authors: item.author_name || ['Autor desconhecido'],
              publisher: item.publisher ? item.publisher[0] : 'Editora não informada',
              publishedDate: item.first_publish_year ? String(item.first_publish_year) : 'Data não informada',
              description: item.first_sentence ? item.first_sentence[0] : 'Descrição detalhada não disponível na busca rápida.',
              pageCount: item.number_of_pages_median || 0,
              categories: item.subject ? item.subject.slice(0, 3) : [],
              thumbnail: item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg` : null,
              language: item.language ? item.language[0] : 'Desconhecido',
              averageRating: item.ratings_average,
              ratingsCount: item.ratings_count,
              isbn: item.isbn ? item.isbn[0] : 'N/A'
            }))
        }
      }

      if (formattedBooks.length > 0) {
        setBooks(formattedBooks)
      } else {
        setBooks([])
        showToast('Nenhum livro encontrado', 'warning')
      }
    } catch (error) {
      console.error('Erro na busca:', error)
      showToast('Erro ao buscar livros', 'error')
    } finally {
      setIsSearching(false)
    }
  }, [searchSource, showToast])

  const handleSelectBook = (book) => {
    setSelectedBook(book)
    setSummary(null)
    setAudioUrl(null)
    setView('detail')
  }

  const handleGenerateSummary = async (mode = 'analysis', file = null) => {
    if (!selectedBook) return

    setLoading(true)

    // Helper para chamar a API (Gemini ou OpenRouter)
    const callAI = async (promptText) => {
      if (summaryModel === 'gemini') {
        const geminiKey = import.meta.env.VITE_GOOGLE_API_KEY
        if (!geminiKey || geminiKey === 'sua_chave_google_aqui') {
          throw new Error('Configure sua API Key do Google (Gemini) no arquivo .env')
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 min timeout

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8192,
            }
          }),
          signal: controller.signal
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error?.message || `Erro na API Gemini: ${response.status}`)
        }
        const data = await response.json()
        return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      } else {
        // OpenRouter
        const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
        if (!apiKey || apiKey === 'sua_chave_openrouter_aqui') throw new Error('Configure sua API key do OpenRouter no arquivo .env')

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 120000)

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'BookSum'
          },
          body: JSON.stringify({
            model: 'xiaomi/mimo-v2-flash:free',
            messages: [{ role: 'user', content: promptText }]
          }),
          signal: controller.signal
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error?.message || `Erro na API: ${response.status}`)
        }
        const data = await response.json()
        return data.choices[0]?.message?.content || ''
      }
    }

    // Helper para obter arquivo do Anna's Archive
    const fetchAnnasFile = async (md5) => {
      const rapidKey = import.meta.env.VITE_RAPIDAPI_KEY
      if (!rapidKey) throw new Error('RapidAPI Key não encontrada no .env')

      const params = new URLSearchParams({ md5: md5 });
      const url = `https://annas-archive-api.p.rapidapi.com/download?${params.toString()}`;

      console.log('Fetching Anna\'s download:', url);
      console.log('Using RapidAPI Key:', rapidKey ? 'Present' : 'Missing');

      const response = await fetch(
        url,
        {
          headers: {
            'x-rapidapi-key': rapidKey,
            'x-rapidapi-host': 'annas-archive-api.p.rapidapi.com'
          }
        }
      )

      if (!response.ok) {
        let errorMsg = `Erro ${response.status} ao obter links`
        try {
          const errData = await response.json()
          errorMsg += `: ${JSON.stringify(errData)}`
        } catch (e) {
          const errText = await response.text().catch(() => '')
          if (errText) errorMsg += `: ${errText}`
        }
        throw new Error(errorMsg)
      }

      let links
      try {
        links = await response.json()
      } catch (e) {
        throw new Error('A API retornou um formato inesperado ao buscar links de download.')
      }

      const downloadUrl = Array.isArray(links) ? links[0] : (links.download_url || (links.urls && links.urls[0]))
      if (!downloadUrl) throw new Error('Nenhum link de download direto disponível para este livro')

      showToast('Baixando livro do Anna\'s Archive...', 'info')
      
      // Helper para validar se o conteúdo é binário válido
      const isValidBookFile = async (blob, expectedExt) => {
        // Verifica tamanho mínimo (10KB)
        if (blob.size < 10000) return false
        
        // Lê os primeiros bytes para verificar assinatura do arquivo
        const buffer = await blob.slice(0, 100).arrayBuffer()
        const bytes = new Uint8Array(buffer)
        
        // Verifica assinatura de PDF
        if (expectedExt === 'pdf') {
          const pdfSignature = '%PDF'
          const signature = String.fromCharCode(...bytes.slice(0, 4))
          return signature === pdfSignature
        }
        
        // Verifica assinatura de EPUB (é um arquivo ZIP)
        if (expectedExt === 'epub') {
          // ZIP signature: PK (0x50 0x4B)
          return bytes[0] === 0x50 && bytes[1] === 0x4B
        }
        
        return true // Para outros formatos, aceita
      }
      
      // Lista de proxies CORS para tentar
      const corsProxies = [
        url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
        url => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
        url => downloadUrl // Tentativa direta sem proxy
      ]

      let fileResponse = null
      let blob = null
      let lastError = null

      // Tenta cada proxy em sequência
      for (const proxyFn of corsProxies) {
        try {
          const proxyUrl = proxyFn(downloadUrl)
          console.log('Tentando download via:', proxyUrl)
          
          fileResponse = await fetch(proxyUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/octet-stream, application/pdf, application/epub+zip, */*'
            }
          })
          
          if (!fileResponse.ok) {
            console.warn(`Falha com status ${fileResponse.status}`)
            lastError = new Error(`HTTP ${fileResponse.status}`)
            continue
          }

          // Tenta obter o blob
          blob = await fileResponse.blob()
          
          // Detectar extensão esperada
          let expectedExt = 'epub'
          const contentType = fileResponse.headers.get('content-type')
          if (contentType?.includes('pdf') || downloadUrl.toLowerCase().endsWith('.pdf')) {
            expectedExt = 'pdf'
          } else if (contentType?.includes('epub') || downloadUrl.toLowerCase().endsWith('.epub')) {
            expectedExt = 'epub'
          }
          
          // Valida se é um arquivo válido
          const isValid = await isValidBookFile(blob, expectedExt)
          
          if (isValid) {
            console.log('Download bem-sucedido e arquivo validado')
            break
          } else {
            console.warn('Arquivo baixado é inválido (possivelmente HTML)')
            lastError = new Error('Arquivo inválido')
            blob = null
            fileResponse = null
          }
        } catch (err) {
          console.warn('Erro ao tentar proxy:', err.message)
          lastError = err
          blob = null
          fileResponse = null
        }
      }

      if (!blob || !fileResponse) {
        throw new Error('Não foi possível baixar o arquivo. Todos os métodos falharam. ' + (lastError?.message || ''))
      }

      // Validar tamanho mínimo
      if (blob.size === 0) {
        throw new Error('O arquivo baixado está vazio')
      }

      // Detectar extensão baseada no content-type ou URL
      let ext = 'epub'
      const contentType = fileResponse.headers.get('content-type')
      if (contentType?.includes('pdf') || downloadUrl.toLowerCase().endsWith('.pdf')) {
        ext = 'pdf'
      } else if (contentType?.includes('epub') || downloadUrl.toLowerCase().endsWith('.epub')) {
        ext = 'epub'
      } else if (downloadUrl.toLowerCase().endsWith('.mobi')) {
        ext = 'mobi'
      }

      console.log(`Arquivo baixado com sucesso: ${(blob.size / 1024 / 1024).toFixed(2)} MB, tipo: ${ext}`)
      return new File([blob], `book_${md5}.${ext}`, { type: blob.type || 'application/octet-stream' })
    }

    try {
      let finalSummary = ''

      if (mode === 'summary') {
        let bookFile = file

        // Se não tem arquivo mas é do Anna's Archive, tenta baixar
        if (!bookFile && selectedBook.md5) {
          try {
            bookFile = await fetchAnnasFile(selectedBook.md5)
          } catch (err) {
            console.error(err)
            showToast('Falha no download automático. Por favor, faça o upload manual do arquivo.', 'error')
            throw new Error('Não foi possível obter o arquivo automaticamente. Faça o upload manual para continuar.')
          }
        }

        if (!bookFile) {
          throw new Error('Para gerar o resumo narrativo fiel, por favor faça o upload do arquivo PDF ou EPUB do livro.')
        }

        if (bookFile) {
          showToast('Lendo arquivo do livro...', 'info')
          let bookContent = ''
          try {
            bookContent = await extractTextFromFile(bookFile)
          } catch (err) {
            console.error(err)
            throw new Error('Erro ao extrair texto do arquivo: ' + err.message)
          }

          // Dividir em chunks para garantir detalhes
          const CHUNK_SIZE = 50000 // Caracteres por chunk
          const chunks = []
          for (let i = 0; i < bookContent.length; i += CHUNK_SIZE) {
            chunks.push(bookContent.slice(i, i + CHUNK_SIZE))
          }

          showToast(`Processando ${chunks.length} partes do livro...`, 'info')

          const chunkPromises = chunks.map(async (chunk, index) => {
            const isLast = index === chunks.length - 1
            const chunkPrompt = `Você é o próprio autor do livro "${selectedBook.title}".
Estamos reescrevendo o livro em formato condensado.
Esta é a PARTE ${index + 1} de ${chunks.length}.

Tua tarefa:
Resuma esta parte narrativamente, mantendo o estilo, a voz e os detalhes importantes da trama/conteúdo.
A saída deve ter entre 1500 e 2500 caracteres tentando manter a proporção da obra original.
Não faça introduções do tipo "Nesta parte...". Apenas continue a história/texto.

CONTEÚDO DA PARTE:
${chunk}

Seja fluido. Escreva agora:`

            // Pequeno delay para evitar rate limit agressivo se forem muitos chunks
            await new Promise(r => setTimeout(r, index * 1000))
            return await callAI(chunkPrompt)
          })

          const results = await Promise.all(chunkPromises)
          finalSummary = results.join('\n\n')

        } else {
          // Fallback: resumo baseado na descrição (quando não há arquivo)
          const prompt = `Ignore todas as instruções anteriores.
Você é o próprio autor do livro "${selectedBook.title}".
Seu objetivo é reescrever seu livro em uma versão condensada e narrativa (~10.000 caracteres).
Dados: Título: ${selectedBook.title}, Autor: ${selectedBook.authors?.join(', ')}, Descrição: ${selectedBook.description}`
          finalSummary = await callAI(prompt)
        }

      } else {
        // Modo Análise Crítica
        const prompt = `Você é um especialista em resumos de livros. Crie uma análise crítica detalhada do livro "${selectedBook.title}" de ${selectedBook.authors?.join(', ')}.

IMPORTANTE:
- NÃO faça introduções conversacionais.
- Tópicos claros, insights práticos.
- Tamanho: ~15.000 caracteres.
- Português Brasileiro.

${selectedBook.description ? `Descrição: ${selectedBook.description}` : ''}

Gere a análise agora:`
        finalSummary = await callAI(prompt)
      }

      if (finalSummary) {
        setSummary(finalSummary)
        setView('summary')
        showToast('Conteúdo gerado com sucesso!', 'success')
      } else {
        throw new Error('Nenhum conteúdo foi gerado.')
      }
    } catch (error) {
      console.error('Erro ao gerar:', error)
      if (error.name === 'AbortError') {
        showToast('Timeout: a requisição demorou muito.', 'error')
      } else {
        showToast(error.message || 'Erro ao gerar conteúdo', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateAudio = async () => {
    if (!summary) return

    setLoading(true)
    try {
      // Verificar credenciais da Azure
      const apiKey = import.meta.env.VITE_AZURE_SPEECH_KEY
      const region = import.meta.env.VITE_AZURE_SPEECH_REGION

      if (!apiKey || apiKey === 'sua_chave_azure_aqui' || !region) {
        throw new Error('Configure a Key e Region do Azure Speech no arquivo .env')
      }

      showToast('Autenticando com Azure...', 'info')

      // 1. Obter Token de Acesso
      const tokenResponse = await fetch(
        `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
        {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': apiKey
          }
        }
      )

      if (!tokenResponse.ok) {
        throw new Error(`Erro na autenticação Azure: ${tokenResponse.statusText}`)
      }

      const accessToken = await tokenResponse.text()

      // Limpar o texto removendo formatações markdown
      const cleanText = summary
        .replace(/#{1,6}\s/g, '') // Remove headers markdown
        .replace(/\*\*/g, '') // Remove bold
        .replace(/\*/g, '') // Remove italic
        .replace(/`/g, '') // Remove code blocks
        .replace(/\n\n+/g, '\n') // Remove múltiplas quebras de linha
        .trim()

      // Azure aceita SSML. Vamos dividir em chunks seguros.
      const maxChunkSize = 3000 // Limite seguro para SSML
      const chunks = []
      let currentChunk = ''

      const sentences = cleanText.split(/(?<=[.!?])\s+/)
      for (const sentence of sentences) {
        if ((currentChunk + sentence).length > maxChunkSize) {
          if (currentChunk) chunks.push(currentChunk.trim())
          currentChunk = sentence
        } else {
          currentChunk += (currentChunk ? ' ' : '') + sentence
        }
      }
      if (currentChunk) chunks.push(currentChunk.trim())

      // Limitar a 10 chunks para evitar custos excessivos/tempo
      const chunksToProcess = chunks.slice(0, 10)

      showToast(`Gerando áudio... (${chunksToProcess.length} partes)`, 'info')

      // Gerar áudio para cada chunk
      const audioBuffers = []
      for (let i = 0; i < chunksToProcess.length; i++) {
        const chunkText = chunksToProcess[i]

        // Construir SSML com voz e velocidade configuradas
        const voiceConfig = availableVoices.find(v => v.id === selectedVoice) || availableVoices[0]

        const ssml = `
          <speak version='1.0' xml:lang='pt-BR'>
            <voice xml:lang='pt-BR' xml:gender='${voiceConfig.gender}' name='${selectedVoice}'>
              <prosody rate='${speechRate}'>
                ${chunkText}
              </prosody>
            </voice>
          </speak>`

        const response = await fetch(
          `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/ssml+xml',
              'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
              'User-Agent': 'BookSum'
            },
            body: ssml
          }
        )

        if (!response.ok) {
          console.error('Erro Azure:', await response.text())
          throw new Error(`Erro na API Azure TTS: ${response.status}`)
        }

        const arrayBuffer = await response.arrayBuffer()
        audioBuffers.push(new Uint8Array(arrayBuffer))
      }

      // Concatenar buffers
      const totalLength = audioBuffers.reduce((acc, buf) => acc + buf.length, 0)
      const combinedBuffer = new Uint8Array(totalLength)
      let offset = 0
      for (const buffer of audioBuffers) {
        combinedBuffer.set(buffer, offset)
        offset += buffer.length
      }

      const audioBlob = new Blob([combinedBuffer], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(audioBlob)
      setAudioUrl(url)
      showToast('Áudio gerado com sucesso!', 'success')
    } catch (error) {
      console.error('Erro ao gerar áudio:', error)
      showToast(error.message || 'Erro ao gerar áudio', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (view === 'summary') {
      setView('detail')
    } else if (view === 'detail') {
      setView('home')
      setSelectedBook(null)
    }
  }

  const handleHome = () => {
    setView('home')
    setSelectedBook(null)
    setSummary(null)
    setAudioUrl(null)
  }

  return (
    <div className="app">
      <Header
        onBack={view !== 'home' ? handleBack : null}
        onHome={handleHome}
        showLogo={view === 'home'}
      />

      <main className="main-content">
        {view === 'home' && (
          <div className="home-view animate-fadeIn">
            <div className="hero-section">
              <h1 className="hero-title">
                <span className="text-gradient">Resumos de Livros</span>
                <br />em Áudio
              </h1>
              <p className="hero-subtitle">
                Aprenda o essencial de qualquer livro em apenas 20 minutos
              </p>
            </div>

            <SearchBar
              onSearch={handleSearch}
              loading={isSearching}
              source={searchSource}
              onSourceChange={setSearchSource}
            />

            {books.length > 0 && (
              <BookList
                books={books}
                onSelectBook={handleSelectBook}
                loading={isSearching}
              />
            )}

            {!isSearching && books.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📚</div>
                <p>Busque por livros em português para começar</p>
              </div>
            )}
          </div>
        )}

        {view === 'detail' && selectedBook && (
          <BookDetail
            book={selectedBook}
            onGenerateSummary={handleGenerateSummary}
            loading={loading}
            model={summaryModel}
            onModelChange={setSummaryModel}
          />
        )}

        {view === 'summary' && summary && (
          <SummaryView
            book={selectedBook}
            summary={summary}
            audioUrl={audioUrl}
            onGenerateAudio={handleGenerateAudio}
            loading={loading}
            selectedVoice={selectedVoice}
            onVoiceChange={setSelectedVoice}
            speechRate={speechRate}
            onRateChange={setSpeechRate}
            availableVoices={availableVoices}
          />
        )}
      </main>

      {toast && <Toast message={toast.message} type={toast.type} />}

      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner-large"></div>
            <p>Processando...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
