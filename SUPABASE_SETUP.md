# Configuração do Supabase para BookSum

Este guia explica como configurar o Supabase para autenticação e persistência de dados no BookSum.

## 1. Criar Projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Crie uma nova conta ou faça login
3. Clique em "New Project"
4. Preencha:
   - Nome do projeto: `booksum`
   - Senha do banco de dados (guarde esta senha)
   - Região: escolha a mais próxima de você
5. Aguarde a criação do projeto (alguns minutos)

## 2. Configurar o Banco de Dados

1. No dashboard do Supabase, vá para **SQL Editor**
2. Clique em "New Query"
3. Cole todo o conteúdo do arquivo `supabase-schema.sql` deste repositório
4. Clique em "Run" para executar o script
5. Verifique se as tabelas foram criadas em **Table Editor**

## 3. Configurar Storage para Áudios

1. No dashboard, vá para **Storage**
2. Clique em "Create bucket"
3. Configure:
   - Nome: `audio-chapters`
   - Public bucket: **Sim** (marque a opção)
4. Clique em "Create bucket"

### Configurar Políticas de Storage

1. Clique no bucket `audio-chapters`
2. Vá para a aba "Policies"
3. Clique em "New Policy" e configure:

**Política 1 - Leitura Pública:**
```sql
CREATE POLICY "Public read access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'audio-chapters');
```

**Política 2 - Upload Autenticado:**
```sql
CREATE POLICY "Authenticated upload" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'audio-chapters' 
  AND auth.role() = 'authenticated'
);
```

## 4. Configurar Autenticação com Google

1. No dashboard do Supabase, vá para **Authentication** > **Providers**
2. Encontre "Google" na lista e clique em "Enable"
3. Você precisará criar um projeto no Google Cloud Console:

### Criar Credenciais no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto ou selecione um existente
3. Vá para **APIs & Services** > **Credentials**
4. Clique em "Create Credentials" > "OAuth 2.0 Client ID"
5. Se solicitado, configure a tela de consentimento OAuth:
   - Tipo: External
   - Nome do app: BookSum
   - Email de suporte: seu email
   - Domínio autorizado: seu domínio de produção
6. Tipo de aplicativo: "Web application"
7. Adicione os URIs de redirecionamento autorizados:
   - Para desenvolvimento: `http://localhost:5173`
   - URL do Supabase (copie do Supabase): `https://<seu-projeto>.supabase.co/auth/v1/callback`
8. Clique em "Create"
9. Copie o **Client ID** e **Client Secret**

### Configurar no Supabase

1. Volte ao Supabase, na página do Provider Google
2. Cole o **Client ID** e **Client Secret** do Google
3. Clique em "Save"

## 5. Obter Credenciais do Supabase

1. No dashboard do Supabase, vá para **Settings** > **API**
2. Copie os seguintes valores:
   - **Project URL**: `https://<seu-projeto>.supabase.co`
   - **anon public**: a chave pública (anon key)

## 6. Configurar Variáveis de Ambiente

1. Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

2. Edite o arquivo `.env` e adicione suas credenciais:
```env
# Supabase
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Suas outras APIs (Google Gemini, Azure, etc.)
VITE_GOOGLE_API_KEY=sua_chave_google_aqui
VITE_AZURE_SPEECH_KEY=sua_chave_azure_aqui
VITE_AZURE_SPEECH_REGION=sua_regiao_azure_aqui
```

## 7. Testar a Integração

1. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

2. Acesse a aplicação no navegador
3. Clique no ícone de perfil no cabeçalho
4. Clique em "Continuar com Google"
5. Faça login com sua conta Google
6. Verifique se o avatar e nome aparecem no cabeçalho

## 8. Verificar Funcionamento

### Testar Autenticação
- [ ] Login com Google funciona
- [ ] Avatar e nome aparecem no cabeçalho
- [ ] Logout funciona

### Testar Resumos
- [ ] Ao gerar um resumo, ele é salvo no banco
- [ ] Livros com resumo aparecem com badge verde nos resultados
- [ ] Resumos são compartilhados entre usuários

### Testar Áudios
- [ ] Ao gerar áudio, ele é salvo no Storage
- [ ] Áudios são compartilhados entre usuários
- [ ] Diferentes vozes/velocidades são armazenadas separadamente

### Testar Biblioteca
- [ ] Livros são adicionados à biblioteca do usuário
- [ ] Biblioteca é pessoal (cada usuário vê apenas seus livros)

## Funcionalidades Implementadas

### 🔐 Autenticação
- Login com Google OAuth
- Sessão persistente
- Logout seguro
- Avatar e nome do usuário no cabeçalho

### 📚 Banco de Dados Compartilhado
- **Livros**: Catálogo global de livros
- **Resumos**: Um resumo por livro, compartilhado entre todos
- **Áudios**: Áudios compartilhados (por voz e velocidade)
- **Biblioteca**: Cada usuário tem sua biblioteca pessoal

### 🏷️ Indicadores Visuais
- Badge verde em livros que já têm resumo
- Resumos pré-carregados quando disponíveis

### 💾 Persistência Inteligente
- Evita duplicação de resumos
- Evita duplicação de áudios
- Upload automático para Supabase Storage
- Reutilização de conteúdo entre usuários

## Estrutura do Banco de Dados

```
┌──────────────┐
│    books     │  ← Catálogo global de livros
└──────┬───────┘
       │
       ├──────────────────┐
       │                  │
┌──────▼───────┐  ┌───────▼──────────┐
│  summaries   │  │ audio_chapters  │  ← Conteúdo compartilhado
└──────────────┘  └──────────────────┘
       │
┌──────▼────────────┐
│ user_libraries   │  ← Biblioteca pessoal de cada usuário
└───────────────────┘
```

## Troubleshooting

### Erro: "Supabase credentials not found"
- Verifique se o arquivo `.env` existe
- Verifique se as variáveis começam com `VITE_`
- Reinicie o servidor de desenvolvimento

### Erro ao fazer login com Google
- Verifique se adicionou todos os URIs de redirecionamento
- Verifique se o Client ID e Secret estão corretos
- Verifique se o domínio está autorizado no Google Cloud Console

### Áudios não aparecem
- Verifique se o bucket `audio-chapters` é público
- Verifique se as políticas de Storage estão configuradas
- Verifique no Storage se os arquivos foram enviados

### Resumos não são salvos
- Verifique se as tabelas foram criadas corretamente
- Verifique as políticas RLS (Row Level Security)
- Verifique o console do navegador para erros

## Suporte

Para mais informações:
- [Documentação do Supabase](https://supabase.com/docs)
- [Guia de Autenticação](https://supabase.com/docs/guides/auth)
- [Guia de Storage](https://supabase.com/docs/guides/storage)
