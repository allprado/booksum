import { useState, useEffect } from 'react'
import './SearchBar.css'

function SearchBar({ onSearch, loading, source, onSourceChange }) {
    const [query, setQuery] = useState('')

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (query.trim()) {
                onSearch(query)
            }
        }, 600)

        return () => clearTimeout(timeoutId)
    }, [query, onSearch])

    const handleSubmit = (e) => {
        e.preventDefault()
    }

    return (
        <div className="search-container">
            <div className="search-source-selector" style={{ marginBottom: '1rem', display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    color: source === 'google' ? '#fff' : 'rgba(255,255,255,0.6)'
                }}>
                    <input
                        type="radio"
                        name="search-source"
                        value="google"
                        checked={source === 'google'}
                        onChange={(e) => onSourceChange(e.target.value)}
                        style={{ accentColor: '#7c3aed' }}
                    />
                    Google Books
                </label>
                <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    color: source === 'openlibrary' ? '#fff' : 'rgba(255,255,255,0.6)'
                }}>
                    <input
                        type="radio"
                        name="search-source"
                        value="openlibrary"
                        checked={source === 'openlibrary'}
                        onChange={(e) => onSourceChange(e.target.value)}
                        style={{ accentColor: '#7c3aed' }}
                    />
                    Open Library
                </label>
                <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    color: source === 'annas' ? '#fff' : 'rgba(255,255,255,0.6)'
                }}>
                    <input
                        type="radio"
                        name="search-source"
                        value="annas"
                        checked={source === 'annas'}
                        onChange={(e) => onSourceChange(e.target.value)}
                        style={{ accentColor: '#7c3aed' }}
                    />
                    Anna's Archive
                </label>
            </div>

            <form className="search-bar" onSubmit={handleSubmit}>
                <div className="search-input-wrapper">
                    <div className="search-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                    </div>

                    <input
                        type="text"
                        className="search-input"
                        placeholder={
                            source === 'google' ? "Busque por Título, Autor ou ISBN (PT)..." :
                                source === 'annas' ? "Busque no Anna's Archive (EPUB/PDF)..." :
                                    "Busque por Título, Autor ou ISBN..."
                        }
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        disabled={loading}
                    />

                    {query && (
                        <button
                            type="button"
                            className="clear-btn"
                            onClick={() => setQuery('')}
                            aria-label="Limpar busca"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                <button
                    type="submit"
                    className="search-btn btn btn-primary"
                    disabled={loading || !query.trim()}
                >
                    {loading ? (
                        <span className="btn-spinner"></span>
                    ) : (
                        'Buscar'
                    )}
                </button>
            </form>
        </div>
    )
}

export default SearchBar
