# Correção: Problemas ao Salvar Livros na Biblioteca

## 📋 Resumo dos Problemas

1. **Erro 406 (Not Acceptable)** nas requisições GET para `books` e `summaries`
   - ✅ Corrigido com novas políticas RLS

2. **Erro 409 (Conflict)** ao salvar resumo e adicionar à biblioteca
   - Causa: Código estava usando `.insert()` em vez de `.upsert()`
   - ✅ Corrigido no arquivo `supabaseService.js`

3. **StorageApiError: Bucket not found / new row violates row-level security policy**
   - Causa: Bucket `audio-chapters` não foi criado + políticas de Storage incorretas
   
4. **Erro 400 ao fazer upload de áudio**
   - Causa: Combinação dos anteriores + política de Storage não funcionando

---

## ✅ Como Corrigir

### Passo 1: Código do Frontend (JÁ CORRIGIDO ✅)

O arquivo `src/services/supabaseService.js` foi atualizado:
- ✅ `addToUserLibrary()` agora usa `.upsert()` em vez de `.insert()`
- ✅ Isso permite adicionar o mesmo livro múltiplas vezes sem erro de conflito

**Mudança realizada:**
```javascript
// ANTES (erro 409):
.insert({...})

// DEPOIS (correto):
.upsert({...}, { onConflict: 'user_id,book_id' })
```

### Passo 2: Executar o SQL de Correção das Políticas RLS

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Vá para **SQL Editor**
3. Crie uma nova query e copie o conteúdo de `supabase-fix-rls.sql`
4. Execute a query

**O arquivo contém:**
- Remoção das políticas RLS incorretas
- Criação de novas políticas RLS corretas que permitem:
  - ✅ Qualquer um ler livros, resumos e áudios
  - ✅ Usuários autenticados criarem livros, resumos e áudios
  - ✅ Usuários acessarem apenas sua própria biblioteca

### Passo 3: Criar o Bucket `audio-chapters`

1. Acesse **Storage** no Supabase
2. Clique em **Create a new bucket**
3. Configure assim:
   - **Name:** `audio-chapters`
   - **Make it public:** ✅ SIM (marque a checkbox)
   - **Allowed MIME types:** `audio/mpeg, audio/mp3, audio/wav`
4. Clique em **Create bucket**

### Passo 4: Adicionar Políticas de Storage

⚠️ **IMPORTANTE:** Use o SQL fornecido em `supabase-fix-rls.sql` (PASSO 4).

**Como fazer:**
1. Volte ao **SQL Editor** do Supabase
2. Copie o PASSO 4 do arquivo `supabase-fix-rls.sql` (linhas com "CREATE POLICY" para storage.objects)
3. Cole e execute

**As 4 políticas criadas serão:**
- Public read: Qualquer um pode ler arquivos de áudio
- Authenticated upload: Usuários autenticados podem fazer upload
- Authenticated update: Usuários autenticados podem atualizar arquivos
- Authenticated delete: Usuários autenticados podem deletar arquivos

---

## 🔍 Testando a Correção

Após fazer todas as mudanças:

1. **Fazer login** na app
2. **Buscar um livro**
3. **Clicar em "Adicionar à Biblioteca"** - deve funcionar agora
4. **Gerar resumo** - os áudios devem ser salvos no bucket
5. **Verificar a biblioteca** - o livro deve aparecer listado

---

## 📌 Notas Importantes

- As políticas RLS PÚBLICAS (para `books`, `summaries`, `audio_chapters`) permitem que **qualquer um** leia os dados
- Isso é seguro porque não há informações sensíveis nessas tabelas
- A tabela `user_libraries` permanece **privada** - cada usuário só vê sua própria biblioteca
- Os áudios são salvos no bucket `audio-chapters` que é **público** para leitura
- Apenas **usuários autenticados** podem fazer upload de áudios

---

## 🚨 Se Continuar com Erros

### Erro 409 (Conflict):
- ✅ Já corrigido no código
- Limpe o cache do navegador (Ctrl+Shift+Delete)
- Desconecte e faça login novamente

### Erro 406 (Not Acceptable):
1. Verifique se executou o SQL de correção RLS
2. Verifique se o usuário está autenticado
3. Limpe o cache e tente novamente

### Erro ao fazer upload de áudio:
1. Verifique se o bucket `audio-chapters` foi criado e está **Public**
2. Verifique se as 4 políticas de Storage foram criadas (vá em Storage > audio-chapters > Policies)
3. Se ainda não funcionar, delete o bucket e crie novamente do zero

