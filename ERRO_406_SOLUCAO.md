# 🔴 Erro 406 Persistindo - Solução Definitiva

## O que está acontecendo?

Mesmo após aplicar o SQL de correção, o erro 406 continua. Isso significa que as políticas RLS estão ainda conflitando ou não foram aplicadas corretamente.

## ✅ Solução em 3 passos

### Passo 1: Executar o SQL Mais Agressivo

1. Abra https://app.supabase.com/ → Seu Projeto
2. Vá em **SQL Editor**
3. **Copie TODO** o conteúdo de `supabase-fix-rls-agressivo.sql` (na raiz do projeto)
4. Cole no editor
5. Clique em **Execute** ou aperte **Ctrl+Enter**

⚠️ Este SQL é mais agressivo:
- ❌ Desabilita RLS em todas as tabelas
- 🗑️ Remove TODAS as políticas antigas
- ✅ Reabilita RLS
- ✅ Cria novas políticas simples e funcionais

### Passo 2: Verificar Políticas

Após executar com sucesso:

1. Vá em **Authentication** (lado esquerdo)
2. Clique em **Policies**
3. Verifique se você vê:
   - ✅ `books_read_all` (books)
   - ✅ `summaries_read_all` (summaries)
   - ✅ `audio_chapters_read_all` (audio_chapters)
   - ✅ `user_libraries_read_own` (user_libraries)
   - (+ as políticas de INSERT, UPDATE, DELETE)

### Passo 3: Testar

Volte para o BookSum e tente clicar em "Ler" novamente. O erro deve desaparecer! 🎉

---

## Se Continuar Dando Erro?

Se mesmo após isso continuar com erro 406, pode ser um problema diferente:

### Opção A: Desabilitar RLS Completamente (apenas para teste)

Execute este SQL no SQL Editor:

```sql
ALTER TABLE books DISABLE ROW LEVEL SECURITY;
ALTER TABLE summaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE audio_chapters DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_libraries DISABLE ROW LEVEL SECURITY;
```

Se o erro desaparecer, o problema é definitivamente RLS. Volte a executar `supabase-fix-rls-agressivo.sql`.

### Opção B: Verificar Erros de SQL

Se ao executar aparecer erro como "duplicate policy", significa que a limpeza não funcionou. Nesse caso:

1. Vá em **Authentication > Policies**
2. Delete TODAS as políticas manualmente (clique no X de cada uma)
3. Depois execute novamente o SQL agressivo

### Opção C: Contatar Suporte Supabase

Se nada funcionar, pode haver um problema com a conta/projeto. Contate o suporte do Supabase.

---

## 📊 O que as Políticas Fazem

| Tabela | Leitura | Inserção | Quem? |
|--------|---------|----------|-------|
| **books** | ✅ Pública | ✅ Autenticados | Todos leem, autenticados escrevem |
| **summaries** | ✅ Pública | ✅ Autenticados | Todos leem, autenticados escrevem |
| **audio_chapters** | ✅ Pública | ✅ Autenticados | Todos leem, autenticados escrevem |
| **user_libraries** | ✅ Só seu próprio | ✅ Só seu próprio | Privado por usuário |

Isso permite que qualquer pessoa (até anônima) veja os livros e resumos, mas apenas usuários autenticados possam adicionar à biblioteca.
