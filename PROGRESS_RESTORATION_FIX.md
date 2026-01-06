# 🔧 Correção: Registro de Progresso de Leitura

## ❌ Problema Identificado

O progresso de leitura não estava sendo restaurado ao reabrir um livro. O fluxo era:

```
1. Usuário abre livro da biblioteca
2. Lê até uma certa posição (ex: 45% do texto, capítulo 3)
3. Fecha o livro
4. Reabre o livro da biblioteca
5. ❌ Livro volta ao início (0%, capítulo 0)
```

### Causa Raiz

Embora o `reading_progress` fosse salvo no Supabase a cada 10 segundos, **não havia código para restaurar esse progresso** ao abrir o livro novamente.

O fluxo de salvamento existia:
- `ReadingMode.jsx` → `useEffect` salvava `{ scrollProgress, currentChapter }` a cada 10s
- Dados eram enviados para `App.jsx` via `onUpdateProgress()`
- `App.jsx` chamava `supabase.updateReadingProgress()`
- Supabase salvava em `user_libraries.reading_progress`

Mas o **fluxo de restauração estava faltando completamente**:
- Quando abrisse livro da biblioteca, o progresso não era carregado
- `ReadingMode.jsx` iniciava com `progress = 0` e `currentChapter = 0`
- Sem usar os dados salvos em `reading_progress`

## ✅ Solução Implementada

### 1. **Passar Progresso da Biblioteca para o Componente** 
   - **Arquivo**: `src/components/Library.jsx`
   - Modificar chamada de `onReadSummary()` para incluir `item.reading_progress`
   ```jsx
   onReadSummary(item.id, book, item.reading_progress)
   ```

### 2. **Recepcionar e Armazenar Progresso em App.jsx**
   - **Arquivo**: `src/App.jsx`
   - Adicionar estado: `const [savedProgress, setSavedProgress] = useState(null)`
   - Modificar `handleReadSummaryFromLibrary()` para aceitar e guardar o progresso
   - Passar `savedProgress` para `SummaryView`

### 3. **Passar Progresso para SummaryView**
   - **Arquivo**: `src/components/SummaryView.jsx`
   - Adicionar prop: `savedProgress = null`
   - Passar para `ReadingMode` como `savedProgress={savedProgress}`

### 4. **Restaurar Progresso em ReadingMode**
   - **Arquivo**: `src/components/ReadingMode.jsx`
   - Inicializar com progresso salvo:
     ```jsx
     const [progress, setProgress] = useState(savedProgress?.scrollProgress || 0)
     const [currentChapter, setCurrentChapter] = useState(savedProgress?.currentChapter || 0)
     ```
   - Novo `useEffect` para restaurar scroll/capítulo após capítulos serem extraídos:
     ```jsx
     useEffect(() => {
       if (!contentRef.current || chapters.length === 0 || !savedProgress) return
       
       // Restaurar capítulo e descer até ele
       if (savedProgress.currentChapter && savedProgress.currentChapter > 0) {
         const chapterIndex = Math.min(savedProgress.currentChapter, chapters.length - 1)
         setCurrentChapter(chapterIndex)
         
         const chapter = chapters[chapterIndex]
         if (chapter && chapter.id) {
           const element = document.getElementById(chapter.id)
           if (element) {
             const offsetCompensation = 80
             const targetTop = element.offsetTop - offsetCompensation
             setTimeout(() => {
               contentRef.current?.scrollTo({ top: targetTop, behavior: 'auto' })
             }, 0)
           }
         }
       }
       // Fallback para scroll direto se não tem capítulo
       else if (savedProgress.scrollProgress && savedProgress.scrollProgress > 0) {
         const container = contentRef.current
         if (container) {
           const { scrollHeight, clientHeight } = container
           const scrollPosition = (savedProgress.scrollProgress / 100) * (scrollHeight - clientHeight)
           setTimeout(() => {
             container.scrollTo({ top: scrollPosition, behavior: 'auto' })
           }, 0)
         }
       }
     }, [chapters, savedProgress])
     ```

## 📊 Novo Fluxo

```
1. Usuário abre livro da biblioteca
   ↓
2. Library.jsx passa item.reading_progress para handleReadSummaryFromLibrary()
   ↓
3. App.jsx armazena em setSavedProgress()
   ↓
4. SummaryView recebe savedProgress como prop
   ↓
5. ReadingMode recebe savedProgress como prop
   ↓
6. ReadingMode inicializa com progress e currentChapter salvos
   ↓
7. Após capítulos serem extraídos, useEffect restaura scroll
   ↓
8. ✅ Livro abre no local exato onde foi fechado!
```

## 🧪 Como Testar

1. Abra um livro da biblioteca
2. Leia até uma posição (ex: 50% do conteúdo, capítulo 3)
3. Feche o livro (clique botão voltar)
4. Abra novamente o mesmo livro da biblioteca
5. ✅ O livro deve estar na mesma posição!

## 📁 Arquivos Modificados

1. `src/components/Library.jsx` - Passa `reading_progress` para onReadSummary
2. `src/App.jsx` - Armazena e passa `savedProgress` para SummaryView
3. `src/components/SummaryView.jsx` - Recebe e passa `savedProgress` para ReadingMode
4. `src/components/ReadingMode.jsx` - Restaura progresso inicial e scroll

## 🎯 Próximas Melhorias Opcionais

- [ ] Mostrar indicador visual de "Continuar de onde parou"
- [ ] Restaurar também o timestamp da última leitura visualmente
- [ ] Confirmar se usuário quer continuar ou recomeçar

## ⚠️ Notas

- O `scrollProgress` é restaurado de duas formas:
  1. Preferência: Restaurar ao capítulo específico (mais preciso)
  2. Fallback: Restaurar ao percentual de scroll (menos preciso)
- O comportamento é "auto" (sem animação) para não confundir o usuário
- Usa `setTimeout(0)` para garantir que o DOM está pronto
