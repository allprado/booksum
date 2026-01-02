import { useState } from 'react'
import AudioPlayer from './AudioPlayer'
import ReadingMode from './ReadingMode'
import './SummaryView.css'

function SummaryView({
    book,
    summary,
    audioUrl,
    onGenerateAudio,
    loading,
    selectedVoice,
    onVoiceChange,
    speechRate,
    onRateChange,
    availableVoices
}) {
    const [activeTab, setActiveTab] = useState('text') // text, audio
    const [showReadingMode, setShowReadingMode] = useState(false)

    const estimatedReadTime = Math.ceil(summary.length / 1250) // ~200 words per minute
    const characterCount = summary.length

    if (showReadingMode) {
        return (
            <ReadingMode
                book={book}
                summary={summary}
                onClose={() => setShowReadingMode(false)}
            />
        )
    }

    return (
        <div className="summary-view animate-fadeIn">
            <div className="summary-header">
                <div className="summary-book-info">
                    {book.thumbnail && (
                        <img
                            src={book.thumbnail}
                            alt={book.title}
                            className="summary-book-cover"
                        />
                    )}
                    <div className="summary-book-meta">
                        <h2 className="summary-book-title">{book.title}</h2>
                        <p className="summary-book-author">{book.authors?.join(', ')}</p>
                    </div>
                </div>

                <div className="summary-stats">
                    <div className="stat">
                        <span className="stat-value">{estimatedReadTime}</span>
                        <span className="stat-label">min leitura</span>
                    </div>
                    <div className="stat">
                        <span className="stat-value">{Math.round(characterCount / 1000)}k</span>
                        <span className="stat-label">caracteres</span>
                    </div>
                </div>
            </div>

            <div className="tab-container">
                <button
                    className={`tab ${activeTab === 'text' ? 'active' : ''}`}
                    onClick={() => setActiveTab('text')}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                    </svg>
                    Texto
                </button>
                <button
                    className={`tab ${activeTab === 'audio' ? 'active' : ''}`}
                    onClick={() => setActiveTab('audio')}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18V5l12-2v13" />
                        <circle cx="6" cy="18" r="3" />
                        <circle cx="18" cy="16" r="3" />
                    </svg>
                    Áudio
                </button>
            </div>

            {activeTab === 'text' && (
                <div className="text-content">
                    <div className="summary-preview">
                        <div
                            className="summary-text"
                            dangerouslySetInnerHTML={{
                                __html: formatSummary(summary.slice(0, 1500)) + '...'
                            }}
                        />
                        <div className="summary-fade"></div>
                    </div>

                    <button
                        className="btn btn-primary btn-lg w-full"
                        onClick={() => setShowReadingMode(true)}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                        </svg>
                        Ler Resumo Completo
                    </button>
                </div>
            )}

            {activeTab === 'audio' && (
                <div className="audio-content">
                    {audioUrl ? (
                        <AudioPlayer audioUrl={audioUrl} book={book} />
                    ) : (
                        <div className="audio-generate">
                            <div className="audio-icon">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                    <line x1="12" y1="19" x2="12" y2="23" />
                                    <line x1="8" y1="23" x2="16" y2="23" />
                                </svg>
                            </div>

                            <h3>Converter para Áudio</h3>
                            <p>Ouça o resumo com voz natural gerada por IA</p>

                            <div className="audio-features">
                                <div className="feature">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                    </svg>
                                    <span>Voz natural e fluente</span>
                                </div>
                                <div className="feature">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                    </svg>
                                    <span>~20 minutos de áudio</span>
                                </div>
                                <div className="feature">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                    </svg>
                                    <span>Português brasileiro</span>
                                </div>
                            </div>

                            <div className="audio-settings" style={{ marginBottom: '1.5rem', display: 'grid', gap: '1rem', textAlign: 'left' }}>
                                <div className="control-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Voz do Narrador</label>
                                    <select
                                        value={selectedVoice}
                                        onChange={(e) => onVoiceChange(e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', cursor: 'pointer' }}
                                    >
                                        {availableVoices?.map(voice => (
                                            <option key={voice.id} value={voice.id} style={{ background: '#1a1a1a' }}>{voice.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="control-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Velocidade da Fala</label>
                                    <select
                                        value={speechRate}
                                        onChange={(e) => onRateChange(e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', cursor: 'pointer' }}
                                    >
                                        <option value="0.75" style={{ background: '#1a1a1a' }}>0.75x (Lento)</option>
                                        <option value="1.0" style={{ background: '#1a1a1a' }}>1.0x (Normal)</option>
                                        <option value="1.25" style={{ background: '#1a1a1a' }}>1.25x (Rápido)</option>
                                        <option value="1.5" style={{ background: '#1a1a1a' }}>1.5x (Muito Rápido)</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                className="btn btn-accent btn-lg w-full"
                                onClick={onGenerateAudio}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="btn-spinner"></span>
                                        Gerando áudio...
                                    </>
                                ) : (
                                    <>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polygon points="5 3 19 12 5 21 5 3" />
                                        </svg>
                                        Gerar Áudio
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function formatSummary(text) {
    return text
        .replace(/## (.*?)$/gm, '<h3>$1</h3>')
        .replace(/### (.*?)$/gm, '<h4>$1</h4>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br/>')
}

export default SummaryView
