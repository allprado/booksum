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
        if (query.trim()) {
            onSearch(query)
        }
    }

    const sources = [
        { id: 'google', label: 'Google', sublabel: 'Books', icon: 'auto_stories' },
        { id: 'openlibrary', label: 'Open', sublabel: 'Library', icon: 'local_library' },
        { id: 'annas', label: "Anna's", sublabel: 'Archive', icon: 'archive' }
    ]

    return (
        <div className="search-container glass-panel">
            <div className="source-selector">
                <label className="source-label">Fonte de Busca</label>
                <div className="source-options">
                    {sources.map((s) => (
                        <label key={s.id} className="source-option">
                            <input
                                type="radio"
                                name="search-source"
                                value={s.id}
                                checked={source === s.id}
                                onChange={(e) => onSourceChange(e.target.value)}
                                className="source-radio"
                            />
                            <div className="source-card">
                                <span className="material-symbols-rounded source-icon">{s.icon}</span>
                                <span className="source-text">
                                    {s.label}<br />{s.sublabel}
                                </span>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            <form className="search-form" onSubmit={handleSubmit}>
                <div className="search-input-wrapper">
                    <span className="material-symbols-rounded search-icon">search</span>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Busque por Título, Autor"
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
                            <span className="material-symbols-rounded">close</span>
                        </button>
                    )}
                </div>

                <button
                    type="submit"
                    className="search-btn"
                    disabled={loading || !query.trim()}
                >
                    {loading ? (
                        <span className="btn-spinner"></span>
                    ) : (
                        <>
                            <span>Buscar Agora</span>
                            <span className="material-symbols-rounded search-btn-icon">arrow_forward</span>
                        </>
                    )}
                </button>
            </form>
        </div>
    )
}

export default SearchBar
