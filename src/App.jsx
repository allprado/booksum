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
    try {
      let prompt = ''
      let bookContent = ''

      if (mode === 'summary') {
        if (file) {
          showToast('Lendo arquivo do livro...', 'info')
          try {
            bookContent = await extractTextFromFile(file)
            showToast('Conteúdo extraído! Gerando resumo...', 'info')
          } catch (err) {
            console.error(err)
            throw new Error('Erro ao ler o arquivo: ' + err.message)
          }
        } else {
          // Fallback se não houver arquivo (usa descrição)
          // Mas a UI bloqueia isso agora.
          bookContent = `Título: ${selectedBook.title}\nAutor: ${selectedBook.authors?.join(', ')}\nDescrição: ${selectedBook.description}`
        }

        prompt = `Ignore todas as instruções anteriores.
Você é o próprio autor do livro "${selectedBook.title}".
Seu objetivo é reescrever seu livro em uma versão condensada e narrativa, mantendo seu estilo, voz e a fluidez da história original.
Utilize o CONTEÚDO FORNECIDO ABAIXO como base para sua reescrita. O conteúdo pode estar fragmentado, então faça o melhor para conectar as partes de forma coesa.

IMPORTANTE:
- Texto corrido e fluido, dividido em capítulos ou seções narrativas.
- Mantenha a primeira pessoa ou terceira pessoa conforme o original.
- Tamanho: Aproximadamente 20.000 caracteres.
- Idioma: Português Brasileiro.

CONTEÚDO DO LIVRO:
${bookContent.slice(0, 500000)} 
(Conteúdo truncado se for muito grande, mas suficiente para um bom resumo)

Comece a reescrever o livro agora:`
      } else {
        // Modo Análise (Analysis) - Prompt original
        prompt = `Você é um especialista em resumos de livros. Crie uma análise crítica e detalhada do livro "${selectedBook.title}" de ${selectedBook.authors?.join(', ')}.

IMPORTANTE:
- NÃO faça introduções conversacionais.
- NÃO mencione "Blinkist".
- Comece diretamente pelo título ou primeiro tópico.
- Mantenha o tom profissional e direto.

O resumo deve:
1. Ter aproximadamente 20.000 caracteres.
2. Começar com uma introdução sobre a importância do livro.
3. Apresentar os principais conceitos e ideias organizados em seções claras.
4. Incluir insights práticos e aplicáveis.
5. Ter uma conclusão que resume os pontos-chave.

${selectedBook.description ? `\nDescrição do livro: ${selectedBook.description}` : ''}

Formato:
- Use títulos claros (## Seção).
- Seja envolvente e didático.
- Escreva em português brasileiro.`
      }

      // Selecionar API e Chave baseada no modelo
      let generatedSummary = ''

      if (summaryModel === 'gemini') {
        const geminiKey = import.meta.env.VITE_GOOGLE_API_KEY
        if (!geminiKey || geminiKey === 'sua_chave_google_aqui') {
          throw new Error('Configure sua API Key do Google (Gemini) no arquivo .env')
        }

        // Criar AbortController para timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minutos timeout

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
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
        generatedSummary = data.candidates?.[0]?.content?.parts?.[0]?.text
      } else {
        // OpenRouter (Legacy/Free)
        const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY

        if (!apiKey || apiKey === 'sua_chave_openrouter_aqui') {
          throw new Error('Configure sua API key do OpenRouter no arquivo .env')
        }

        // Criar AbortController para timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minutos timeout

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
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ]
          }),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error?.message || `Erro na API: ${response.status}`)
        }

        const data = await response.json()
        generatedSummary = data.choices[0]?.message?.content
      }

      if (generatedSummary) {
        setSummary(generatedSummary)
        setView('summary')
        showToast('Resumo gerado com sucesso!', 'success')
      } else {
        throw new Error('Resumo não gerado')
      }
    } catch (error) {
      console.error('Erro ao gerar resumo:', error)
      if (error.name === 'AbortError') {
        showToast('Timeout: a requisição demorou muito. Tente novamente.', 'error')
      } else {
        showToast(error.message || 'Erro ao gerar resumo', 'error')
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
