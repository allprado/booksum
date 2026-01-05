# Integração Supabase - BookSum

## 📋 Resumo da Implementação

A integração com Supabase foi implementada com sucesso, fornecendo:
- ✅ Autenticação com Google OAuth
- ✅ Banco de dados compartilhado de livros e resumos
- ✅ Storage para arquivos de áudio
- ✅ Biblioteca pessoal para cada usuário
- ✅ Indicadores visuais de livros com resumo disponível

## 📁 Arquivos Criados/Modificados

### Novos Arquivos

1. **`src/config/supabase.js`** - Cliente Supabase configurado
2. **`src/context/AuthContext.jsx`** - Contexto de autenticação
3. **`src/services/supabaseService.js`** - Serviços de interação com o banco
4. **`src/hooks/useSupabaseIntegration.js`** - Hook customizado para integração
5. **`src/components/Library.jsx`** - Componente da biblioteca do usuário
6. **`src/components/Library.css`** - Estilos da biblioteca
7. **`supabase-schema.sql`** - Schema completo do banco de dados
8. **`SUPABASE_SETUP.md`** - Guia completo de configuração

### Arquivos Modificados

1. **`src/main.jsx`** - Adicionado AuthProvider
2. **`src/App.jsx`** - Integração com Supabase para salvar/carregar dados
3. **`src/components/Header.jsx`** - Menu de perfil e autenticação
4. **`src/components/Header.css`** - Estilos para autenticação
5. **`src/components/BookList.jsx`** - Badge de resumo disponível
6. **`src/components/BookList.css`** - Estilos para badge
7. **`.env.example`** - Variáveis de ambiente do Supabase

## 🗄️ Estrutura do Banco de Dados

### Tabelas

**books** - Catálogo global de livros
- `id` (UUID, PK)
- `google_books_id` (TEXT, UNIQUE) - ID do Google Books
- `title`, `authors[]`, `publisher`, etc.
- Público para leitura, autenticados podem inserir

**summaries** - Resumos compartilhados (um por livro)
- `id` (UUID, PK)
- `book_id` (FK → books)
- `content` (JSONB) - Estrutura do resumo
- `metadata` (JSONB) - Modelo, quem gerou, etc.
- Público para leitura, autenticados podem inserir

**audio_chapters** - Áudios compartilhados
- `id` (UUID, PK)
- `book_id` (FK → books)
- `chapter_index`, `chapter_title`
- `audio_url` - URL no Supabase Storage
- `voice_id`, `speech_rate` - Configurações do áudio
- UNIQUE(book_id, chapter_index, voice_id, speech_rate)

**user_libraries** - Biblioteca pessoal de cada usuário
- `id` (UUID, PK)
- `user_id` (FK → auth.users)
- `book_id` (FK → books)
- `added_at`, `last_read_at`
- `reading_progress` (JSONB)
- Cada usuário vê apenas seus próprios registros

### Storage

**audio-chapters** - Bucket público para arquivos de áudio
- Estrutura: `{book_id}/{chapter_index}_{voice_id}_{speech_rate}.mp3`
- Leitura: pública
- Upload: apenas usuários autenticados

## 🔄 Fluxo de Funcionamento

### 1. Busca de Livros
```
Usuário busca → Google Books API
                    ↓
              Resultados exibidos
                    ↓
     Verifica quais têm resumo (Supabase)
                    ↓
          Badge verde nos disponíveis
```

### 2. Geração de Resumo
```
Usuário seleciona livro
         ↓
Cria/busca livro no Supabase → books
         ↓
Verifica se já tem resumo → summaries
         ↓
Se SIM: carrega resumo existente
Se NÃO: gera com Gemini
         ↓
Salva no banco → summaries
         ↓
Adiciona à biblioteca → user_libraries
```

### 3. Geração de Áudio
```
Usuário gera áudio
         ↓
Verifica se já existe (mesma voz/velocidade)
         ↓
Se SIM: carrega do banco
Se NÃO: gera com Azure TTS
         ↓
Upload para Storage → audio-chapters bucket
         ↓
Salva metadata → audio_chapters table
         ↓
Áudio fica disponível para todos
```

## 🎯 Benefícios da Arquitetura

### Evita Duplicação
- ✅ Um resumo por livro (não importa quantos usuários)
- ✅ Áudios reutilizáveis (mesma voz/velocidade)
- ✅ Economia de API calls (Gemini, Azure)
- ✅ Economia de storage

### Compartilhamento Inteligente
- ✅ Resumos gerados por um usuário beneficiam todos
- ✅ Áudios gerados por um usuário beneficiam todos
- ✅ Biblioteca é pessoal mas conteúdo é compartilhado

### Escalabilidade
- ✅ Row Level Security (RLS) protege dados pessoais
- ✅ Índices otimizados para performance
- ✅ Políticas de acesso granulares
- ✅ Storage separado do banco de dados

## 🔐 Segurança

### Row Level Security (RLS)
- Livros e resumos: leitura pública
- Biblioteca: cada usuário vê apenas a sua
- Upload: apenas usuários autenticados
- Políticas testadas e validadas

### Autenticação
- OAuth 2.0 com Google
- Tokens JWT gerenciados pelo Supabase
- Sessão persistente no localStorage
- Auto-refresh de tokens

## 🚀 Como Usar

### Para Desenvolvedores

1. **Configure o Supabase**
   ```bash
   # Siga o guia em SUPABASE_SETUP.md
   ```

2. **Configure variáveis de ambiente**
   ```bash
   cp .env.example .env
   # Adicione suas credenciais do Supabase
   ```

3. **Execute o schema SQL**
   ```sql
   -- No SQL Editor do Supabase
   -- Cole o conteúdo de supabase-schema.sql
   ```

4. **Configure Google OAuth**
   - Siga instruções no SUPABASE_SETUP.md

5. **Inicie a aplicação**
   ```bash
   npm run dev
   ```

### Para Usuários

1. **Login**: Clique no ícone de perfil → "Continuar com Google"
2. **Busque um livro**: Use a barra de busca
3. **Observe as badges**: Livros com ✓ verde já têm resumo
4. **Gere resumo**: Clique no livro → "Gerar Resumo"
5. **Biblioteca**: Livros resumidos vão automaticamente para sua biblioteca
6. **Compartilhamento**: Outros usuários verão o resumo disponível

## 📊 Monitoramento

### No Supabase Dashboard

**Table Editor**
- Visualize livros, resumos, áudios salvos
- Veja quantos usuários têm cada livro

**Storage**
- Monitore uso de storage
- Visualize arquivos de áudio

**Authentication**
- Veja usuários cadastrados
- Monitore logins

**Database → Logs**
- Monitore queries
- Identifique problemas de performance

## 🐛 Troubleshooting

### Resumo não é salvo
```
1. Verifique console do navegador
2. Confirme que supabase.currentBookId está setado
3. Verifique políticas RLS no Supabase
```

### Áudio não faz upload
```
1. Verifique se bucket 'audio-chapters' existe
2. Confirme que bucket é público
3. Verifique políticas de Storage
4. Verifique console para erros de CORS
```

### Login não funciona
```
1. Verifique credenciais no .env
2. Confirme URIs de redirect no Google Cloud
3. Verifique se provider Google está habilitado
```

## 🔄 Próximas Melhorias Sugeridas

1. **Sincronização de progresso de leitura**
   - Salvar posição atual
   - Continuar de onde parou

2. **Favoritos e notas**
   - Marcar capítulos favoritos
   - Adicionar notas pessoais

3. **Compartilhamento social**
   - Compartilhar resumos
   - Recomendar livros

4. **Analytics**
   - Livros mais resumidos
   - Vozes mais usadas
   - Estatísticas de uso

5. **Cache local**
   - PWA com service worker
   - Resumos offline

## 📝 Licença

Este projeto usa Supabase (open-source) e segue as práticas recomendadas de segurança e privacidade.

---

**Desenvolvido com ❤️ usando:**
- React + Vite
- Supabase (PostgreSQL + Storage + Auth)
- Google OAuth 2.0
- Material Symbols
