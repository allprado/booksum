# 🔧 Como Corrigir o Erro 406 - Políticas RLS

O erro 406 está ocorrendo porque as políticas de Row Level Security (RLS) no Supabase estão incorretas ou em conflito.

## ✅ Solução: Aplicar Políticas RLS Corretas

### Passo 1: Abrir SQL Editor do Supabase
1. Acesse https://app.supabase.com/
2. Selecione seu projeto
3. Vá em **SQL Editor** (lado esquerdo)

### Passo 2: Copiar e Executar o SQL

Copie TODO o conteúdo do arquivo `supabase-fix-rls.sql` que está na raiz do projeto e execute no SQL Editor do Supabase.

Este arquivo contém:
- **Remoção** de todas as políticas RLS antigas/conflitantes
- **Criação** das novas políticas RLS corretas que permitem:
  - ✅ Leitura pública de livros, resumos e áudios
  - ✅ Apenas usuários autenticados podem inserir
  - ✅ Biblioteca privada (apenas o usuário pode ver a sua)

### Passo 3: Verificar Aplicação

Após executar o SQL:
1. Vá em **Authentication > Policies** (lado esquerdo)
2. Verifique se as novas políticas aparecem:
   - `books_public_read`, `books_authenticated_insert`
   - `summaries_public_read`, `summaries_authenticated_insert`
   - `audio_chapters_public_read`, `audio_chapters_authenticated_insert`
   - `user_libraries_user_read`, `user_libraries_user_insert`, `user_libraries_user_update`, `user_libraries_user_delete`

### ⚠️ Importante
Se você ver mensagens de erro ao executar (tipo "policy already exists"), ignore - o arquivo já tem `DROP POLICY IF EXISTS` para limpar tudo primeiro.

---

## 🎯 Resumo do que será feito:

| Tabela | SELECT | INSERT |
|--------|--------|--------|
| **books** | Público ✅ | Autenticados apenas ✅ |
| **summaries** | Público ✅ | Autenticados apenas ✅ |
| **audio_chapters** | Público ✅ | Autenticados apenas ✅ |
| **user_libraries** | Seu próprio ✅ | Seu próprio ✅ |

Isso permite que qualquer um leia os livros e resumos, mas apenas usuários autenticados possam criar ou modificar.
