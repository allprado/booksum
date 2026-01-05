import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import * as supabaseService from '../services/supabaseService'

/**
 * Hook customizado para gerenciar a integração com Supabase
 * para livros, resumos e áudios
 */
export function useSupabaseIntegration() {
  const { user } = useAuth()
  const [booksSummaryStatus, setBooksSummaryStatus] = useState({})
  const [currentBookId, setCurrentBookId] = useState(null)
  const [userLibrary, setUserLibrary] = useState([])

  // Verificar quais livros têm resumo (batch)
  const checkBooksHaveSummaries = async (books) => {
    if (!books || books.length === 0) return

    const googleIds = books.map(b => b.id)
    const statusMap = await supabaseService.checkBooksHaveSummaries(googleIds)
    setBooksSummaryStatus(statusMap)
  }

  // Carregar biblioteca do usuário
  const loadUserLibrary = async () => {
    if (!user) {
      setUserLibrary([])
      return
    }

    const { data, error } = await supabaseService.getUserLibrary(user.id)
    if (!error && data) {
      setUserLibrary(data)
    }
  }

  // Criar ou buscar livro no banco e obter seu ID do Supabase
  const getOrCreateBookInDB = async (bookData) => {
    const { data, error } = await supabaseService.getOrCreateBook(bookData)
    if (!error && data) {
      setCurrentBookId(data.id)
      return data.id
    }
    return null
  }

  // Verificar se existe resumo no banco
  const checkAndLoadSummary = async (bookId) => {
    const { data, error } = await supabaseService.getSummary(bookId)
    if (!error && data) {
      return data.content // Retorna o conteúdo do resumo
    }
    return null
  }

  // Salvar resumo no banco
  const saveSummaryToDB = async (bookId, summaryContent, metadata = {}) => {
    const { data, error } = await supabaseService.saveSummary(bookId, summaryContent, metadata)
    if (!error) {
      // Atualizar status de que o livro tem resumo
      setBooksSummaryStatus(prev => ({ ...prev, [metadata.googleBooksId]: true }))
      return data
    }
    console.error('Erro ao salvar resumo:', error)
    return null
  }

  // Adicionar livro à biblioteca do usuário
  const addBookToLibrary = async (bookId) => {
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const { data, error } = await supabaseService.addToUserLibrary(user.id, bookId)
    if (!error) {
      await loadUserLibrary() // Recarregar biblioteca
      return data
    }
    throw error
  }

  // Verificar e carregar áudios existentes
  const checkAndLoadAudios = async (bookId, voiceId, speechRate) => {
    const { data, error } = await supabaseService.getAudioChapters(bookId, voiceId, speechRate)
    if (!error && data && data.length > 0) {
      // Formatar para o formato esperado pelo app
      return data.map(audio => ({
        title: audio.chapter_title,
        audioUrl: audio.audio_url,
        chapterIndex: audio.chapter_index,
        duration: audio.duration
      }))
    }
    return []
  }

  // Salvar áudio de capítulo
  const saveAudioToDB = async (bookId, chapterData) => {
    const { data, error } = await supabaseService.saveAudioChapter(bookId, chapterData)
    if (error) {
      console.error('Erro ao salvar áudio:', error)
    }
    return data
  }

  // Upload de arquivo de áudio
  const uploadAudio = async (audioBlob, bookId, chapterIndex, voiceId, speechRate) => {
    const { data, error } = await supabaseService.uploadAudioFile(
      audioBlob,
      bookId,
      chapterIndex,
      voiceId,
      speechRate
    )
    if (!error && data) {
      return data.publicUrl
    }
    console.error('Erro ao fazer upload de áudio:', error)
    return null
  }

  // Verificar se livro está na biblioteca
  const isInLibrary = (bookId) => {
    return userLibrary.some(item => item.book_id === bookId)
  }

  // Carregar biblioteca quando usuário mudar
  useEffect(() => {
    loadUserLibrary()
  }, [user])

  return {
    user,
    booksSummaryStatus,
    currentBookId,
    userLibrary,
    checkBooksHaveSummaries,
    getOrCreateBookInDB,
    checkAndLoadSummary,
    saveSummaryToDB,
    addBookToLibrary,
    checkAndLoadAudios,
    saveAudioToDB,
    uploadAudio,
    isInLibrary,
    loadUserLibrary,
  }
}
