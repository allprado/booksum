import { useState, useRef, useEffect } from 'react'
import './AudioPlayer.css'

function AudioPlayer({ audioUrl, audioChapters = [], book, onGenerateChapterAudio, summary, showToast }) {
    const audioRef = useRef(null)
    const progressRef = useRef(null)
    const shouldPlayAfterLoadRef = useRef(false)
    const pendingChapterIndexRef = useRef(null)

    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [playbackRate, setPlaybackRate] = useState(1)
    const [volume, setVolume] = useState(1)
    const [showVolumeSlider, setShowVolumeSlider] = useState(false)
    const [currentChapterIndex, setCurrentChapterIndex] = useState(0)
    const [showChapterIndex, setShowChapterIndex] = useState(false)
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)

    // Se temos audioChapters, usar o primeiro; caso contrário usar audioUrl
    const hasChapters = audioChapters && audioChapters.length > 0
    const currentAudioUrl = hasChapters ? audioChapters[currentChapterIndex]?.audioUrl : audioUrl
    const currentChapter = hasChapters ? audioChapters[currentChapterIndex] : null

    // Observar mudanças nos audioChapters para detectar quando um capítulo pendente fica disponível
    useEffect(() => {
        if (pendingChapterIndexRef.current !== null) {
            const pendingIndex = pendingChapterIndexRef.current
            const chapter = audioChapters[pendingIndex]
            
            if (chapter && chapter.audioUrl) {
                // O capítulo agora tem áudio, podemos tocar
                pendingChapterIndexRef.current = null
                shouldPlayAfterLoadRef.current = true
                setCurrentChapterIndex(pendingIndex)
                setCurrentTime(0)
                
                // Carrega o novo áudio
                if (audioRef.current) {
                    audioRef.current.load()
                }
            }
        }
    }, [audioChapters])

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
        const handleLoadedMetadata = () => {
            setDuration(audio.duration)
            // Se devemos tocar após carregar, inicia a reprodução
            if (shouldPlayAfterLoadRef.current) {
                shouldPlayAfterLoadRef.current = false
                audio.play().then(() => {
                    setIsPlaying(true)
                }).catch(err => {
                    console.error('Erro ao reproduzir áudio:', err)
                    setIsPlaying(false)
                })
            }
        }
        const handleEnded = () => {
            // Quando um capítulo termina, avança automaticamente para o próximo
            if (hasChapters && currentChapterIndex < audioChapters.length - 1) {
                goToChapter(currentChapterIndex + 1)
            } else {
                setIsPlaying(false)
            }
        }

        audio.addEventListener('timeupdate', handleTimeUpdate)
        audio.addEventListener('loadedmetadata', handleLoadedMetadata)
        audio.addEventListener('ended', handleEnded)

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate)
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
            audio.removeEventListener('ended', handleEnded)
        }
    }, [hasChapters, currentChapterIndex, audioChapters.length])

    const goToChapter = async (index, shouldPlay = true) => {
        if (index >= 0 && index < audioChapters.length) {
            const chapter = audioChapters[index]
            
            // Se o capítulo não tem áudio, gera sob demanda
            if (!chapter.audioUrl && onGenerateChapterAudio && summary) {
                setIsGeneratingAudio(true)
                pendingChapterIndexRef.current = index  // Marca qual capítulo estamos esperando
                
                if (showToast) {
                    showToast(`Gerando áudio do capítulo ${chapter.number}...`, 'info', true)
                }
                
                try {
                    await onGenerateChapterAudio({
                        number: chapter.number,
                        title: chapter.title,
                        content: summary.substring(chapter.startPos, chapter.endPos),
                        startPos: chapter.startPos,
                        endPos: chapter.endPos
                    })
                    
                    if (showToast) {
                        showToast(`Áudio do capítulo ${chapter.number} gerado!`, 'success')
                    }
                    // O useEffect vai detectar quando audioChapters for atualizado
                } catch (error) {
                    if (showToast) {
                        showToast(`Erro ao gerar áudio do capítulo ${chapter.number}`, 'error')
                    }
                    pendingChapterIndexRef.current = null
                } finally {
                    setIsGeneratingAudio(false)
                }
                return  // Não muda o capítulo aqui, espera o useEffect
            }
            
            // Capítulo já tem áudio, pode tocar diretamente
            if (shouldPlay) {
                shouldPlayAfterLoadRef.current = true
            }
            
            setCurrentChapterIndex(index)
            setCurrentTime(0)
            
            // Carrega o novo áudio
            if (audioRef.current) {
                audioRef.current.load()
            }
        }
    }

    const goToPreviousChapter = async () => {
        if (currentChapterIndex > 0) {
            await goToChapter(currentChapterIndex - 1)
        }
    }

    const goToNextChapter = async () => {
        if (currentChapterIndex < audioChapters.length - 1) {
            await goToChapter(currentChapterIndex + 1)
        }
    }

    const togglePlay = () => {
        const audio = audioRef.current
        if (!audio) return

        if (isPlaying) {
            audio.pause()
        } else {
            audio.play()
        }
        setIsPlaying(!isPlaying)
    }

    const handleProgressClick = (e) => {
        const audio = audioRef.current
        const progress = progressRef.current
        if (!audio || !progress) return

        const rect = progress.getBoundingClientRect()
        const percent = (e.clientX - rect.left) / rect.width
        audio.currentTime = percent * duration
    }

    const handleSeek = (seconds) => {
        const audio = audioRef.current
        if (!audio) return
        audio.currentTime = Math.max(0, Math.min(duration, currentTime + seconds))
    }

    const handlePlaybackRateChange = () => {
        const rates = [0.75, 1, 1.25, 1.5, 1.75, 2]
        const currentIndex = rates.indexOf(playbackRate)
        const nextIndex = (currentIndex + 1) % rates.length
        const newRate = rates[nextIndex]

        setPlaybackRate(newRate)
        if (audioRef.current) {
            audioRef.current.playbackRate = newRate
        }
    }

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value)
        setVolume(newVolume)
        if (audioRef.current) {
            audioRef.current.volume = newVolume
        }
    }

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0

    return (
        <div className="audio-player">
            <audio ref={audioRef} src={currentAudioUrl} preload="metadata" />

            <div className="player-header">
                {book.thumbnail && (
                    <img
                        src={book.thumbnail}
                        alt={book.title}
                        className="player-cover"
                    />
                )}
                <div className="player-info">
                    <h3 className="player-title">{book.title}</h3>
                    {hasChapters && currentChapter && (
                        <p className="player-chapter">
                            {currentChapter.number} de {audioChapters.length}: {currentChapter.title}
                        </p>
                    )}
                    <p className="player-author">{book.authors?.join(', ')}</p>
                </div>
                {hasChapters && (
                    <button
                        className="chapters-toggle-btn"
                        onClick={() => setShowChapterIndex(!showChapterIndex)}
                        title="Lista de capítulos"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="8" y1="6" x2="21" y2="6" />
                            <line x1="8" y1="12" x2="21" y2="12" />
                            <line x1="8" y1="18" x2="21" y2="18" />
                            <line x1="3" y1="6" x2="3.01" y2="6" />
                            <line x1="3" y1="12" x2="3.01" y2="12" />
                            <line x1="3" y1="18" x2="3.01" y2="18" />
                        </svg>
                    </button>
                )}
            </div>

            {showChapterIndex && hasChapters && (
                <div className="chapters-modal-overlay" onClick={() => setShowChapterIndex(false)}>
                    <div className="chapters-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Capítulos</h3>
                        <div className="chapters-list">
                            {audioChapters.map((chapter, index) => (
                                <button
                                    key={index}
                                    className={`chapter-item ${index === currentChapterIndex ? 'active' : ''}`}
                                    onClick={async () => {
                                        await goToChapter(index)
                                        setShowChapterIndex(false)
                                    }}
                                    disabled={isGeneratingAudio}
                                >
                                    <span className="chapter-num">{chapter.number}</span>
                                    <span className="chapter-name">{chapter.title}</span>
                                    {index === currentChapterIndex && <span className="play-indicator">▶</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="player-visualizer">
                <div className={`visualizer-bars ${isPlaying ? 'playing' : ''}`}>
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="bar"
                            style={{
                                animationDelay: `${i * 0.05}s`,
                                height: isPlaying ? `${20 + Math.random() * 60}%` : '20%'
                            }}
                        />
                    ))}
                </div>
            </div>

            <div
                className="progress-container"
                ref={progressRef}
                onClick={handleProgressClick}
            >
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                    />
                    <div
                        className="progress-thumb"
                        style={{ left: `${progress}%` }}
                    />
                </div>
            </div>

            <div className="time-display">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
            </div>

            <div className="player-controls">
                <button
                    className="control-btn"
                    onClick={handlePlaybackRateChange}
                    title="Velocidade"
                >
                    <span className="speed-label">{playbackRate}x</span>
                </button>

                {hasChapters && (
                    <button
                        className="control-btn chapter-btn"
                        onClick={goToPreviousChapter}
                        disabled={currentChapterIndex === 0 || isGeneratingAudio}
                        title="Capítulo anterior"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                )}

                <button
                    className="control-btn seek-btn"
                    onClick={() => handleSeek(-15)}
                    title="Voltar 15s"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 4v6h6" />
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                    </svg>
                    <span className="seek-label">15</span>
                </button>

                <button
                    className="play-btn"
                    onClick={togglePlay}
                >
                    {isPlaying ? (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="4" width="4" height="16" rx="1" />
                            <rect x="14" y="4" width="4" height="16" rx="1" />
                        </svg>
                    ) : (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                    )}
                </button>

                <button
                    className="control-btn seek-btn"
                    onClick={() => handleSeek(15)}
                    title="Avançar 15s"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 4v6h-6" />
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                    <span className="seek-label">15</span>
                </button>

                {hasChapters && (
                    <button
                        className="control-btn chapter-btn"
                        onClick={goToNextChapter}
                        disabled={isGeneratingAudio}
                        title="Próximo capítulo"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>
                )}

                <div className="volume-container">
                    <button
                        className="control-btn"
                        onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                        title="Volume"
                    >
                        {volume === 0 ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                <line x1="23" y1="9" x2="17" y2="15" />
                                <line x1="17" y1="9" x2="23" y2="15" />
                            </svg>
                        ) : volume < 0.5 ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                            </svg>
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                            </svg>
                        )}
                    </button>

                    {showVolumeSlider && (
                        <div className="volume-slider-container">
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={volume}
                                onChange={handleVolumeChange}
                                className="volume-slider"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AudioPlayer
