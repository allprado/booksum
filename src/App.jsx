import { useState, useCallback } from 'react'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import BookList from './components/BookList'
import BookDetail from './components/BookDetail'
import SummaryView from './components/SummaryView'
import RecommendedBooks from './components/RecommendedBooks'
import BottomNav from './components/BottomNav'
import Toast from './components/Toast'
import Modal from './components/Modal'
import './App.css'

function App({ isAdminMode = false }) {
  const [view, setView] = useState('home') // home, detail, summary
  const [books, setBooks] = useState([])
  const [selectedBook, setSelectedBook] = useState(null)
  const [summary, setSummary] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [audioChapters, setAudioChapters] = useState([]) // Array de {title, audioUrl, startPos, endPos}
  const [pendingChapters, setPendingChapters] = useState([]) // Capítulos aguardando geração de áudio
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

  // Modal para aviso de falta de conhecimento
  const [showKnowledgeWarning, setShowKnowledgeWarning] = useState(false)
  const [knowledgeWarningMessage, setKnowledgeWarningMessage] = useState('')

  const availableVoices = [
    { id: 'pt-BR-FranciscaNeural', label: 'Francisca (Feminina)', gender: 'Female' },
    { id: 'pt-BR-AntonioNeural', label: 'Antonio (Masculino)', gender: 'Male' },
    { id: 'pt-BR-DonatoNeural', label: 'Donato (Masculino)', gender: 'Male' },
    { id: 'pt-BR-BrendaNeural', label: 'Brenda (Feminina)', gender: 'Female' },
    { id: 'pt-BR-ThalitaNeural', label: 'Thalita (Jovem)', gender: 'Female' }
  ]

  const showToast = useCallback((message, type = 'info', persistent = false) => {
    setToast({ message, type, persistent })
    
    // Apenas limpa o toast se não for persistente
    if (!persistent) {
      setTimeout(() => setToast(null), 4000)
    }
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
      showToast('Verificando conhecimento sobre o livro...', 'info', true)
      
      const verificationPrompt = `INSTRUÇÃO CRÍTICA: Você DEVE responder com HONESTIDADE ABSOLUTA.

Você tem conhecimento REAL, ESPECÍFICO e DETALHADO sobre o livro EXATO "${selectedBook.title}" do autor ${selectedBook.authors?.join(', ')}?

NÃO confunda com:
- Outros livros do mesmo autor
- Livros com títulos similares
- Livros do mesmo gênero
- Conteúdo que você poderia inventar

Responda APENAS COM "SIM" se você realmente conhece o conteúdo COMPLETO e DETALHADO deste livro específico.
Responda "NÃO" para QUALQUER DÚVIDA.

Se responder "SIM" e for mentira, você estará ajudando a criar informações falsas sobre o livro.

Sua resposta (SIM ou NÃO):`

      const verification = await callAI(verificationPrompt)
      const hasKnowledge = verification.trim().toUpperCase().includes('SIM')
      
      if (!hasKnowledge) {
        setKnowledgeWarningMessage(`Não possuo conhecimento detalhado suficiente sobre o livro "${selectedBook.title}" para criar um resumo confiável. Isso significa que eu poderia inventar ou criar informações incorretas sobre o livro.\n\nPor favor, tente outro livro que esteja em minha base de conhecimento.`)
        setShowKnowledgeWarning(true)
        setLoading(false)
        return
      }
      
      showToast('Gerando resumo estilo Blink...', 'info', true)
      
      // Calcular número de capítulos baseado no número de páginas
      const pageCount = selectedBook.pageCount || 0
      let targetChapters = 7 // Padrão se não houver informação de páginas
      
      if (pageCount > 0) {
        if (pageCount <= 150) {
          targetChapters = 5
        } else if (pageCount <= 250) {
          targetChapters = 6
        } else if (pageCount <= 350) {
          targetChapters = 8
        } else if (pageCount <= 450) {
          targetChapters = 9
        } else {
          targetChapters = 10
        }
      }
      
      // ETAPA 1: Gerar a estrutura dos capítulos
      showToast('Etapa 1/2: Criando estrutura dos capítulos...', 'info', true)
      
      const structurePrompt = `INSTRUÇÃO CRÍTICA - VOCÊ NÃO PODE INVENTAR CONTEÚDO:

Você está criando um resumo para o livro "${selectedBook.title}" de ${selectedBook.authors?.join(', ')}.

⚠️ VOCÊ DEVE CONHECER ESTE LIVRO COMPLETAMENTE!
⚠️ NÃO INVENTE, NÃO ADIVINHE, NÃO CRIE CONTEÚDO FALSO!
⚠️ SE NÃO TIVER CERTEZA SOBRE QUALQUER ASPECTO, NÃO CONTINUE!

Para o livro "${selectedBook.title}" de ${selectedBook.authors?.join(', ')}, crie APENAS a estrutura/índice dos capítulos que serão abordados.

Retorne exatamente neste formato (um por linha, sem numeração adicional):
Por que ler este livro?
Capítulo 1 de ${targetChapters}: [Título/Tema do capítulo em uma frase]
Capítulo 2 de ${targetChapters}: [Título/Tema do capítulo em uma frase]
...
Capítulo ${targetChapters} de ${targetChapters}: [Título/Tema do capítulo em uma frase]
Resumo Final

IMPORTANTE: Crie EXATAMENTE ${targetChapters} capítulos (baseado no tamanho do livro de ${pageCount > 0 ? pageCount + ' páginas' : 'tamanho médio'}). Nem mais, nem menos. Cada capítulo deve cobrir um pilar essencial do livro.

${selectedBook.description ? `\n\nDescrição do livro: ${selectedBook.description}` : ''}

Estrutura:`

      const structure = await callAI(structurePrompt)
      const lines = structure.trim().split('\n').filter(line => line.trim().length > 0)
      
      // Extrair total de capítulos
      const totalChaptersMatch = structure.match(/Capítulo\s+(\d+)\s+de\s+(\d+)/)
      const totalChapters = totalChaptersMatch ? parseInt(totalChaptersMatch[2]) : lines.filter(l => l.includes('Capítulo')).length
      
      // ETAPA 2: Gerar cada capítulo com conhecimento da estrutura
      showToast('Etapa 2/2: Gerando conteúdo dos capítulos...', 'info', true)
      
      const chapterContents = []
      const chapterLines = lines.filter(l => l.includes('Capítulo'))
      
      for (let i = 0; i < chapterLines.length; i++) {
        const chapterLine = chapterLines[i]
        const chapterNum = i + 1
        
        showToast(`Gerando capítulo ${chapterNum}/${chapterLines.length}...`, 'info', true)
        
        const chapterPrompt = `INSTRUÇÃO CRÍTICA - NÃO INVENTE CONTEÚDO:

Você está gerando conteúdo para um resumo do livro "${selectedBook.title}" de ${selectedBook.authors?.join(', ')}.

⚠️ VOCÊ DEVE CONHECER ESTE LIVRO COMPLETAMENTE!
⚠️ CADA PALAVRA DEVE SER FIEL AO LIVRO REAL!
⚠️ NÃO ADIVINHE, NÃO CRIE CONTEÚDO FALSO, NÃO INVENTE CAPÍTULOS!

A estrutura completa do resumo tem ${totalChapters} capítulos:
${chapterLines.map((line, idx) => `${idx + 1}. ${line}`).join('\n')}

Agora você precisa gerar o conteúdo DETALHADO do seguinte capítulo:

${chapterLine}

INSTRUÇÕES PARA ESTE CAPÍTULO:
- Comece com: **${chapterLine}**
- Desenvolvimento: Escreva entre 800 e 1500 palavras que cubram profundamente este aspecto do livro
- Tom: Empático, instrutivo e fluído - nada de listas de tópicos
- Análise: Ofereça análise profunda sobre comportamento humano, motivações, contextos históricos ou aplicações práticas
- Coerência: Este capítulo faz parte da estrutura maior, então conecte com os temas anteriores quando apropriado
- PRECISÃO ABSOLUTA: APENAS informações que estão REALMENTE no livro. Nada inventado.

${selectedBook.description ? `\n\nDescrição do livro: ${selectedBook.description}` : ''}

Gere agora o conteúdo detalhado deste capítulo em português brasileiro:`

        const chapterContent = await callAI(chapterPrompt)
        chapterContents.push(chapterContent.trim())
        
        // Pequeno delay para evitar rate limit
        if (i < chapterLines.length - 1) {
          await new Promise(r => setTimeout(r, 500))
        }
      }
      
      // ETAPA 3: Gerar introdução
      showToast('Gerando introdução e finalizando...', 'info', true)
      
      const introPrompt = `INSTRUÇÃO CRÍTICA - VOCÊ NÃO PODE INVENTAR CONTEÚDO:

Para o livro "${selectedBook.title}" de ${selectedBook.authors?.join(', ')}, crie uma INTRODUÇÃO impactante.

⚠️ BASEADA COMPLETAMENTE NO LIVRO REAL!
⚠️ NÃO INVENTE TEMAS OU CONFLITOS QUE NÃO EXISTEM!
⚠️ FIDELIDADE TOTAL AO CONTEÚDO ORIGINAL!

Esta introdução será a seção inicial do resumo e deve:
- Começar com um título chamativo: **Por que ler este livro?**
- Apresentar a tese central ou conflito principal da obra (REAL, não inventado)
- Motivar o leitor a continuar lendo
- Ter entre 300 e 500 palavras
- Usar tom empático e envolvente
- APENAS informações que estão no livro

${selectedBook.description ? `\n\nDescrição do livro: ${selectedBook.description}` : ''}

Gere a introdução em português brasileiro:`

      const introduction = await callAI(introPrompt)
      
      
      // ETAPA 4: Gerar resumo final
      const finalSummaryPrompt = `INSTRUÇÃO CRÍTICA - NÃO INVENTE CONTEÚDO:

Para o livro "${selectedBook.title}" de ${selectedBook.authors?.join(', ')}, crie uma seção de RESUMO FINAL.

⚠️ BASEADA APENAS NO LIVRO REAL!
⚠️ A MENSAGEM DEVE SER FIEL AO ORIGINAL!
⚠️ NÃO ADICIONE REFLEXÕES INVENTADAS!

Esta seção deve:
- Começar com o título: **Resumo Final**
- Sintetizar em UM PARÁGRAFO a mensagem mais duradoura do livro
- Ser impactante e memorável
- Conectar os temas principais abordados (que realmente existem no livro)
- Deixar o leitor com uma reflexão valiosa (baseada no livro)
- Ter entre 150 e 250 palavras
- APENAS informações que estão no livro

${selectedBook.description ? `\n\nDescrição do livro: ${selectedBook.description}` : ''}

Gere o resumo final em português brasileiro:`

      const finalSummarySection = await callAI(finalSummaryPrompt)
      
      // MONTAGEM FINAL: Combinar todas as partes
      const finalSummary = [
        introduction.trim(),
        '',
        ...chapterContents.map(c => c.trim()),
        '',
        finalSummarySection.trim()
      ].join('\n\n')

      if (finalSummary) {
        // Limpar caracteres de separação markdown que possam ter sido incluídos
        const cleanedSummary = finalSummary
          .replace(/^#+\s*$/gm, '') // Remove linhas que só contêm # (heading vazios)
          .replace(/\n{3,}/g, '\n\n') // Remove excesso de quebras de linha
          .trim()
        
        setSummary(cleanedSummary)
        setView('summary')
        showToast('Conteúdo gerado com sucesso!', 'success')
        
        // Gerar automaticamente áudio do primeiro capítulo
        setLoading(true)
        showToast('Gerando áudio do primeiro capítulo...', 'info', true)
        
        // Usar voz feminina padrão e velocidade 1x
        setSelectedVoice('pt-BR-FranciscaNeural')
        setSpeechRate('1.0')
        
        // Chamar geração de áudio após um pequeno delay para garantir que o summary foi atualizado
        setTimeout(() => {
          handleGenerateAudio(cleanedSummary)
        }, 500)
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

  const handleGenerateChapterAudio = async (chapterData) => {
    // Gera áudio para um capítulo específico sob demanda
    if (!chapterData || !chapterData.content) return

    try {
      // Verificar credenciais da Azure
      const apiKey = import.meta.env.VITE_AZURE_SPEECH_KEY
      const region = import.meta.env.VITE_AZURE_SPEECH_REGION

      if (!apiKey || apiKey === 'sua_chave_azure_aqui' || !region) {
        throw new Error('Configure a Key e Region do Azure Speech no arquivo .env')
      }

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

      // 2. Preparar conteúdo do capítulo
      const cleanText = chapterData.content
        .replace(/#{1,6}\s/g, '')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/`/g, '')
        .replace(/\n\n+/g, '\n')
        .trim()

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

      // 3. Gerar áudio para cada chunk
      const audioBuffers = []
      for (let j = 0; j < chunks.length; j++) {
        const chunkText = chunks[j]
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

      // 4. Concatenar buffers
      const totalLength = audioBuffers.reduce((acc, buf) => acc + buf.length, 0)
      const combinedBuffer = new Uint8Array(totalLength)
      let offset = 0
      for (const buffer of audioBuffers) {
        combinedBuffer.set(buffer, offset)
        offset += buffer.length
      }

      const audioBlob = new Blob([combinedBuffer], { type: 'audio/mpeg' })
      const audioUrl = URL.createObjectURL(audioBlob)

      // 5. Atualizar estado com novo capítulo gerado
      const updatedChapter = {
        number: chapterData.number,
        title: chapterData.title,
        audioUrl: audioUrl,
        startPos: chapterData.startPos,
        endPos: chapterData.endPos
      }

      setAudioChapters(prev => {
        const newChapters = [...prev]
        const index = newChapters.findIndex(ch => ch.number === chapterData.number)
        if (index >= 0) {
          newChapters[index] = updatedChapter
        } else {
          newChapters.push(updatedChapter)
        }
        return newChapters
      })

      // Remove do pendentes
      setPendingChapters(prev => prev.filter(ch => ch.number !== chapterData.number))

      return audioUrl
    } catch (error) {
      console.error('Erro ao gerar áudio do capítulo:', error)
      showToast(`Erro ao gerar áudio do capítulo ${chapterData.number}`, 'error')
      return null
    }
  }

  const handleGenerateAudio = async (summaryText = null) => {
    const textToUse = summaryText || summary
    if (!textToUse) return

    // Se foi chamado automaticamente, não precisamos mostrar "loading" visual
    const wasAutomatic = summaryText !== null
    if (!wasAutomatic) {
      setLoading(true)
    }
    
    try {
      // Verificar credenciais da Azure
      const apiKey = import.meta.env.VITE_AZURE_SPEECH_KEY
      const region = import.meta.env.VITE_AZURE_SPEECH_REGION

      if (!apiKey || apiKey === 'sua_chave_azure_aqui' || !region) {
        throw new Error('Configure a Key e Region do Azure Speech no arquivo .env')
      }

      if (!wasAutomatic) {
        showToast('Autenticando com Azure...', 'info')
      }

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
      const chapterRegex = /\*{0,2}Capítulo\s+(\d+)\s+de\s+(\d+)\*{0,2}[:\-\s]*(.*?)(?=\n|$)/gi
      const matches = [...textToUse.matchAll(chapterRegex)]
      
      let chaptersToGenerate = []
      
      if (matches.length > 0) {
        // Tem capítulos definidos - gera áudio APENAS para o PRIMEIRO capítulo
        if (!wasAutomatic) {
          showToast(`${matches.length} capítulos detectados. Gerando áudio do primeiro capítulo...`, 'info')
        }
        
        // Pega apenas o primeiro capítulo
        const match = matches[0]
        const chapterNum = parseInt(match[1])
        const chapterTitle = match[3]?.trim().replace(/\*+/g, '') || `Capítulo ${chapterNum}`
        const startPos = match.index
        const endPos = matches.length > 1 ? matches[1].index : textToUse.length
        
        const chapterContent = textToUse.substring(startPos, endPos)
        
        chaptersToGenerate.push({
          number: chapterNum,
          title: chapterTitle,
          content: chapterContent,
          startPos,
          endPos
        })
      } else {
        // Não tem capítulos - gera um único áudio completo
        if (!wasAutomatic) {
          showToast('Nenhum capítulo detectado. Gerando áudio completo...', 'info')
        }
        chaptersToGenerate.push({
          number: 1,
          title: 'Resumo Completo',
          content: textToUse,
          startPos: 0,
          endPos: textToUse.length
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
      
      // Se temos mais capítulos que não foram gerados, guardar como pendentes
      if (matches.length > 1) {
        const pendingChaptersData = matches.slice(1).map((match, idx) => {
          const chapterNum = parseInt(match[1])
          const chapterTitle = match[3]?.trim().replace(/\*+/g, '') || `Capítulo ${chapterNum}`
          const startPos = match.index
          const endPos = idx < matches.length - 2 ? matches[idx + 2].index : textToUse.length
          const chapterContent = textToUse.substring(startPos, endPos)
          
          return {
            number: chapterNum,
            title: chapterTitle,
            content: chapterContent,
            startPos,
            endPos,
            generated: false
          }
        })
        setPendingChapters(pendingChaptersData)
      } else {
        setPendingChapters([])
      }
      
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

  const handleNavigate = (newView) => {
    if (newView === 'home') {
      handleHome()
    } else if (newView === 'recommended') {
      setView('recommended')
      setSelectedBook(null)
      setSummary(null)
      setAudioUrl(null)
      setAudioChapters([])
    } else {
      setView(newView)
    }
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

        {view === 'recommended' && (
          <RecommendedBooks
            onSelectBook={handleSelectBook}
          />
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
            onGenerateChapterAudio={handleGenerateChapterAudio}
            showToast={showToast}
          />
        )}
      </main>

      <BottomNav currentView={view} onNavigate={handleNavigate} />

      {toast && <Toast message={toast.message} type={toast.type} />}

      <Modal
        isOpen={showKnowledgeWarning}
        title="Livro não disponível"
        message={knowledgeWarningMessage}
        type="warning"
        onClose={() => setShowKnowledgeWarning(false)}
        onRetry={() => handleGenerateSummary()}
        retryButtonText="Tentar Novamente"
        showCloseButton={true}
      />

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
