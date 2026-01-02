import './BookList.css'

function BookList({ books, onSelectBook, loading }) {
    if (loading) {
        return (
            <div className="book-list">
                <h2 className="section-title">Resultados</h2>
                <div className="book-grid">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="book-card skeleton-card">
                            <div className="skeleton book-cover-skeleton"></div>
                            <div className="book-info">
                                <div className="skeleton skeleton-title"></div>
                                <div className="skeleton skeleton-author"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="book-list animate-slideUp">
            <h2 className="section-title">
                <span className="result-count">{books.length}</span> livros encontrados
            </h2>

            <div className="book-grid">
                {books.map((book, index) => (
                    <div
                        key={book.id}
                        className="book-card"
                        onClick={() => onSelectBook(book)}
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        <div className="book-cover-wrapper">
                            {book.thumbnail ? (
                                <img
                                    src={book.thumbnail}
                                    alt={book.title}
                                    className="book-cover"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="book-cover-placeholder">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                    </svg>
                                </div>
                            )}

                            {book.averageRating && (
                                <div className="book-rating">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                    <span>{book.averageRating.toFixed(1)}</span>
                                </div>
                            )}
                        </div>

                        <div className="book-info">
                            <h3 className="book-title">{book.title}</h3>
                            <p className="book-author">
                                {book.authors?.slice(0, 2).join(', ')}
                                {book.authors?.length > 2 && ' +'}
                            </p>
                            {book.pageCount > 0 && (
                                <span className="book-pages">{book.pageCount} páginas</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default BookList
