-- FIX: Corrigir políticas RLS que estão causando erros 406

-- ===============================================
-- PASSO 1: Remover TODAS as políticas existentes
-- ===============================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Books are viewable by everyone" ON books;
DROP POLICY IF EXISTS "Summaries are viewable by everyone" ON summaries;
DROP POLICY IF EXISTS "Audio chapters are viewable by everyone" ON audio_chapters;
DROP POLICY IF EXISTS "Authenticated users can insert books" ON books;
DROP POLICY IF EXISTS "Authenticated users can insert summaries" ON summaries;
DROP POLICY IF EXISTS "Authenticated users can insert audio chapters" ON audio_chapters;

-- Remover políticas novas (se já existirem de execuções anteriores)
DROP POLICY IF EXISTS "books_public_read" ON books;
DROP POLICY IF EXISTS "books_authenticated_insert" ON books;
DROP POLICY IF EXISTS "summaries_public_read" ON summaries;
DROP POLICY IF EXISTS "summaries_authenticated_insert" ON summaries;
DROP POLICY IF EXISTS "audio_chapters_public_read" ON audio_chapters;
DROP POLICY IF EXISTS "audio_chapters_authenticated_insert" ON audio_chapters;
DROP POLICY IF EXISTS "user_libraries_user_read" ON user_libraries;
DROP POLICY IF EXISTS "user_libraries_user_insert" ON user_libraries;
DROP POLICY IF EXISTS "user_libraries_user_update" ON user_libraries;
DROP POLICY IF EXISTS "user_libraries_user_delete" ON user_libraries;

-- ===============================================
-- PASSO 2: Criar novas políticas RLS corretas
-- ===============================================

-- TABELA: books (pública para leitura, apenas autenticados podem inserir)
CREATE POLICY "books_public_read" ON books
  FOR SELECT USING (true);

CREATE POLICY "books_authenticated_insert" ON books
  FOR INSERT TO authenticated 
  WITH CHECK (true);

-- TABELA: summaries (pública para leitura, apenas autenticados podem inserir)
CREATE POLICY "summaries_public_read" ON summaries
  FOR SELECT USING (true);

CREATE POLICY "summaries_authenticated_insert" ON summaries
  FOR INSERT TO authenticated 
  WITH CHECK (true);

-- TABELA: audio_chapters (pública para leitura, apenas autenticados podem inserir)
CREATE POLICY "audio_chapters_public_read" ON audio_chapters
  FOR SELECT USING (true);

CREATE POLICY "audio_chapters_authenticated_insert" ON audio_chapters
  FOR INSERT TO authenticated 
  WITH CHECK (true);

-- TABELA: user_libraries (privada, apenas o proprietário pode acessar)
CREATE POLICY "user_libraries_user_read" ON user_libraries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_libraries_user_insert" ON user_libraries
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_libraries_user_update" ON user_libraries
  FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_libraries_user_delete" ON user_libraries
  FOR DELETE TO authenticated 
  USING (auth.uid() = user_id);

-- ===============================================
-- PASSO 3: Criar Bucket de Storage (se não existir)
-- ===============================================

-- Acesse Storage > Create bucket no painel do Supabase
-- Nome: audio-chapters
-- Make it Public: SIM (marcar a checkbox)
-- Allowed MIME types: audio/mpeg, audio/mp3, audio/wav

-- ===============================================
-- PASSO 4: Políticas de Storage
-- ===============================================

-- IMPORTANTE: Execute estas políticas APÓS criar o bucket!
-- No painel: Storage > audio-chapters > Policies > New Policy

-- Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Public read" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete" ON storage.objects;

-- Política 1: Leitura Pública
CREATE POLICY "Public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'audio-chapters');

-- Política 2: Upload autenticado
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'audio-chapters' 
    AND auth.role() = 'authenticated'
  );

-- Política 3: Atualizar arquivos autenticados
CREATE POLICY "Authenticated users can update own files" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'audio-chapters' 
    AND auth.role() = 'authenticated'
  ) WITH CHECK (
    bucket_id = 'audio-chapters' 
    AND auth.role() = 'authenticated'
  );

-- Política 4: Deletar arquivos autenticados
CREATE POLICY "Authenticated users can delete own files" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'audio-chapters' 
    AND auth.role() = 'authenticated'
  );
