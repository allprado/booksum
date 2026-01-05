-- Schema do Supabase para BookSum
-- Execute este SQL no Editor SQL do Supabase

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de livros (catálogo geral)
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  google_books_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  authors TEXT[] DEFAULT '{}',
  publisher TEXT,
  published_date TEXT,
  description TEXT,
  page_count INTEGER,
  categories TEXT[] DEFAULT '{}',
  language TEXT,
  thumbnail TEXT,
  isbn TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de resumos (um por livro)
CREATE TABLE IF NOT EXISTS summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  content JSONB NOT NULL, -- { chapters: [ { title, summary, key_points, startPage, endPage } ] }
  metadata JSONB, -- { model, generated_by, generation_time, etc }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(book_id)
);

-- Tabela de áudios dos capítulos
CREATE TABLE IF NOT EXISTS audio_chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  chapter_index INTEGER NOT NULL,
  chapter_title TEXT NOT NULL,
  audio_url TEXT NOT NULL, -- URL do arquivo no Supabase Storage
  voice_id TEXT NOT NULL,
  speech_rate TEXT DEFAULT '1.0',
  duration INTEGER, -- duração em segundos
  file_size INTEGER, -- tamanho em bytes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(book_id, chapter_index, voice_id, speech_rate)
);

-- Tabela de biblioteca do usuário (relacionamento muitos-para-muitos)
CREATE TABLE IF NOT EXISTS user_libraries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE,
  reading_progress JSONB, -- { currentChapter, currentPage, etc }
  notes TEXT,
  UNIQUE(user_id, book_id)
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_books_google_id ON books(google_books_id);
CREATE INDEX IF NOT EXISTS idx_summaries_book_id ON summaries(book_id);
CREATE INDEX IF NOT EXISTS idx_audio_chapters_book_id ON audio_chapters(book_id);
CREATE INDEX IF NOT EXISTS idx_user_libraries_user_id ON user_libraries(user_id);
CREATE INDEX IF NOT EXISTS idx_user_libraries_book_id ON user_libraries(book_id);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON books(created_at DESC);

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_summaries_updated_at BEFORE UPDATE ON summaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas de segurança (Row Level Security)
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_libraries ENABLE ROW LEVEL SECURITY;

-- Livros e resumos são públicos para leitura (qualquer um pode ver)
CREATE POLICY "Books are viewable by everyone" ON books
  FOR SELECT USING (true);

CREATE POLICY "Summaries are viewable by everyone" ON summaries
  FOR SELECT USING (true);

CREATE POLICY "Audio chapters are viewable by everyone" ON audio_chapters
  FOR SELECT USING (true);

-- Apenas usuários autenticados podem criar livros/resumos/áudios
CREATE POLICY "Authenticated users can insert books" ON books
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can insert summaries" ON summaries
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can insert audio chapters" ON audio_chapters
  FOR INSERT TO authenticated WITH CHECK (true);

-- Biblioteca do usuário: cada usuário pode ver e modificar apenas a sua
CREATE POLICY "Users can view their own library" ON user_libraries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own library" ON user_libraries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own library" ON user_libraries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own library" ON user_libraries
  FOR DELETE USING (auth.uid() = user_id);

-- Criar bucket no Storage para áudios (execute no painel do Supabase Storage)
-- Nome: audio-chapters
-- Público: true
-- Tipos permitidos: audio/mpeg, audio/mp3

-- Política de Storage para áudios (permite leitura pública e upload autenticado)
-- No painel do Supabase Storage > audio-chapters > Policies:
-- 1. Public read access:
--    CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (bucket_id = 'audio-chapters');
-- 2. Authenticated upload:
--    CREATE POLICY "Authenticated upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'audio-chapters' AND auth.role() = 'authenticated');
