-- ⚠️ FIX AGRESSIVO: Desabilitar e Reabilitar RLS com Políticas Corretas

-- ===============================================
-- PASSO 1: DESABILITAR RLS temporariamente
-- ===============================================

ALTER TABLE books DISABLE ROW LEVEL SECURITY;
ALTER TABLE summaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE audio_chapters DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_libraries DISABLE ROW LEVEL SECURITY;

-- ===============================================
-- PASSO 2: Remover TODAS as políticas existentes
-- ===============================================

DROP POLICY IF EXISTS "Books are viewable by everyone" ON books;
DROP POLICY IF EXISTS "Summaries are viewable by everyone" ON summaries;
DROP POLICY IF EXISTS "Audio chapters are viewable by everyone" ON audio_chapters;
DROP POLICY IF EXISTS "Authenticated users can insert books" ON books;
DROP POLICY IF EXISTS "Authenticated users can insert summaries" ON summaries;
DROP POLICY IF EXISTS "Authenticated users can insert audio chapters" ON audio_chapters;
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
DROP POLICY IF EXISTS "Users can view their own library" ON user_libraries;
DROP POLICY IF EXISTS "Users can insert into their own library" ON user_libraries;
DROP POLICY IF EXISTS "Users can update their own library" ON user_libraries;
DROP POLICY IF EXISTS "Users can delete from their own library" ON user_libraries;

-- ===============================================
-- PASSO 3: REABILITAR RLS
-- ===============================================

ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_libraries ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- PASSO 4: Criar políticas SIMPLES e FUNCIONA NTES
-- ===============================================

-- TABELA: books (todos conseguem ler, apenas autenticados inserem)
CREATE POLICY "books_read_all" ON books
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "books_insert_authenticated" ON books
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- TABELA: summaries (todos conseguem ler, apenas autenticados inserem)
CREATE POLICY "summaries_read_all" ON summaries
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "summaries_insert_authenticated" ON summaries
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- TABELA: audio_chapters (todos conseguem ler, apenas autenticados inserem)
CREATE POLICY "audio_chapters_read_all" ON audio_chapters
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "audio_chapters_insert_authenticated" ON audio_chapters
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- TABELA: user_libraries (privada: apenas o proprietário acessa)
CREATE POLICY "user_libraries_read_own" ON user_libraries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_libraries_insert_own" ON user_libraries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_libraries_update_own" ON user_libraries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_libraries_delete_own" ON user_libraries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ===============================================
-- ✅ PRONTO!
-- ===============================================
-- As políticas foram resetadas e aplicadas corretamente.
-- Agora todos conseguem ler livros, resumos e áudios,
-- mas apenas usuários autenticados podem modificar dados.
