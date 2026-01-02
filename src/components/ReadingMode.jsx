import { useState, useEffect, useRef } from 'react'
import './ReadingMode.css'

function ReadingMode({ book, summary, onClose }) {
    const [fontSize, setFontSize] = useState(18)
    const [theme, setTheme] = useState('dark') // dark, light, sepia
    const [progress, setProgress] = useState(0)
    const contentRef = useRef(null)

    useEffect(() => {
        const handleScroll = () => {
            if (!contentRef.current) return

            const { scrollTop, scrollHeight, clientHeight } = contentRef.current
            const scrollProgress = (scrollTop / (scrollHeight - clientHeight)) * 100
            setProgress(Math.min(100, Math.max(0, scrollProgress)))
        }

        const content = contentRef.current
        if (content) {
            content.addEventListener('scroll', handleScroll)
            return () => content.removeEventListener('scroll', handleScroll)
        }
    }, [])

    const increaseFontSize = () => {
        setFontSize(prev => Math.min(28, prev + 2))
    }

    const decreaseFontSize = () => {
        setFontSize(prev => Math.max(14, prev - 2))
    }

    const formatText = (text) => {
        return text
            .replace(/## (.*?)$/gm, '<h2 class="reading-h2">$1</h2>')
            .replace(/### (.*?)$/gm, '<h3 class="reading-h3">$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n\n/g, '</p><p class="reading-p">')
            .replace(/\n/g, '<br/>')
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
            </footer>
        </div>
    )
}

export default ReadingMode
