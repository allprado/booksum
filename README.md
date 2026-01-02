# BookSum - Resumos de Livros em Áudio 📚🎧

Uma aplicação web moderna no estilo Blinkist para gerar resumos de livros em texto e áudio, com integração a IA.

![BookSum Preview](https://via.placeholder.com/800x400/7c3aed/ffffff?text=BookSum)

## ✨ Funcionalidades

- 🔍 **Busca de Livros**: Integração com Google Books API para buscar livros em português
- 🤖 **Resumos com IA**: Geração automática de resumos usando OpenRouter (modelo xiaomi/mimo-vl-7b-free)
- 🎙️ **Áudio com IA**: Conversão de texto para áudio natural com Microsoft Azure Speech Service
- 📖 **Modo Leitura**: Interface otimizada para leitura com temas e controle de fonte
- 🎵 **Player Customizado**: Player de áudio com visualizador, velocidade variável e controles completos
- 📱 **Mobile-First**: Design otimizado para dispositivos móveis

## 🚀 Como Usar

### 1. Pré-requisitos

- Node.js 18+ instalado
- Conta no [OpenRouter](https://openrouter.ai/) para obter a API key
- Conta no [Azure Portal](https://portal.azure.com/) com Speech Service criado

### 2. Configuração

1. Clone ou baixe o projeto
2. Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

3. Edite o arquivo `.env` e adicione suas chaves de API:

```env
VITE_OPENROUTER_API_KEY=sua_chave_openrouter_aqui
VITE_AZURE_SPEECH_KEY=sua_chave_azure_aqui
VITE_AZURE_SPEECH_REGION=brazilsouth
```

### 3. Instalação

```bash
npm install
```

### 4. Executar em Desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:5173` no navegador.

### 5. Build para Produção

```bash
npm run build
```

## 🎨 Design

- **Cores**: Tema escuro com gradientes roxo (#7c3aed) e dourado (#f59e0b)
- **Tipografia**: Inter (sans-serif) + Playfair Display (serif)
- **Efeitos**: Glassmorphism, animações suaves, micro-interações
- **Layout**: Mobile-first, responsivo

## 📋 Estrutura do Projeto

```
BookSum/
├── public/
│   └── vite.svg          # Favicon
├── src/
│   ├── components/
│   │   ├── Header.jsx/.css
│   │   ├── SearchBar.jsx/.css
│   │   ├── BookList.jsx/.css
│   │   ├── BookDetail.jsx/.css
│   │   ├── SummaryView.jsx/.css
│   │   ├── AudioPlayer.jsx/.css
│   │   ├── ReadingMode.jsx/.css
│   │   └── Toast.jsx/.css
│   ├── App.jsx/.css
│   ├── main.jsx
│   └── index.css         # Design System
├── index.html
├── .env.example
└── package.json
```

## 🔑 APIs Utilizadas

### Google Books API
- Busca gratuita de livros
- Não requer autenticação
- Limite: livros em português (langRestrict=pt)

### OpenRouter API
- Modelo: `xiaomi/mimo-vl-7b-free` (gratuito)
- Geração de resumos detalhados (~25.000 caracteres)
- [Documentação](https://openrouter.ai/docs)

### Microsoft Azure Speech Service
- Voz: pt-BR-FranciscaNeural (Neural, Feminina)
- Formato: MP3 (128kbps)
- [Documentação](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/)

## 📱 Recursos Mobile

- Safe area insets para notch/home indicator
- Touch-friendly (botões 44px+)
- Scroll suave nativo
- Sem zoom indesejado

## ⚠️ Limitações

- Resumos são gerados com base no conhecimento da IA sobre o livro
- Áudio limitado a ~25.000 caracteres (~20 minutos)
- Azure Speech tem custos após o free tier (500k caracteres/mês gratuitos)

## 📄 Licença

MIT License - Sinta-se livre para usar e modificar!

---

Feito com ❤️ usando React + Vite
