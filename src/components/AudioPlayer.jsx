import { useState, useRef, useEffect } from 'react'
import './AudioPlayer.css'

function AudioPlayer({ audioUrl, book }) {
    const audioRef = useRef(null)
    const progressRef = useRef(null)

    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [playbackRate, setPlaybackRate] = useState(1)
    const [volume, setVolume] = useState(1)
    const [showVolumeSlider, setShowVolumeSlider] = useState(false)

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
        const handleLoadedMetadata = () => setDuration(audio.duration)
        const handleEnded = () => setIsPlaying(false)

        audio.addEventListener('timeupdate', handleTimeUpdate)
        audio.addEventListener('loadedmetadata', handleLoadedMetadata)
        audio.addEventListener('ended', handleEnded)

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate)
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
            audio.removeEventListener('ended', handleEnded)
        }
    }, [])

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
            <audio ref={audioRef} src={audioUrl} preload="metadata" />

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
                    <p className="player-author">{book.authors?.join(', ')}</p>
                </div>
            </div>

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
