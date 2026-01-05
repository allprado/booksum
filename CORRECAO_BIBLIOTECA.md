# Correção: Problemas ao Salvar Livros na Biblioteca

## 📋 Resumo dos Problemas

1. **Erro 406 (Not Acceptable)** nas requisições GET para `books` e `summaries`
   - Causa: Políticas RLS muito restritivas
   
2. **StorageApiError: Bucket not found**
   - Causa: Bucket `audio-chapters` não foi criado no Storage

3. **Erro 400 ao fazer upload de áudio**
   - Causa: Bucket não existe + políticas de Storage não configuradas

---

## ✅ Como Corrigir

### Passo 1: Executar o SQL de Correção das Políticas RLS

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

---

### Passo 2: Criar o Bucket `audio-chapters`

1. Acesse **Storage** no Supabase
2. Clique em **Create a new bucket**
3. Nome: `audio-chapters`
4. Marque como **Public**
5. Clique em **Create bucket**

---

### Passo 3: Adicionar Políticas de Storage

1. Ainda em **Storage**, clique em `audio-chapters`
2. Vá para a aba **Policies**
3. Clique em **New Policy** e adicione as 3 políticas abaixo:

#### Política 1: Leitura Pública
```sql
CREATE POLICY "Public read access" ON storage.objects 
  FOR SELECT USING (bucket_id = 'audio-chapters');
```

#### Política 2: Upload Autenticado
```sql
CREATE POLICY "Authenticated upload" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'audio-chapters' AND auth.role() = 'authenticated');
```

#### Política 3: Delete Autenticado
```sql
CREATE POLICY "Authenticated delete" ON storage.objects 
  FOR DELETE USING (bucket_id = 'audio-chapters' AND auth.role() = 'authenticated');
```

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

## 🚨 Se Continuar com Erros 406

1. Verifique se executou todos os STEPs acima
2. Limpe o cache do navegador (Ctrl+Shift+Delete)
3. Desconecte e faça login novamente
4. Se persistir:
   - Verifique se as políticas antigas foram removidas
   - Tente usar o painel do Supabase diretamente para testar as queries
   - Verifique se o usuário está autenticado (olhe em Authentication → Users)

---

## 🚨 Se Continuar com Erro de Bucket

1. Verifique se o bucket foi criado em **Storage > audio-chapters**
2. Confirme que está marcado como **Public**
3. Teste upload manualmente no painel
4. Se não conseguir, delete e crie novamente
