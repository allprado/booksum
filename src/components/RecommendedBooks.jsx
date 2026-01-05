import { useState, useEffect } from 'react'
import BookList from './BookList'
import './RecommendedBooks.css'

function RecommendedBooks({ onSelectBook }) {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecommendedBooks()
  }, [])

  const loadRecommendedBooks = async () => {
    setLoading(true)
    try {
      // Lista de livros famosos para recomendar
      const recommendedQueries = [
        '1984 George Orwell',
        'O Senhor dos Anéis Tolkien',
        'Dom Casmurro Machado de Assis',
        'O Cortiço Aluísio Azevedo',
        'Cem Anos de Solidão García Márquez',
        'O Código Da Vinci Dan Brown',
        'O Alquimista Paulo Coelho',
        'Grande Sertão Veredas Guimarães Rosa'
      ]

      const allBooks = []

      for (const query of recommendedQueries) {
        try {
          const response = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1&printType=books`
          )
          const data = await response.json()

          if (data.items && data.items.length > 0) {
            const item = data.items[0]
            if (item.volumeInfo.imageLinks?.thumbnail) {
              allBooks.push({
                id: item.id,
                title: item.volumeInfo.title || 'Título não disponível',
                authors: item.volumeInfo.authors || ['Autor desconhecido'],
                publisher: item.volumeInfo.publisher || 'Editora não informada',
                publishedDate: item.volumeInfo.publishedDate || 'Data não informada',
                description: item.volumeInfo.description || 'Descrição não disponível',
                pageCount: item.volumeInfo.pageCount || 0,
                categories: item.volumeInfo.categories || [],
                thumbnail: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
                language: item.volumeInfo.language,
                averageRating: item.volumeInfo.averageRating,
                ratingsCount: item.volumeInfo.ratingsCount,
                isbn: item.volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier ||
                  item.volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier
              })
            }
          }
        } catch (error) {
          console.error(`Erro ao buscar ${query}:`, error)
        }
      }

      setBooks(allBooks)
    } catch (error) {
      console.error('Erro ao carregar livros recomendados:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="recommended-books-view animate-fadeIn">
      <div className="recommended-header">
        <h2 className="recommended-title">Livros Recomendados</h2>
        <p className="recommended-subtitle">Clássicos e bestsellers para você explorar</p>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Carregando recomendações...</p>
        </div>
      ) : (
        <BookList
          books={books}
          onSelectBook={onSelectBook}
          loading={false}
          hasMoreResults={false}
        />
      )}
    </div>
  )
}

export default RecommendedBooks
