-- FIX: Corrigir políticas RLS que estão causando erros 406

-- ===============================================
-- PASSO 1: Remover políticas incorretas
-- ===============================================

DROP POLICY IF EXISTS "Books are viewable by everyone" ON books;
DROP POLICY IF EXISTS "Summaries are viewable by everyone" ON summaries;
DROP POLICY IF EXISTS "Audio chapters are viewable by everyone" ON audio_chapters;
DROP POLICY IF EXISTS "Authenticated users can insert books" ON books;
DROP POLICY IF EXISTS "Authenticated users can insert summaries" ON summaries;
DROP POLICY IF EXISTS "Authenticated users can insert audio chapters" ON audio_chapters;

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
-- PASSO 3: Políticas de Storage
-- ===============================================

-- Execute no painel do Supabase: Storage > audio-chapters > Policies

-- Adicione estas políticas no painel:
-- 1. Para leitura pública:
-- CREATE POLICY "Public read access" ON storage.objects 
--   FOR SELECT USING (bucket_id = 'audio-chapters');

-- 2. Para upload autenticado:
-- CREATE POLICY "Authenticated upload" ON storage.objects 
--   FOR INSERT WITH CHECK (bucket_id = 'audio-chapters' AND auth.role() = 'authenticated');

-- 3. Para delete autenticado (permitir que usuários deletem seus próprios arquivos):
-- CREATE POLICY "Authenticated delete" ON storage.objects 
--   FOR DELETE USING (bucket_id = 'audio-chapters' AND auth.role() = 'authenticated');
