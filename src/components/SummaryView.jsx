import { useState } from 'react'
import AudioPlayer from './AudioPlayer'
import ReadingMode from './ReadingMode'
import './SummaryView.css'

function SummaryView({
    book,
    summary,
    audioUrl,
    audioChapters,
    onGenerateAudio,
    onGenerateChapterAudio,
    loading,
    selectedVoice,
    onVoiceChange,
    speechRate,
    onRateChange,
    availableVoices,
    showToast
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
                audioUrl={audioUrl}
                audioChapters={audioChapters}
                onGenerateChapterAudio={onGenerateChapterAudio}
                onClose={() => setShowReadingMode(false)}
                showToast={showToast}
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
                    <AudioPlayer 
                        audioUrl={audioUrl} 
                        audioChapters={audioChapters} 
                        book={book}
                        onGenerateChapterAudio={onGenerateChapterAudio}
                        summary={summary}
                        showToast={showToast}
                    />
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
