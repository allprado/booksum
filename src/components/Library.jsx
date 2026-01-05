import { useAuth } from '../context/AuthContext'
import { useSupabaseIntegration } from '../hooks/useSupabaseIntegration'
import './Library.css'

function Library({ onSelectBook }) {
  const { user } = useAuth()
  const { userLibrary } = useSupabaseIntegration()

  if (!user) {
    return (
      <div className="library-empty">
        <div className="empty-state">
          <span className="material-symbols-rounded">library_books</span>
          <h3>Faça login para ver sua biblioteca</h3>
          <p>Salve seus resumos favoritos e acesse de qualquer dispositivo</p>
        </div>
      </div>
    )
  }

  if (userLibrary.length === 0) {
    return (
      <div className="library-empty">
        <div className="empty-state">
          <span className="material-symbols-rounded">library_books</span>
          <h3>Sua biblioteca está vazia</h3>
          <p>Os livros que você resumir aparecerão aqui</p>
        </div>
      </div>
    )
  }

  return (
    <div className="library animate-slideUp">
      <h2 className="section-title">
        <span className="material-symbols-rounded">library_books</span>
        Minha Biblioteca
        <span className="library-count">{userLibrary.length}</span>
      </h2>

      <div className="library-grid">
        {userLibrary.map((item, index) => {
          const book = item.books
          return (
            <div
              key={item.id}
              className="library-card"
              onClick={() => onSelectBook(book)}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="library-cover-wrapper">
                {book.thumbnail ? (
                  <img
                    src={book.thumbnail}
                    alt={book.title}
                    className="library-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="library-cover-placeholder">
                    <span className="material-symbols-rounded">menu_book</span>
                  </div>
                )}
                
                {book.summaries?.[0] && (
                  <div className="summary-indicator">
                    <span className="material-symbols-rounded">summarize</span>
                  </div>
                )}
              </div>

              <div className="library-info">
                <h3 className="library-title">{book.title}</h3>
                <p className="library-author">
                  {book.authors?.slice(0, 2).join(', ')}
                </p>
                <div className="library-meta">
                  <span className="added-date">
                    Adicionado {new Date(item.added_at).toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Library
