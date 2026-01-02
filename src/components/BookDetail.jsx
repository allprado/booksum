import { useState } from 'react'
import './BookDetail.css'

function BookDetail({ book, onGenerateSummary, loading, model, onModelChange }) {
    const [summaryType, setSummaryType] = useState('summary') // 'summary' (narrative) or 'analysis' (critical)
    const [selectedFile, setSelectedFile] = useState(null)

    const onFileSelect = (file) => {
        if (file) setSelectedFile(file)
    }
    return (
        <div className="book-detail animate-fadeIn">
            <div className="book-hero">
                <div className="book-cover-large-wrapper">
                    {book.thumbnail ? (
                        <img
                            src={book.thumbnail.replace('zoom=1', 'zoom=2')}
                            alt={book.title}
                            className="book-cover-large"
                        />
                    ) : (
                        <div className="book-cover-placeholder-large">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            </svg>
                        </div>
                    )}
                    <div className="book-cover-glow"></div>
                </div>

                <div className="book-meta">
                    <h1 className="book-detail-title">{book.title}</h1>

                    <p className="book-detail-author">
                        por <span>{book.authors?.join(', ') || 'Autor desconhecido'}</span>
                    </p>

                    <div className="book-tags">
                        {book.categories?.slice(0, 2).map((cat, i) => (
                            <span key={i} className="tag">{cat}</span>
                        ))}
                        {book.pageCount > 0 && (
                            <span className="tag tag-pages">{book.pageCount} páginas</span>
                        )}
                    </div>

                    {book.averageRating && (
                        <div className="book-rating-large">
                            <div className="stars">
                                {[...Array(5)].map((_, i) => (
                                    <svg
                                        key={i}
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill={i < Math.round(book.averageRating) ? 'currentColor' : 'none'}
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                ))}
                            </div>
                            <span className="rating-text">
                                {book.averageRating.toFixed(1)} ({book.ratingsCount || 0} avaliações)
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="book-details-section">
                <div className="detail-row">
                    <span className="detail-label">ISBN</span>
                    <span className="detail-value">{book.isbn || 'N/A'}</span>
                </div>
                <div className="detail-row">
                    <span className="detail-label">Editora</span>
                    <span className="detail-value">{book.publisher}</span>
                </div>
                <div className="detail-row">
                    <span className="detail-label">Publicação</span>
                    <span className="detail-value">{book.publishedDate}</span>
                </div>
                <div className="detail-row">
                    <span className="detail-label">Idioma</span>
                    <span className="detail-value">{book.language === 'pt' ? 'Português' : book.language}</span>
                </div>
            </div>

            {book.description && (
                <div className="book-description">
                    <h3>Sobre o livro</h3>
                    <p dangerouslySetInnerHTML={{ __html: book.description }} />
                </div>
            )}

            <div className="generate-section">
                <div className="generate-info">
                    <div className="generate-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                    </div>
                    <div className="generate-text">
                        <h4>Gerar Resumo com IA</h4>
                        <p>Resumo de ~20 minutos com os principais insights do livro</p>
                    </div>
                </div>

                <div className="model-selector">
                    <button
                        className={`model-option ${model === 'gemini' ? 'active' : ''}`}
                        onClick={() => onModelChange('gemini')}
                    >
                        <span className="model-name">Gemini 2.5 Flash Lite</span>
                        <span className="model-badge">Google</span>
                    </button>
                    <button
                        className={`model-option ${model === 'openrouter' ? 'active' : ''}`}
                        onClick={() => onModelChange('openrouter')}
                    >
                        <span className="model-name">Mimo v2 Flash</span>
                        <span className="model-badge">Livre</span>
                    </button>
                </div>

                <div className="type-selector mb-4">
                    <div className="type-label">Tipo de Geração:</div>
                    <div className="type-options">
                        <button
                            className={`type-option ${summaryType === 'summary' ? 'active' : ''}`}
                            onClick={() => setSummaryType('summary')}
                        >
                            <span className="type-icon">📖</span>
                            <div className="type-content">
                                <span className="type-title">Resumo Narrativo</span>
                                <span className="type-desc">Narrativa condensada na voz do autor</span>
                            </div>
                        </button>
                        <button
                            className={`type-option ${summaryType === 'analysis' ? 'active' : ''}`}
                            onClick={() => setSummaryType('analysis')}
                        >
                            <span className="type-icon">🧠</span>
                            <div className="type-content">
                                <span className="type-title">Análise Crítica</span>
                                <span className="type-desc">Principais conceitos e insights práticos</span>
                            </div>
                        </button>
                    </div>
                </div>

                {summaryType === 'summary' && (
                    <div className="file-upload-section">
                        <label className="file-upload-label">Upload do Livro (PDF ou EPUB)</label>
                        <div className="file-upload-area" onClick={() => document.getElementById('book-file').click()}>
                            <input
                                type="file"
                                id="book-file"
                                accept=".pdf,.epub"
                                className="hidden-input"
                                onChange={(e) => onFileSelect(e.target.files[0])}
                            />
                            <div className="upload-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                            </div>
                            <span className="upload-text">
                                {selectedFile ? selectedFile.name : 'Clique para selecionar o arquivo'}
                            </span>
                        </div>
                        <p className="upload-hint">
                            {book.md5
                                ? 'Download automático disponível via Anna\'s Archive, ou faça upload manual.'
                                : 'Necessário para gerar o resumo narrativo fiel ao conteúdo.'}
                        </p>
                    </div>
                )}

                <button
                    className="btn btn-accent btn-lg w-full"
                    onClick={() => onGenerateSummary(summaryType, selectedFile)}
                    disabled={loading || (summaryType === 'summary' && !selectedFile && !book.md5)}
                >
                    {loading ? (
                        <>
                            <span className="btn-spinner"></span>
                            Gerando resumo...
                        </>
                    ) : (
                        <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            Gerar Resumo
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}

export default BookDetail
