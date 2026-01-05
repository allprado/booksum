import { useMemo, useState, useEffect, useRef } from 'react'
import './ReadingMode.css'

function ReadingMode({ book, summary, onClose, audioUrl, audioChapters = [], onGenerateChapterAudio, showToast }) {
    const [fontSize, setFontSize] = useState(18)
    const [theme, setTheme] = useState('dark') // dark, light, sepia
    const [progress, setProgress] = useState(0)
    const [showIndex, setShowIndex] = useState(false)
    const [chapters, setChapters] = useState([])
    const [currentChapter, setCurrentChapter] = useState(0)
    const [miniPlayerOpen, setMiniPlayerOpen] = useState(false)
    const [isAudioPlaying, setIsAudioPlaying] = useState(false)
    const [currentAudioTime, setCurrentAudioTime] = useState(0)
    const [audioDuration, setAudioDuration] = useState(0)
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
    const audioRef = useRef(null)
    const contentRef = useRef(null)
    const shouldPlayAfterLoadRef = useRef(false)
    const pendingChapterIndexRef = useRef(null)
    const isManualSelectionRef = useRef(false)
    const manualSelectionTimeoutRef = useRef(null)

    // Verificação de segurança para o summary
    const safeSummary = summary || ''
    const safeAudioChapters = audioChapters || []

    const playerChapters = useMemo(() => {
        if (!chapters || chapters.length === 0) return []

        return chapters.map((chapter, idx) => {
            const audioChapter = safeAudioChapters.find(ac => ac.number === chapter.number) || safeAudioChapters[idx]
            const startPos = chapter.startPos ?? 0
            const endPos = chapter.endPos ?? chapters[idx + 1]?.startPos ?? safeSummary.length

            return {
                ...chapter,
                number: chapter.number || audioChapter?.number || idx + 1,
                title: chapter.title || audioChapter?.title || `Capítulo ${chapter.number || idx + 1}`,
                startPos,
                endPos,
                audioUrl: audioChapter?.audioUrl || chapter.audioUrl || null
            }
        })
    }, [chapters, safeAudioChapters, safeSummary.length])

    // Observar mudanças nos capítulos para detectar quando um capítulo pendente fica disponível
    useEffect(() => {
        if (pendingChapterIndexRef.current !== null) {
            const pendingIndex = pendingChapterIndexRef.current
            const chapter = playerChapters[pendingIndex]
            
            if (chapter && chapter.audioUrl) {
                pendingChapterIndexRef.current = null
                shouldPlayAfterLoadRef.current = true
                setCurrentChapter(pendingIndex)
                setMiniPlayerOpen(true) // Abrir o mini-player automaticamente
                
                if (audioRef.current) {
                    audioRef.current.load()
                }
            }
        }
    }, [playerChapters])

    // Evita índice inválido caso a lista de capítulos mude
    useEffect(() => {
        if (playerChapters.length === 0) return
        if (currentChapter >= playerChapters.length) {
            setCurrentChapter(playerChapters.length - 1)
        }
    }, [playerChapters.length, currentChapter])

    // Extrai os capítulos do resumo
    useEffect(() => {
        if (!safeSummary) return
        
        const extractChapters = () => {
            const allChapters = []
            
            // Procura pela introdução "Por que ler este livro?"
            const introRegex = /\*{0,2}Por que ler este livro\??\*{0,2}/i
            const introMatch = safeSummary.match(introRegex)
            
            // Procura por padrões de capítulos: "**Capítulo X de Y**" ou "Capítulo X de Y"
            const chapterRegex = /\*{0,2}Capítulo\s+(\d+)\s+de\s+(\d+)\*{0,2}[:\-\s]*(.*?)(?=\n|$)/gi
            const matches = [...safeSummary.matchAll(chapterRegex)]
            
            // Procura pela conclusão "Resumo Final"
            const conclusionRegex = /\*{0,2}Resumo Final\*{0,2}/i
            const conclusionMatch = safeSummary.match(conclusionRegex)
            
            if (matches.length > 0) {
                // Adicionar introdução se existir
                if (introMatch) {
                    const audioChapter = safeAudioChapters.find(ac => ac.number === 0)
                    allChapters.push({
                        id: 'intro',
                        number: 0,
                        title: 'Por que ler este livro?',
                        position: introMatch.index,
                        audioUrl: audioChapter?.audioUrl || null,
                        startPos: audioChapter?.startPos || introMatch.index,
                        endPos: audioChapter?.endPos || matches[0]?.index || null,
                        isIntro: true
                    })
                }
                
                // Adicionar capítulos numerados
                matches.forEach((match, index) => {
                    const chapterNum = parseInt(match[1])
                    const audioChapter = safeAudioChapters.find(ac => ac.number === chapterNum)
                    
                    allChapters.push({
                        id: `chapter-${index}`,
                        number: chapterNum,
                        total: parseInt(match[2]),
                        title: match[3].trim().replace(/\*+/g, '') || `Capítulo ${match[1]}`,
                        position: match.index,
                        audioUrl: audioChapter?.audioUrl || null,
                        startPos: audioChapter?.startPos || match.index,
                        endPos: audioChapter?.endPos || (matches[index + 1]?.index || null)
                    })
                })
                
                // Adicionar conclusão se existir
                if (conclusionMatch) {
                    const totalChapters = matches.length
                    const audioChapter = safeAudioChapters.find(ac => ac.number === totalChapters + 1)
                    allChapters.push({
                        id: 'conclusion',
                        number: totalChapters + 1,
                        title: 'Resumo Final',
                        position: conclusionMatch.index,
                        audioUrl: audioChapter?.audioUrl || null,
                        startPos: audioChapter?.startPos || conclusionMatch.index,
                        endPos: audioChapter?.endPos || safeSummary.length,
                        isConclusion: true
                    })
                }
                
                setChapters(allChapters)
            } else {
                // Se não encontrar capítulos no formato esperado, tenta encontrar outros títulos em negrito
                const headingRegex = /\*\*(.*?)\*\*/g
                const headingMatches = [...safeSummary.matchAll(headingRegex)]
                const extractedHeadings = headingMatches
                    .filter(match => match[1].length > 3 && match[1].length < 100)
                    .map((match, index) => {
                        const audioChapter = safeAudioChapters[index]
                        
                        return {
                            id: `section-${index}`,
                            number: index + 1,
                            title: match[1].trim(),
                            position: match.index,
                            audioUrl: audioChapter?.audioUrl || null,
                            startPos: audioChapter?.startPos || match.index,
                            endPos: audioChapter?.endPos || null
                        }
                    })
                setChapters(extractedHeadings)
            }
        }
        
        extractChapters()
    }, [safeSummary, safeAudioChapters])

    useEffect(() => {
        const handleScroll = () => {
            // Ignora atualizações se foi uma seleção manual recente
            if (isManualSelectionRef.current) {
                return
            }

            const container = contentRef.current
            if (!container) return

            const { scrollTop, scrollHeight, clientHeight } = container
            const scrollProgress = (scrollTop / (scrollHeight - clientHeight)) * 100
            setProgress(Math.min(100, Math.max(0, scrollProgress)))
            
            // Detecta o capítulo atual baseado na posição relativa dentro do container
            if (playerChapters.length > 0) {
                const elements = playerChapters.map(ch => document.getElementById(ch.id)).filter(Boolean)
                let closestIdx = 0
                let closestDistance = Infinity
                const offsetCompensation = 80 // compensar header fixo
                
                for (let i = 0; i < elements.length; i++) {
                    const elementTop = elements[i].offsetTop
                    const distance = Math.abs((elementTop - scrollTop) - offsetCompensation)
                    if (distance < closestDistance) {
                        closestDistance = distance
                        closestIdx = i
                    }
                }
                console.log(`[scroll] scrollTop: ${scrollTop}, detected index: ${closestIdx}, chapter:`, playerChapters[closestIdx]?.title)
                setCurrentChapter(closestIdx)
            }
        }

        const content = contentRef.current
        if (content) {
            content.addEventListener('scroll', handleScroll)
            return () => content.removeEventListener('scroll', handleScroll)
        }
    }, [playerChapters])

    // Gerenciar áudio do miniplayer
    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const handleTimeUpdate = () => setCurrentAudioTime(audio.currentTime)
        const handleLoadedMetadata = () => {
            setAudioDuration(audio.duration)
            // Se devemos tocar após carregar, inicia a reprodução
            if (shouldPlayAfterLoadRef.current) {
                shouldPlayAfterLoadRef.current = false
                audio.play().then(() => {
                    setIsAudioPlaying(true)
                }).catch(err => {
                    console.error('Erro ao reproduzir áudio:', err)
                    setIsAudioPlaying(false)
                })
            }
        }
        const handleCanPlay = () => {
            // Se devemos tocar e ainda não tocou, toca agora
            if (shouldPlayAfterLoadRef.current) {
                shouldPlayAfterLoadRef.current = false
                audio.play().then(() => {
                    setIsAudioPlaying(true)
                }).catch(err => {
                    console.error('Erro ao reproduzir áudio:', err)
                    setIsAudioPlaying(false)
                })
            }
        }
        const handleEnded = () => setIsAudioPlaying(false)

        audio.addEventListener('timeupdate', handleTimeUpdate)
        audio.addEventListener('loadedmetadata', handleLoadedMetadata)
        audio.addEventListener('canplay', handleCanPlay)
        audio.addEventListener('ended', handleEnded)

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate)
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
            audio.removeEventListener('canplay', handleCanPlay)
            audio.removeEventListener('ended', handleEnded)
        }
    }, [])

    const toggleAudioPlay = () => {
        const audio = audioRef.current
        if (!audio) return
        
        if (isAudioPlaying) {
            audio.pause()
            setIsAudioPlaying(false)
            return
        }

        audio.play()
            .then(() => setIsAudioPlaying(true))
            .catch(err => {
                console.error('Erro ao reproduzir áudio:', err)
                setIsAudioPlaying(false)
            })
    }

    const pauseAndResetAudio = () => {
        if (!audioRef.current) return
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        setIsAudioPlaying(false)
    }

    const handleChapterChange = async (targetIndex) => {
        if (!playerChapters.length) return
        if (targetIndex < 0 || targetIndex >= playerChapters.length) return

        const targetChapter = playerChapters[targetIndex]
        pauseAndResetAudio()
        
        // Scroll automático para o capítulo correspondente
        scrollToChapter(targetIndex)

        if (targetChapter.audioUrl) {
            shouldPlayAfterLoadRef.current = true
            // Já foi setado em scrollToChapter, então não precisa aqui
            if (audioRef.current) {
                audioRef.current.load()
            }
            return
        }

        if (!onGenerateChapterAudio) return

        setIsGeneratingAudio(true)
        pendingChapterIndexRef.current = targetIndex

        if (showToast) {
            showToast(`Gerando áudio do capítulo ${targetChapter.number}...`, 'info', true)
        }

        const startPos = targetChapter.startPos ?? 0
        const endPos = targetChapter.endPos ?? safeSummary.length

        try {
            await onGenerateChapterAudio({
                number: targetChapter.number,
                title: targetChapter.title,
                content: safeSummary.substring(startPos, endPos),
                startPos,
                endPos
            })

            if (showToast) {
                showToast(`Áudio do capítulo ${targetChapter.number} gerado!`, 'success')
            }
            // O useEffect vai detectar quando o áudio estiver pronto e iniciar automaticamente
        } catch (error) {
            if (showToast) {
                showToast(`Erro ao gerar áudio do capítulo ${targetChapter.number}`, 'error')
            }
            pendingChapterIndexRef.current = null
        } finally {
            setIsGeneratingAudio(false)
        }
    }

    const goToNextAudioChapter = () => handleChapterChange(currentChapter + 1)
    const goToPreviousAudioChapter = () => handleChapterChange(currentChapter - 1)

    const currentAudioUrl = playerChapters[currentChapter]?.audioUrl || ''

    const increaseFontSize = () => {
        setFontSize(prev => Math.min(28, prev + 2))
    }

    const decreaseFontSize = () => {
        setFontSize(prev => Math.max(14, prev - 2))
    }

    const scrollToChapter = (chapterIndex) => {
        if (!playerChapters.length) return
        if (chapterIndex < 0 || chapterIndex >= playerChapters.length) return
        
        const chapter = playerChapters[chapterIndex]
        const chapterId = chapter?.id
        if (!chapterId) return
        
        console.log(`[scrollToChapter] Index: ${chapterIndex}, Chapter:`, chapter)
        
        // Ativa flag para impedir que o scroll listener interfira
        isManualSelectionRef.current = true
        
        // Limpa o timeout anterior se existir
        if (manualSelectionTimeoutRef.current) {
            clearTimeout(manualSelectionTimeoutRef.current)
        }
        
        // Define o capítulo selecionado imediatamente
        setCurrentChapter(chapterIndex)
        
        const element = document.getElementById(chapterId)
        console.log(`[scrollToChapter] Looking for element with id: ${chapterId}, found:`, element ? 'YES' : 'NO')
        
        if (element) {
            const container = contentRef.current
            const offsetCompensation = 80
            const targetTop = element.offsetTop - offsetCompensation
            console.log(`[scrollToChapter] Element offsetTop: ${element.offsetTop}, targetTop: ${targetTop}`)
            container.scrollTo({ top: targetTop, behavior: 'smooth' })
            setShowIndex(false)
            
            // Desativa a flag após a animação de scroll terminar (1.5s para cobrir animação e inércia)
            manualSelectionTimeoutRef.current = setTimeout(() => {
                isManualSelectionRef.current = false
            }, 1500)
        } else {
            console.warn(`Elemento com ID ${chapterId} não encontrado`)
            isManualSelectionRef.current = false
        }
    }

    const startCurrentChapterPlayback = () => {
        if (!playerChapters.length) return
        setMiniPlayerOpen(true)
        handleChapterChange(currentChapter)
    }

    // Pausa o áudio embutido se o componente for desmontado
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause()
            }
            if (manualSelectionTimeoutRef.current) {
                clearTimeout(manualSelectionTimeoutRef.current)
            }
        }
    }, [])

    const formatText = (text) => {
        // Adiciona IDs aos capítulos para navegação
        let formattedText = text
            // Adiciona ID para introdução
            .replace(/\*{0,2}Por que ler este livro\??\*{0,2}/i, '<h2 id="intro" class="reading-h2">Por que ler este livro?</h2>')
            // Adiciona ID para capítulos numerados
            .replace(/\*{0,2}Capítulo\s+(\d+)\s+de\s+(\d+)\*{0,2}[:\-\s]*(.*?)(?=\n|$)/gi, (match, num, total, title, offset) => {
                const index = chapters.findIndex(ch => ch.position === offset)
                const id = index >= 0 ? chapters[index].id : `chapter-${num}`
                const cleanTitle = title ? title.replace(/\*+/g, '') : ''
                return `<h2 id="${id}" class="reading-h2">Capítulo ${num} de ${total}${cleanTitle ? ': ' + cleanTitle : ''}</h2>`
            })
            // Adiciona ID para conclusão
            .replace(/\*{0,2}Resumo Final\*{0,2}/i, '<h2 id="conclusion" class="reading-h2">Resumo Final</h2>')
            .replace(/\*\*([^*]+)\*\*/g, (match, content, offset) => {
                // Para outros títulos em negrito que não sejam capítulos
                const chapter = chapters.find(ch => ch.position === offset && ch.id.startsWith('section-'))
                if (chapter) {
                    return `<h3 id="${chapter.id}" class="reading-h3">${content}</h3>`
                }
                return `<strong>${content}</strong>`
            })
            .replace(/## (.*?)$/gm, '<h2 class="reading-h2">$1</h2>')
            .replace(/### (.*?)$/gm, '<h3 class="reading-h3">$1</h3>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n\n/g, '</p><p class="reading-p">')
            .replace(/\n/g, '<br/>')
        
        return formattedText
    }

    const estimatedReadTime = Math.ceil(safeSummary.length / 1250)
    const wordsRead = Math.floor((progress / 100) * (safeSummary.length / 5))

    return (
        <div className={`reading-mode theme-${theme}`}>
            <div className="reading-progress-bar">
                <div
                    className="reading-progress-fill"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <header className="reading-header">
                <button
                    className="reading-close-btn"
                    onClick={onClose}
                    aria-label="Fechar"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>

                <div className="reading-meta">
                    <span className="reading-time">
                        {isGeneratingAudio ? (
                            <>
                                <svg className="generating-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                                {' '}Gerando áudio...
                            </>
                        ) : (
                            `${Math.ceil(estimatedReadTime * (1 - progress / 100))} min restantes`
                        )}
                    </span>
                </div>

                <div className="reading-controls">
                    {chapters.length > 0 && (
                        <button
                            className="reading-control-btn"
                            onClick={() => setShowIndex(!showIndex)}
                            aria-label="Índice"
                            title="Índice de capítulos"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="8" y1="6" x2="21" y2="6" />
                                <line x1="8" y1="12" x2="21" y2="12" />
                                <line x1="8" y1="18" x2="21" y2="18" />
                                <line x1="3" y1="6" x2="3.01" y2="6" />
                                <line x1="3" y1="12" x2="3.01" y2="12" />
                                <line x1="3" y1="18" x2="3.01" y2="18" />
                            </svg>
                        </button>
                    )}
                    {playerChapters.length > 0 && (
                        <button
                            className={`reading-control-btn ${isAudioPlaying ? 'playing' : ''}`}
                            onClick={startCurrentChapterPlayback}
                            aria-label="Reproduzir áudio"
                            title={playerChapters[currentChapter]?.audioUrl 
                                ? `Reproduzir: ${playerChapters[currentChapter]?.title}` 
                                : 'Gerar e reproduzir áudio do capítulo'}
                        >
                            {isAudioPlaying ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="6" y="4" width="4" height="16" />
                                    <rect x="14" y="4" width="4" height="16" />
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                            )}
                        </button>
                    )}
                    <button
                        className="reading-control-btn"
                        onClick={decreaseFontSize}
                        disabled={fontSize <= 14}
                        aria-label="Diminuir fonte"
                    >
                        <span style={{ fontSize: '14px' }}>A</span>
                    </button>
                    <button
                        className="reading-control-btn"
                        onClick={increaseFontSize}
                        disabled={fontSize >= 28}
                        aria-label="Aumentar fonte"
                    >
                        <span style={{ fontSize: '20px' }}>A</span>
                    </button>
                </div>
            </header>

            {showIndex && chapters.length > 0 && (
                <div className="reading-index-overlay" onClick={() => setShowIndex(false)}>
                    <div className="reading-index" onClick={(e) => e.stopPropagation()}>
                        <div className="reading-index-header">
                            <h3>Índice de Capítulos</h3>
                            <button
                                className="reading-index-close"
                                onClick={() => setShowIndex(false)}
                                aria-label="Fechar índice"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="reading-index-list">
                            {chapters.map((chapter, index) => (
                                <button
                                    key={chapter.id}
                                    className={`reading-index-item ${index === currentChapter ? 'current' : ''}`}
                                    onClick={async () => {
                                        scrollToChapter(index)
                                        
                                        // Se o capítulo não tem áudio e podemos gerar, gera sob demanda
                                        if (!chapter.audioUrl && onGenerateChapterAudio && chapter.startPos !== undefined) {
                                            setIsGeneratingAudio(true)
                                            pendingChapterIndexRef.current = index
                                            
                                            if (showToast) {
                                                showToast(`Gerando áudio do ${chapter.isIntro ? 'introdução' : chapter.isConclusion ? 'resumo final' : `capítulo ${chapter.number}`}...`, 'info', true)
                                            }
                                            
                                            try {
                                                const endPos = chapter.endPos || (chapters[index + 1]?.startPos || safeSummary.length)
                                                
                                                await onGenerateChapterAudio({
                                                    number: chapter.number,
                                                    title: chapter.title,
                                                    content: safeSummary.substring(chapter.startPos, endPos),
                                                    startPos: chapter.startPos,
                                                    endPos: endPos
                                                })
                                                
                                                if (showToast) {
                                                    showToast(`Áudio do ${chapter.isIntro ? 'introdução' : chapter.isConclusion ? 'resumo final' : `capítulo ${chapter.number}`} gerado!`, 'success')
                                                }
                                                // O useEffect vai detectar quando audioChapters for atualizado e iniciar automaticamente
                                            } catch (error) {
                                                if (showToast) {
                                                    showToast(`Erro ao gerar áudio`, 'error')
                                                }
                                                pendingChapterIndexRef.current = null
                                            } finally {
                                                setIsGeneratingAudio(false)
                                            }
                                        }
                                    }}
                                >
                                    <span className="index-number">{chapter.isIntro ? '📖' : chapter.isConclusion ? '✨' : (chapter.number || index + 1)}</span>
                                    <span className="index-title">
                                        {chapter.title}
                                        {chapter.audioUrl && (
                                            <span className="audio-badge" title="Áudio disponível">🎧</span>
                                        )}
                                    </span>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div
                className="reading-content"
                ref={contentRef}
                style={{ fontSize: `${fontSize}px` }}
            >
                <div className="reading-book-header">
                    <h1 className="reading-title">{book.title}</h1>
                    <p className="reading-author">por {book.authors?.join(', ')}</p>
                    <div className="reading-stats">
                        <span>{estimatedReadTime} min de leitura</span>
                        <span>•</span>
                        <span>{safeSummary.length.toLocaleString()} caracteres</span>
                    </div>
                </div>

                <div
                    className="reading-text"
                    dangerouslySetInnerHTML={{ __html: `<p class="reading-p">${formatText(summary)}</p>` }}
                />

                <div className="reading-end">
                    <div className="reading-end-icon">✨</div>
                    <h3>Fim do Resumo</h3>
                    <p>Você concluiu a leitura de "{book.title}"</p>
                    <button
                        className="btn btn-primary"
                        onClick={onClose}
                    >
                        Voltar
                    </button>
                </div>
            </div>

            <footer className="reading-footer">
                {playerChapters.length > 0 && (
                    <div className={`mini-player ${miniPlayerOpen ? 'open' : ''}`}>
                        <audio
                            ref={audioRef}
                            src={currentAudioUrl}
                            preload="metadata"
                            onPlay={() => setIsAudioPlaying(true)}
                            onPause={() => setIsAudioPlaying(false)}
                        />
                        
                        {miniPlayerOpen ? (
                            <div className="mini-player-expanded">
                                <div className="mini-player-header">
                                    <span className="mini-player-title">
                                        Cap. {playerChapters[currentChapter]?.number}: {playerChapters[currentChapter]?.title}
                                    </span>
                                    <button
                                        className="mini-player-close"
                                        onClick={() => setMiniPlayerOpen(false)}
                                        aria-label="Fechar player"
                                    >
                                        ×
                                    </button>
                                </div>

                                <div className="mini-player-controls">
                                    <button
                                        className="mini-ctrl-btn"
                                        onClick={goToPreviousAudioChapter}
                                        disabled={currentChapter === 0 || isGeneratingAudio}
                                        title="Capítulo anterior"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                                        </svg>
                                    </button>
                                    
                                    <button
                                        className="mini-play-btn"
                                        onClick={toggleAudioPlay}
                                        disabled={isGeneratingAudio}
                                    >
                                        {isGeneratingAudio ? (
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
                                            </svg>
                                        ) : isAudioPlaying ? (
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                <rect x="6" y="4" width="4" height="16" rx="1" />
                                                <rect x="14" y="4" width="4" height="16" rx="1" />
                                            </svg>
                                        ) : (
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                <polygon points="5 3 19 12 5 21 5 3" />
                                            </svg>
                                        )}
                                    </button>

                                    <button
                                        className="mini-ctrl-btn"
                                        onClick={goToNextAudioChapter}
                                        disabled={isGeneratingAudio || currentChapter >= playerChapters.length - 1}
                                        title="Próximo capítulo"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                                        </svg>
                                    </button>
                                </div>

                                <div className="mini-player-time">
                                    {Math.floor(currentAudioTime / 60)}:{String(Math.floor(currentAudioTime % 60)).padStart(2, '0')} / {Math.floor(audioDuration / 60)}:{String(Math.floor(audioDuration % 60)).padStart(2, '0')}
                                </div>

                                <div className="mini-player-chapters">
                                    {playerChapters.map((chapter, idx) => (
                                        <button
                                            key={idx}
                                            className={`mini-chapter-btn ${idx === currentChapter ? 'active' : ''}`}
                                            onClick={() => handleChapterChange(idx)}
                                            disabled={isGeneratingAudio}
                                        >
                                            {chapter.isIntro ? 'I' : chapter.isConclusion ? 'C' : chapter.number}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <button
                                className="mini-player-toggle"
                                onClick={() => {
                                    setMiniPlayerOpen(true)
                                    handleChapterChange(currentChapter)
                                }}
                            >
                                <span className="mini-player-status">
                                    🎧 Cap. {playerChapters[currentChapter]?.number} - {isAudioPlaying ? '▶' : '⏸'}
                                </span>
                            </button>
                        )}
                    </div>
                )}

                <div className="footer-content">
                    <div className="theme-switcher">
                        <button
                            className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                            onClick={() => setTheme('dark')}
                            aria-label="Tema escuro"
                        >
                            <div className="theme-preview theme-preview-dark"></div>
                        </button>
                        <button
                            className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                            onClick={() => setTheme('light')}
                            aria-label="Tema claro"
                        >
                            <div className="theme-preview theme-preview-light"></div>
                        </button>
                        <button
                            className={`theme-btn ${theme === 'sepia' ? 'active' : ''}`}
                            onClick={() => setTheme('sepia')}
                            aria-label="Tema sépia"
                        >
                            <div className="theme-preview theme-preview-sepia"></div>
                        </button>
                    </div>

                    <div className="reading-progress-text">
                        {Math.round(progress)}% lido
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default ReadingMode
