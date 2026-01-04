import { useState, useCallback } from 'react'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import BookList from './components/BookList'
import BookDetail from './components/BookDetail'
import SummaryView from './components/SummaryView'
import BottomNav from './components/BottomNav'
import Toast from './components/Toast'
import './App.css'

function App({ isAdminMode = false }) {
  const [view, setView] = useState('home') // home, detail, summary
  const [books, setBooks] = useState([])
  const [selectedBook, setSelectedBook] = useState(null)
  const [summary, setSummary] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [audioChapters, setAudioChapters] = useState([]) // Array de {title, audioUrl, startPos, endPos}
  const [loading, setLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [toast, setToast] = useState(null)
  const [currentQuery, setCurrentQuery] = useState('')
  const [hasMoreResults, setHasMoreResults] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // Configurações de áudio
  const [selectedVoice, setSelectedVoice] = useState('pt-BR-FranciscaNeural')
  const [speechRate, setSpeechRate] = useState('1.0')

  // Fonte de busca e Modelo de resumo - fixos no modo público
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

  const handleSearch = useCallback(async (query, pageNum = 1) => {
    if (!query.trim()) return

    const isNewSearch = pageNum === 1
    if (isNewSearch) {
      setIsSearching(true)
    } else {
      setLoading(true)
    }

    try {
      let formattedBooks = []
      let hasMore = false

      // No modo público, usa apenas Google Books
      const effectiveSource = isAdminMode ? searchSource : 'google'

      if (effectiveSource === 'google') {
        const startIndex = (pageNum - 1) * 40
        // Usar busca com aspas para melhor precisão em buscas por título
        // Isso prioriza resultados que contêm exatamente o termo buscado
        const googleQuery = `"${encodeURIComponent(query)}"`
        const response = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${googleQuery}&maxResults=40&startIndex=${startIndex}&printType=books`
        )
        const data = await response.json()

        if (data.items && data.items.length > 0) {
          const filtered = data.items
            .filter(item => item.volumeInfo.industryIdentifiers && item.volumeInfo.industryIdentifiers.length > 0 && (
              item.volumeInfo.language?.startsWith('pt') || // Português (pt, pt-BR, pt-PT)
              item.volumeInfo.language === 'gl' || // Galego (língua muito próxima ao português)
              item.volumeInfo.language === 'es' || // Espanhol (muitas edições compartilhadas)
              item.volumeInfo.language === 'ca'    // Catalão (também ibérico)
            ))
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
          formattedBooks = filtered
          // Google Books indica se há mais resultados pela presença de totalItems
          hasMore = data.totalItems > startIndex + filtered.length
        }
      } else if (effectiveSource === 'annas') {
        const rapidKey = import.meta.env.VITE_RAPIDAPI_KEY
        if (!rapidKey || rapidKey === 'sua_chave_rapidapi_aqui') {
          throw new Error('Configure sua API Key do RapidAPI (Anna\'s Archive) no arquivo .env')
        }

        const searchParams = new URLSearchParams({
          q: query,
          cat: 'fiction, nonfiction, comic, magazine, musicalscore, other, unknown',
          page: pageNum.toString(),
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
          formattedBooks = data.books.map(item => {
            // Processa a URL da imagem para evitar problemas de QUIC
            let thumbnailUrl = null
            if (item.imgUrl) {
              thumbnailUrl = item.imgUrl.replace('sk//', 'sk/')
              // Tenta usar HTTP ao invés de HTTPS para evitar problemas QUIC
              // se a imagem tiver problemas com HTTPS
              if (thumbnailUrl.startsWith('https://s3proxy.cdn-zlib.sk')) {
                // Mante HTTPS mas log o problema se houver
                console.debug('Imagem do Anna\'s Archive:', item.md5, thumbnailUrl)
              }
            }
            
            return {
              id: item.md5,
              md5: item.md5,
              title: item.title,
              authors: item.author ? [item.author] : ['Autor desconhecido'],
              publisher: 'Editora não informada',
              publishedDate: item.year || 'Ano não informado',
              description: `Formato: ${item.format?.toUpperCase()} | Tamanho: ${item.size}`,
              pageCount: 0,
              categories: [item.genre || 'Livro'],
              thumbnail: thumbnailUrl,
              language: 'Desconhecido',
              isbn: 'N/A',
              source: 'annas'
            }
          })
          // Anna's Archive retorna resultados completos em cada página
          hasMore = formattedBooks.length === 20
        }
      } else {
        // Open Library Search
        const offset = (pageNum - 1) * 20
        const response = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20&offset=${offset}`
        )
        const data = await response.json()

        if (data.docs && data.docs.length > 0) {
          formattedBooks = data.docs
            .map(item => ({
              id: item.key,
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
          hasMore = data.docs.length === 20 && data.numFound > offset + 20
        }
      }

      if (isNewSearch) {
        setBooks(formattedBooks)
        setCurrentQuery(query)
        setCurrentPage(1)
      } else {
        setBooks(prev => [...prev, ...formattedBooks])
        setCurrentPage(pageNum)
      }
      setHasMoreResults(hasMore)

      if (isNewSearch && formattedBooks.length === 0) {
        showToast('Nenhum livro encontrado', 'warning')
      }
    } catch (error) {
      console.error('Erro na busca:', error)
      showToast('Erro ao buscar livros', 'error')
    } finally {
      if (isNewSearch) {
        setIsSearching(false)
      } else {
        setLoading(false)
      }
    }
  }, [searchSource, showToast, isAdminMode])

  const handleLoadMore = useCallback(() => {
    if (currentQuery && !loading) {
      handleSearch(currentQuery, currentPage + 1)
    }
  }, [currentQuery, currentPage, loading, handleSearch])

  const handleSelectBook = (book) => {
    setSelectedBook(book)
    setSummary(null)
    setAudioUrl(null)
    setView('detail')
  }

  const handleGenerateSummary = async () => {
    if (!selectedBook) return

    setLoading(true)

    // No modo público, força o uso do Gemini
    const effectiveModel = isAdminMode ? summaryModel : 'gemini'

    // Helper para chamar a API (Gemini ou OpenRouter)
    const callAI = async (promptText) => {
      if (effectiveModel === 'gemini') {
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

    try {
      // Primeiro, verifica se a IA possui conhecimento real sobre o livro
      showToast('Verificando conhecimento sobre o livro...', 'info')
      
      const verificationPrompt = `Você tem conhecimento real e detalhado sobre o livro "${selectedBook.title}" de ${selectedBook.authors?.join(', ')}?

IMPORTANTE: Responda APENAS "SIM" se você realmente conhece o conteúdo completo deste livro específico (não confunda com outros livros do mesmo autor ou títulos similares). Responda "NÃO" se você não tem certeza ou se não conhece o livro em detalhes.

Sua resposta (SIM ou NÃO):`

      const verification = await callAI(verificationPrompt)
      const hasKnowledge = verification.trim().toUpperCase().includes('SIM')
      
      if (!hasKnowledge) {
        throw new Error(`Não possuo conhecimento detalhado suficiente sobre o livro "${selectedBook.title}" para criar um resumo confiável. Isso significa que eu poderia inventar ou criar informações incorretas sobre o livro.

Por favor, tente outro livro que esteja em minha base de conhecimento.`)
      }
      
      showToast('Gerando resumo estilo Blink...', 'info')
      
      // Prompt unificado estilo Blink com instruções rigorosas
      const prompt = `Escreva um resumo detalhado do livro "${selectedBook.title}", de ${selectedBook.authors?.join(', ')}, seguindo o estilo de um 'Blink'. O texto deve ser estruturado da seguinte forma:

Introdução: Comece com um título chamativo no formato "Por que ler este livro?" e apresente a tese central ou o conflito principal da obra.

Capítulos Adaptáveis: Divida o conteúdo em uma quantidade de capítulos (seções) que faça sentido para a obra (geralmente entre 5 e 10). Cada capítulo deve começar com um título em negrito no formato "**Capítulo X de Y**" seguido de uma frase que resuma a lição ou o arco narrativo daquela seção.

Nível de Análise: O texto não deve ser apenas um relato de fatos. Ele deve oferecer uma análise profunda sobre o comportamento humano, motivações psicológicas, contextos históricos ou aplicações práticas, dependendo do gênero do livro.

Estilo e Tom: Use um tom empático, instrutivo e fluído. Evite listas de tópicos (bullets); prefira parágrafos narrativos que conectem uma ideia à outra.

Critério de Extensão: Garanta que cada seção tenha profundidade suficiente para que o leitor sinta que compreendeu a lógica do autor, não apenas o resultado final.

Resumo Final: Encerre com uma seção chamada "**Resumo Final**" que sintetize a mensagem mais duradoura do livro em um parágrafo impactante.

Ajuste o número total de capítulos para cobrir todos os pilares essenciais do livro sem ser repetitivo ou superficial.

CRÍTICO: Baseie-se SOMENTE no conteúdo real do livro. NÃO invente, NÃO suponha, NÃO crie informações que não estejam no livro. Se você não tem certeza sobre alguma informação específica, omita-a ao invés de inventá-la.

${selectedBook.description ? `\n\nDescrição do livro: ${selectedBook.description}` : ''}

Gere o resumo completo agora em português brasileiro:`

      const finalSummary = await callAI(prompt)

      if (finalSummary) {
        // Limpar caracteres de separação markdown que possam ter sido incluídos
        const cleanedSummary = finalSummary
          .replace(/^#+\s*$/gm, '') // Remove linhas que só contêm # (heading vazios)
          .replace(/\n{3,}/g, '\n\n') // Remove excesso de quebras de linha
          .trim()
        
        setSummary(cleanedSummary)
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

      // 2. Extrair capítulos do resumo
      const chapterRegex = /\*?\*?Capítulo\s+(\d+)\s+de\s+(\d+)\*?\*?[:\-\s]*(.*?)(?=\n|$)/gi
      const matches = [...summary.matchAll(chapterRegex)]
      
      let chaptersToGenerate = []
      
      if (matches.length > 0) {
        // Tem capítulos definidos - gera áudio para cada um
        showToast(`Encontrados ${matches.length} capítulos. Gerando áudio...`, 'info')
        
        for (let i = 0; i < matches.length; i++) {
          const match = matches[i]
          const chapterNum = parseInt(match[1])
          const chapterTitle = match[3]?.trim() || `Capítulo ${chapterNum}`
          const startPos = match.index
          const endPos = i < matches.length - 1 ? matches[i + 1].index : summary.length
          
          const chapterContent = summary.substring(startPos, endPos)
          
          chaptersToGenerate.push({
            number: chapterNum,
            title: chapterTitle,
            content: chapterContent,
            startPos,
            endPos
          })
        }
      } else {
        // Não tem capítulos - gera um único áudio completo
        showToast('Nenhum capítulo detectado. Gerando áudio completo...', 'info')
        chaptersToGenerate.push({
          number: 1,
          title: 'Resumo Completo',
          content: summary,
          startPos: 0,
          endPos: summary.length
        })
      }

      const generatedChapters = []
      
      // Gera áudio para cada capítulo
      for (let i = 0; i < chaptersToGenerate.length; i++) {
        const chapter = chaptersToGenerate[i]
        showToast(`Gerando áudio do capítulo ${chapter.number}/${chaptersToGenerate.length}...`, 'info')
        
        // Limpar o texto removendo formatações markdown
        const cleanText = chapter.content
          .replace(/#{1,6}\s/g, '') // Remove headers markdown
          .replace(/\*\*/g, '') // Remove bold
          .replace(/\*/g, '') // Remove italic
          .replace(/`/g, '') // Remove code blocks
          .replace(/\n\n+/g, '\n') // Remove múltiplas quebras de linha
          .trim()

        // Dividir em chunks se necessário (cada chunk não pode passar de 3000 caracteres)
        const maxChunkSize = 3000
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

        // Gerar áudio para cada chunk deste capítulo
        const audioBuffers = []
        for (let j = 0; j < chunks.length; j++) {
          const chunkText = chunks[j]

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

        // Concatenar buffers deste capítulo
        const totalLength = audioBuffers.reduce((acc, buf) => acc + buf.length, 0)
        const combinedBuffer = new Uint8Array(totalLength)
        let offset = 0
        for (const buffer of audioBuffers) {
          combinedBuffer.set(buffer, offset)
          offset += buffer.length
        }

        const audioBlob = new Blob([combinedBuffer], { type: 'audio/mpeg' })
        const chapterAudioUrl = URL.createObjectURL(audioBlob)
        
        generatedChapters.push({
          number: chapter.number,
          title: chapter.title,
          audioUrl: chapterAudioUrl,
          startPos: chapter.startPos,
          endPos: chapter.endPos
        })
      }

      // Salvar os capítulos com áudio
      setAudioChapters(generatedChapters)
      
      // Também salva o primeiro capítulo como audioUrl principal para retrocompatibilidade
      if (generatedChapters.length > 0) {
        setAudioUrl(generatedChapters[0].audioUrl)
      }
      
      showToast(`${generatedChapters.length} ${generatedChapters.length === 1 ? 'áudio gerado' : 'áudios gerados'} com sucesso!`, 'success')
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
    setAudioChapters([])
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
                Resumos de <br />
                <span className="text-gradient">Livros</span> em Áudio
              </h1>
              <p className="hero-subtitle">
                Aprenda o essencial de qualquer livro em apenas 20 minutos.
              </p>
            </div>

            <SearchBar
              onSearch={handleSearch}
              loading={isSearching}
              source={searchSource}
              onSourceChange={setSearchSource}
              showSourceSelector={isAdminMode}
            />

            {books.length > 0 && (
              <BookList
                books={books}
                onSelectBook={handleSelectBook}
                loading={isSearching}
                hasMoreResults={hasMoreResults}
                onLoadMore={handleLoadMore}
                isLoadingMore={loading && !isSearching}
              />
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
            showModelSelector={isAdminMode}
          />
        )}

        {view === 'summary' && summary && (
          <SummaryView
            book={selectedBook}
            summary={summary}
            audioUrl={audioUrl}
            audioChapters={audioChapters}
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

      <BottomNav currentView={view} onNavigate={setView} />

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
