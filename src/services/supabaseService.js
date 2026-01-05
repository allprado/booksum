import { supabase } from '../config/supabase'

/**
 * Serviço para gerenciar livros no Supabase
 */

// Buscar ou criar livro no catálogo geral
export async function getOrCreateBook(bookData) {
  try {
    // Primeiro, tentar buscar o livro pelo google_books_id
    const { data: existingBook, error: searchError } = await supabase
      .from('books')
      .select('*')
      .eq('google_books_id', bookData.id)
      .single()

    if (existingBook) {
      return { data: existingBook, error: null }
    }

    // Se não existe, criar
    const { data: newBook, error: insertError } = await supabase
      .from('books')
      .insert({
        google_books_id: bookData.id,
        title: bookData.title,
        authors: bookData.authors || [],
        publisher: bookData.publisher,
        published_date: bookData.publishedDate,
        description: bookData.description,
        page_count: bookData.pageCount,
        categories: bookData.categories || [],
        language: bookData.language,
        thumbnail: bookData.thumbnail,
        isbn: bookData.isbn,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating book:', insertError)
      return { data: null, error: insertError }
    }

    return { data: newBook, error: null }
  } catch (error) {
    console.error('Error in getOrCreateBook:', error)
    return { data: null, error }
  }
}

// Verificar se um livro tem resumo
export async function checkBookHasSummary(googleBooksId) {
  try {
    const { data: book } = await supabase
      .from('books')
      .select('id')
      .eq('google_books_id', googleBooksId)
      .single()

    if (!book) return { hasSummary: false, bookId: null }

    const { data: summary } = await supabase
      .from('summaries')
      .select('id')
      .eq('book_id', book.id)
      .single()

    return { 
      hasSummary: !!summary, 
      bookId: book.id,
      summaryId: summary?.id 
    }
  } catch (error) {
    console.error('Error checking summary:', error)
    return { hasSummary: false, bookId: null }
  }
}

// Verificar múltiplos livros se têm resumo
export async function checkBooksHaveSummaries(googleBooksIds) {
  try {
    const { data: books } = await supabase
      .from('books')
      .select('id, google_books_id')
      .in('google_books_id', googleBooksIds)

    if (!books || books.length === 0) {
      return {}
    }

    const bookIds = books.map(b => b.id)
    const { data: summaries } = await supabase
      .from('summaries')
      .select('book_id')
      .in('book_id', bookIds)

    const summaryMap = {}
    summaries?.forEach(s => {
      const book = books.find(b => b.id === s.book_id)
      if (book) {
        summaryMap[book.google_books_id] = true
      }
    })

    return summaryMap
  } catch (error) {
    console.error('Error checking summaries:', error)
    return {}
  }
}

// Salvar resumo de um livro
export async function saveSummary(bookId, summaryContent, metadata = {}) {
  try {
    const { data, error } = await supabase
      .from('summaries')
      .upsert({
        book_id: bookId,
        content: summaryContent,
        metadata: {
          ...metadata,
          generated_at: new Date().toISOString()
        }
      }, { 
        onConflict: 'book_id' 
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving summary:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error in saveSummary:', error)
    return { data: null, error }
  }
}

// Buscar resumo de um livro
export async function getSummary(bookId) {
  try {
    const { data, error } = await supabase
      .from('summaries')
      .select('*')
      .eq('book_id', bookId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching summary:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error in getSummary:', error)
    return { data: null, error }
  }
}

// Salvar áudio de um capítulo
export async function saveAudioChapter(bookId, chapterData) {
  try {
    const { data, error } = await supabase
      .from('audio_chapters')
      .upsert({
        book_id: bookId,
        chapter_index: chapterData.chapterIndex,
        chapter_title: chapterData.title,
        audio_url: chapterData.audioUrl,
        voice_id: chapterData.voiceId,
        speech_rate: chapterData.speechRate,
        duration: chapterData.duration,
        file_size: chapterData.fileSize,
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving audio chapter:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error in saveAudioChapter:', error)
    return { data: null, error }
  }
}

// Buscar áudios de um livro
export async function getAudioChapters(bookId, voiceId, speechRate) {
  try {
    let query = supabase
      .from('audio_chapters')
      .select('*')
      .eq('book_id', bookId)
      .order('chapter_index', { ascending: true })

    if (voiceId) {
      query = query.eq('voice_id', voiceId)
    }
    if (speechRate) {
      query = query.eq('speech_rate', speechRate)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching audio chapters:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error in getAudioChapters:', error)
    return { data: null, error }
  }
}

// Adicionar livro à biblioteca do usuário
export async function addToUserLibrary(userId, bookId, readingProgress = {}) {
  try {
    const { data, error } = await supabase
      .from('user_libraries')
      .upsert({
        user_id: userId,
        book_id: bookId,
        reading_progress: readingProgress,
      }, {
        onConflict: 'user_id,book_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding to library:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error in addToUserLibrary:', error)
    return { data: null, error }
  }
}

// Remover livro da biblioteca do usuário
export async function removeFromUserLibrary(userId, bookId) {
  try {
    const { error } = await supabase
      .from('user_libraries')
      .delete()
      .eq('user_id', userId)
      .eq('book_id', bookId)

    if (error) {
      console.error('Error removing from library:', error)
      return { error }
    }

    return { error: null }
  } catch (error) {
    console.error('Error in removeFromUserLibrary:', error)
    return { error }
  }
}

// Buscar biblioteca do usuário
export async function getUserLibrary(userId) {
  try {
    const { data, error } = await supabase
      .from('user_libraries')
      .select(`
        *,
        books (
          *,
          summaries (
            id,
            created_at
          )
        )
      `)
      .eq('user_id', userId)
      .order('added_at', { ascending: false })

    if (error) {
      console.error('Error fetching user library:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error in getUserLibrary:', error)
    return { data: null, error }
  }
}

// Verificar se livro está na biblioteca do usuário
export async function isBookInUserLibrary(userId, bookId) {
  try {
    const { data, error } = await supabase
      .from('user_libraries')
      .select('id')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .single()

    return { isInLibrary: !!data, error: null }
  } catch (error) {
    return { isInLibrary: false, error: null }
  }
}

// Atualizar progresso de leitura
export async function updateReadingProgress(userId, bookId, progress) {
  try {
    const { data, error } = await supabase
      .from('user_libraries')
      .update({
        reading_progress: progress,
        last_read_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .select()
      .single()

    if (error) {
      console.error('Error updating reading progress:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error in updateReadingProgress:', error)
    return { data: null, error }
  }
}

// Upload de arquivo de áudio para o Supabase Storage
export async function uploadAudioFile(file, bookId, chapterIndex, voiceId, speechRate) {
  try {
    const fileExt = 'mp3'
    const fileName = `${bookId}/${chapterIndex}_${voiceId}_${speechRate}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('audio-chapters')
      .upload(fileName, file, {
        contentType: 'audio/mpeg',
        upsert: true, // Substituir se já existir
      })

    if (error) {
      console.error('Error uploading audio:', error)
      return { data: null, error }
    }

    // Obter URL pública do arquivo
    const { data: { publicUrl } } = supabase.storage
      .from('audio-chapters')
      .getPublicUrl(fileName)

    return { data: { ...data, publicUrl }, error: null }
  } catch (error) {
    console.error('Error in uploadAudioFile:', error)
    return { data: null, error }
  }
}
