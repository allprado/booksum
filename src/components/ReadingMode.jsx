import { useState, useEffect, useRef } from 'react'
import './ReadingMode.css'

function ReadingMode({ book, summary, onClose, audioUrl, audioChapters = [], onGenerateChapterAudio }) {
    const [fontSize, setFontSize] = useState(18)
    const [theme, setTheme] = useState('dark') // dark, light, sepia
    const [progress, setProgress] = useState(0)
    const [showIndex, setShowIndex] = useState(false)
    const [chapters, setChapters] = useState([])
    const [currentChapter, setCurrentChapter] = useState(0)
    const [audioPlayer, setAudioPlayer] = useState(null)
    const [miniPlayerOpen, setMiniPlayerOpen] = useState(false)
    const [isAudioPlaying, setIsAudioPlaying] = useState(false)
    const [currentAudioTime, setCurrentAudioTime] = useState(0)
    const [audioDuration, setAudioDuration] = useState(0)
    const audioRef = useRef(null)
    const contentRef = useRef(null)

    // Extrai os capítulos do resumo
    useEffect(() => {
        const extractChapters = () => {
            // Se temos audioChapters, usa eles como base
            if (audioChapters && audioChapters.length > 0) {
                const extractedChapters = audioChapters.map((chapter, index) => ({
                    id: `chapter-${index}`,
                    number: chapter.number,
                    title: chapter.title,
                    position: chapter.startPos,
                    audioUrl: chapter.audioUrl
                }))
                setChapters(extractedChapters)
                return
            }
            
            // Procura por padrões de capítulos: "**Capítulo X de Y**" ou "Capítulo X de Y"
            const chapterRegex = /\*{0,2}Capítulo\s+(\d+)\s+de\s+(\d+)\*{0,2}[:\-\s]*(.*?)(?=\n|$)/gi
            const matches = [...summary.matchAll(chapterRegex)]
            
            if (matches.length > 0) {
                const extractedChapters = matches.map((match, index) => ({
                    id: `chapter-${index}`,
                    number: parseInt(match[1]),
                    total: parseInt(match[2]),
                    title: match[3].trim().replace(/\*+/g, '') || `Capítulo ${match[1]}`,
                    position: match.index,
                    audioUrl: null
                }))
                setChapters(extractedChapters)
            } else {
                // Se não encontrar capítulos no formato esperado, tenta encontrar outros títulos em negrito
                const headingRegex = /\*\*(.*?)\*\*/g
                const headingMatches = [...summary.matchAll(headingRegex)]
                const extractedHeadings = headingMatches
                    .filter(match => match[1].length > 3 && match[1].length < 100)
                    .map((match, index) => ({
                        id: `section-${index}`,
                        number: index + 1,
                        title: match[1].trim(),
                        position: match.index,
                        audioUrl: null
                    }))
                setChapters(extractedHeadings)
            }
        }
        
        extractChapters()
    }, [summary, audioChapters])

    useEffect(() => {
        const handleScroll = () => {
            if (!contentRef.current) return

            const { scrollTop, scrollHeight, clientHeight } = contentRef.current
            const scrollProgress = (scrollTop / (scrollHeight - clientHeight)) * 100
            setProgress(Math.min(100, Math.max(0, scrollProgress)))
            
            // Detecta o capítulo atual baseado na posição de scroll
            if (chapters.length > 0) {
                const elements = chapters.map(ch => document.getElementById(ch.id)).filter(Boolean)
                let currentIdx = 0
                
                for (let i = 0; i < elements.length; i++) {
                    const rect = elements[i].getBoundingClientRect()
                    if (rect.top <= 200) { // 200px de margem do topo
                        currentIdx = i
                    }
                }
                
                setCurrentChapter(currentIdx)
            }
        }

        const content = contentRef.current
        if (content) {
            content.addEventListener('scroll', handleScroll)
            return () => content.removeEventListener('scroll', handleScroll)
        }
    }, [chapters])

    // Gerenciar áudio do miniplayer
    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const handleTimeUpdate = () => setCurrentAudioTime(audio.currentTime)
        const handleLoadedMetadata = () => setAudioDuration(audio.duration)
        const handleEnded = () => setIsAudioPlaying(false)

        audio.addEventListener('timeupdate', handleTimeUpdate)
        audio.addEventListener('loadedmetadata', handleLoadedMetadata)
        audio.addEventListener('ended', handleEnded)

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate)
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
            audio.removeEventListener('ended', handleEnded)
        }
    }, [])

    const toggleAudioPlay = () => {
        if (!audioRef.current) return
        
        if (isAudioPlaying) {
            audioRef.current.pause()
        } else {
            audioRef.current.play()
        }
        setIsAudioPlaying(!isAudioPlaying)
    }

    const goToNextAudioChapter = () => {
        if (currentChapter < audioChapters.length - 1) {
            const nextChapter = audioChapters[currentChapter + 1]
            
            // Se o próximo capítulo não tem áudio, gera sob demanda
            if (!nextChapter.audioUrl && onGenerateChapterAudio) {
                onGenerateChapterAudio({
                    number: nextChapter.number,
                    title: nextChapter.title,
                    content: summary.substring(nextChapter.startPos, nextChapter.endPos),
                    startPos: nextChapter.startPos,
                    endPos: nextChapter.endPos
                }).then(() => {
                    setCurrentChapter(currentChapter + 1)
                    setIsAudioPlaying(true)
                })
            } else {
                setCurrentChapter(currentChapter + 1)
                setIsAudioPlaying(true)
            }
        }
    }

    const goToPreviousAudioChapter = () => {
        if (currentChapter > 0) {
            const prevChapter = audioChapters[currentChapter - 1]
            
            // Se o capítulo anterior não tem áudio, gera sob demanda
            if (!prevChapter.audioUrl && onGenerateChapterAudio) {
                onGenerateChapterAudio({
                    number: prevChapter.number,
                    title: prevChapter.title,
                    content: summary.substring(prevChapter.startPos, prevChapter.endPos),
                    startPos: prevChapter.startPos,
                    endPos: prevChapter.endPos
                }).then(() => {
                    setCurrentChapter(currentChapter - 1)
                    setIsAudioPlaying(true)
                })
            } else {
                setCurrentChapter(currentChapter - 1)
                setIsAudioPlaying(true)
            }
        }
    }

    const currentAudioUrl = audioChapters[currentChapter]?.audioUrl

    const increaseFontSize = () => {
        setFontSize(prev => Math.min(28, prev + 2))
    }

    const decreaseFontSize = () => {
        setFontSize(prev => Math.max(14, prev - 2))
    }

    const scrollToChapter = (chapterIndex) => {
        if (!contentRef.current) return
        
        const chapterId = chapters[chapterIndex]?.id
        if (!chapterId) return
        
        const element = document.getElementById(chapterId)
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
            setShowIndex(false)
        }
    }

    const playChapterAudio = () => {
        const chapter = chapters[currentChapter]
        
        if (!chapter) return
        
        // Se já está tocando, pausa
        if (audioPlayer) {
            audioPlayer.pause()
            setAudioPlayer(null)
            showAudioFeedback('⏸️ Áudio pausado')
            return
        }
        
        // Se o capítulo tem áudio específico, toca ele
        if (chapter.audioUrl) {
            const player = new Audio(chapter.audioUrl)
            player.play()
            setAudioPlayer(player)
            
            // Mostra feedback ao usuário
            showAudioFeedback(`🎧 Reproduzindo: ${chapter.title}`)
            
            // Limpa o player quando terminar
            player.onended = () => {
                setAudioPlayer(null)
            }
        } 
        // Se não tem áudio específico mas tem audioUrl geral, toca ele
        else if (audioUrl) {
            const player = new Audio(audioUrl)
            player.play()
            setAudioPlayer(player)
            
            showAudioFeedback('🎧 Reproduzindo áudio do resumo')
            
            player.onended = () => {
                setAudioPlayer(null)
            }
        }
        else {
            showAudioFeedback('⚠️ Áudio não disponível para este capítulo')
        }
    }
    
    const showAudioFeedback = (message) => {
        const audioElement = document.createElement('div')
        audioElement.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            background: var(--color-primary);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideInRight 0.3s ease;
        `
        audioElement.textContent = message
        document.body.appendChild(audioElement)
        
        // Remove o feedback após 3 segundos
        setTimeout(() => {
            audioElement.style.animation = 'slideOutRight 0.3s ease'
            setTimeout(() => audioElement.remove(), 300)
        }, 3000)
    }
    
    // Limpa o player quando o componente é desmontado
    useEffect(() => {
        return () => {
            if (audioPlayer) {
                audioPlayer.pause()
            }
        }
    }, [audioPlayer])

    const formatText = (text) => {
        // Adiciona IDs aos capítulos para navegação
        let formattedText = text
            .replace(/\*{0,2}Capítulo\s+(\d+)\s+de\s+(\d+)\*{0,2}[:\-\s]*(.*?)(?=\n|$)/gi, (match, num, total, title, offset) => {
                const index = chapters.findIndex(ch => ch.position === offset)
                const id = index >= 0 ? chapters[index].id : `chapter-${num}`
                const cleanTitle = title ? title.replace(/\*+/g, '') : ''
                return `<h2 id="${id}" class="reading-h2">Capítulo ${num} de ${total}${cleanTitle ? ': ' + cleanTitle : ''}</h2>`
            })
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

    const estimatedReadTime = Math.ceil(summary.length / 1250)
    const wordsRead = Math.floor((progress / 100) * (summary.length / 5))

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
                    <span className="reading-time">{Math.ceil(estimatedReadTime * (1 - progress / 100))} min restantes</span>
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
                    {(audioUrl || (chapters[currentChapter]?.audioUrl)) && (
                        <button
                            className={`reading-control-btn ${audioPlayer ? 'playing' : ''}`}
                            onClick={playChapterAudio}
                            aria-label="Reproduzir áudio"
                            title={chapters[currentChapter]?.audioUrl 
                                ? `Reproduzir: ${chapters[currentChapter]?.title}` 
                                : 'Reproduzir áudio do resumo'}
                        >
                            {audioPlayer ? (
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
                                    onClick={() => scrollToChapter(index)}
                                >
                                    <span className="index-number">{chapter.number || index + 1}</span>
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
                        <span>{summary.length.toLocaleString()} caracteres</span>
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
                {audioChapters && audioChapters.length > 0 && (
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
                                        Cap. {audioChapters[currentChapter]?.number}: {audioChapters[currentChapter]?.title}
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
                                        disabled={currentChapter === 0}
                                        title="Capítulo anterior"
                                    >
                                        ⏮
                                    </button>
                                    
                                    <button
                                        className="mini-play-btn"
                                        onClick={toggleAudioPlay}
                                    >
                                        {isAudioPlaying ? '⏸' : '▶'}
                                    </button>

                                    <button
                                        className="mini-ctrl-btn"
                                        onClick={goToNextAudioChapter}
                                        disabled={currentChapter === audioChapters.length - 1}
                                        title="Próximo capítulo"
                                    >
                                        ⏭
                                    </button>
                                </div>

                                <div className="mini-player-time">
                                    {Math.floor(currentAudioTime / 60)}:{String(Math.floor(currentAudioTime % 60)).padStart(2, '0')} / {Math.floor(audioDuration / 60)}:{String(Math.floor(audioDuration % 60)).padStart(2, '0')}
                                </div>

                                <div className="mini-player-chapters">
                                    {audioChapters.map((chapter, idx) => (
                                        <button
                                            key={idx}
                                            className={`mini-chapter-btn ${idx === currentChapter ? 'active' : ''}`}
                                            onClick={() => {
                                                // Se o capítulo não tem áudio, gera sob demanda
                                                if (!chapter.audioUrl && onGenerateChapterAudio) {
                                                    onGenerateChapterAudio({
                                                        number: chapter.number,
                                                        title: chapter.title,
                                                        content: summary.substring(chapter.startPos, chapter.endPos),
                                                        startPos: chapter.startPos,
                                                        endPos: chapter.endPos
                                                    }).then(() => {
                                                        setCurrentChapter(idx)
                                                    })
                                                } else {
                                                    setCurrentChapter(idx)
                                                }
                                            }}
                                        >
                                            {chapter.number}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <button
                                className="mini-player-toggle"
                                onClick={() => setMiniPlayerOpen(true)}
                            >
                                <span className="mini-player-status">
                                    🎧 Cap. {audioChapters[currentChapter]?.number} - {isAudioPlaying ? '▶' : '⏸'}
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
