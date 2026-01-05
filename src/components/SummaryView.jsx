import { useState } from 'react'
import ReadingMode from './ReadingMode'
import './SummaryView.css'

function SummaryView({
    book,
    summary,
    audioUrl,
    audioChapters,
    onGenerateChapterAudio,
    showToast,
    onUpdateProgress
}) {
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
                onUpdateProgress={onUpdateProgress}
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

                <div className="summary-actions">
                    <button
                        className="btn btn-primary btn-lg w-full"
                        onClick={() => setShowReadingMode(true)}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                        </svg>
                        Abrir modo leitura
                    </button>
                </div>
            </div>
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
