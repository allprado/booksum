import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSupabaseIntegration } from '../hooks/useSupabaseIntegration'
import Modal from './Modal'
import './Library.css'

function Library({ onSelectBook, onReadSummary, onDeleteFromLibrary }) {
  const { user, signInWithGoogle } = useAuth()
  const { userLibrary, checkAndLoadSummary } = useSupabaseIntegration()
  const [openMenuId, setOpenMenuId] = useState(null)
  const [showAuthModal, setShowAuthModal] = useState(false)

  const handleSignIn = async () => {
    try {
      await signInWithGoogle()
      setShowAuthModal(false)
    } catch (error) {
      console.error('Error signing in:', error)
      alert('Erro ao fazer login. Tente novamente.')
    }
  }

  if (!user) {
    return (
      <>
        <div className="library-empty">
          <div className="empty-state">
            <span className="material-symbols-rounded">library_books</span>
            <h3>Faça login para ver sua biblioteca</h3>
            <p>Salve seus resumos favoritos e acesse de qualquer dispositivo</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowAuthModal(true)}
            >
              Continuar com Google
            </button>
          </div>
        </div>
        <Modal
          isOpen={showAuthModal}
          title="Fazer Login"
          message="Para acessar sua biblioteca, você precisa fazer login com sua conta Google."
          type="info"
          onClose={() => setShowAuthModal(false)}
          actions={[
            {
              label: 'Continuar com Google',
              onClick: handleSignIn,
              isPrimary: true
            }
          ]}
          showCloseButton={true}
        />
      </>
    )
  }

  if (userLibrary.length === 0) {
    return (
      <div className="library-empty animate-fadeIn">
        <div className="empty-state">
          <div className="empty-icon-large">
            <span className="material-symbols-rounded">auto_awesome</span>
          </div>
          <h3>Sua biblioteca está vazia</h3>
          <p>Explore livros e crie seu primeiro resumo com IA para começar sua jornada de leitura</p>
          <div className="empty-cta">
            <p className="cta-hint">💡 Dica: Use a barra de busca na tela inicial para encontrar livros</p>
          </div>
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
          const hasSummary = book.summaries?.[0]
          return (
            <div
              key={item.id}
              className="library-card"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div 
                className="library-cover-wrapper"
                onClick={() => onSelectBook(book)}
              >
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
                
                {hasSummary && (
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
                  
                  <div className="library-menu-wrapper">
                    <button
                      className="library-menu-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenMenuId(openMenuId === item.id ? null : item.id)
                      }}
                      aria-label="Menu do livro"
                    >
                      <span className="material-symbols-rounded">more_vert</span>
                    </button>

                    {openMenuId === item.id && (
                      <>
                        <div 
                          className="library-menu-backdrop"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="library-menu">
                          {hasSummary && (
                            <button
                              className="library-menu-item"
                              onClick={async (e) => {
                                e.stopPropagation()
                                setOpenMenuId(null)
                                onReadSummary(item.id, book, item.reading_progress)
                              }}
                            >
                              <span className="material-symbols-rounded">auto_stories</span>
                              Ler
                            </button>
                          )}
                          <button
                            className="library-menu-item"
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenMenuId(null)
                              onSelectBook(book)
                            }}
                          >
                            <span className="material-symbols-rounded">info</span>
                            Ver Detalhes
                          </button>
                          <button
                            className="library-menu-item delete-item"
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenMenuId(null)
                              onDeleteFromLibrary(item.id, book.title)
                            }}
                          >
                            <span className="material-symbols-rounded">delete</span>
                            Excluir
                          </button>
                        </div>
                      </>
                    )}
                  </div>
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
