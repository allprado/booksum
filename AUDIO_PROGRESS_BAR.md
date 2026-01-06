# Barra de Progresso de Áudio no Miniplayer

## ✨ Funcionalidades Implementadas

Uma nova barra de progresso interativa foi adicionada ao miniplayer de áudio, permitindo que o leitor:

### 1. **Visualizar Progresso do Áudio**
- Barra visual que mostra o tempo atual vs duração total
- Gradiente de cores (primária para accent) para melhor visualização
- Atualização em tempo real conforme o áudio é reproduzido

### 2. **Navegar pelo Áudio com Click**
- Clicar em qualquer ponto da barra para pular para aquele momento
- Suporta tanto cliques simples quanto interações com toque
- Feedback visual imediato

### 3. **Arrastar para Navegar (Drag)**
- Arrastar a thumb (indicador circular) da barra para avançar/retroceder
- Funciona com mouse e toque (touch)
- Atualização suave do tempo enquanto arrasta
- Thumb cresce ao interagir para melhor feedback visual

## 🎨 Design

### Visual
- **Altura padrão**: 6px
- **Altura ao hover**: 8px
- **Thumb**: Círculo branco de 14px (16px no hover, 18px ao arrastar)
- **Gradiente**: De cor primária a accent
- **Animações suaves**: Transições de 0.05s para o preenchimento

### Acessibilidade
- Role de "slider"
- Aria labels para leitura por screen readers
- Valores de min, max e current aria
- Suporte a teclado (através de eventos padrão)

## 🔧 Implementação Técnica

### Estados Adicionados
- `isDraggingAudioBar`: Controla se o usuário está arrastando a barra

### Hooks e Refs
- `progressBarRef`: Referência para o elemento da barra de progresso
- `useEffect`: Gerencia eventos de mouse (move e up) durante o drag

### Funções
- `handleAudioProgressBarClick()`: Processa cliques na barra
- `handleAudioProgressBarMouseDown()`: Inicia o drag
- Event listeners para `mousemove` e `mouseup` durante o drag

### Touch Support
- Evento `onTouchStart` para iniciar drag em dispositivos móveis
- Cálculo de posição relativa do toque na barra

## 📱 Responsividade

A barra se adapta em dispositivos menores:
- Mantém a mesma funcionalidade em mobile
- Touch events funcionam nativamente
- Thumb maior melhora usabilidade em telas pequenas

## 🚀 Como Usar

1. Abrir um livro em modo de leitura
2. Abrir o miniplayer clicando no botão de áudio/capítulo
3. Você verá a barra de progresso logo abaixo dos controles de play/pausa
4. **Click**: Clique em qualquer ponto para pular
5. **Drag**: Arraste o indicador circular para navegar suavemente

## 📝 Exemplos de Uso

### Ativar Reprodução e Navegar
```
1. Clique no botão Play (▶)
2. Clique na barra para pular para 50% do áudio
3. Arraste para frente ou trás para ajuste fino
```

### Mobile
```
1. Toque no botão Play
2. Deslize pelo áudio tocando e arrastando
```

## 🎯 Melhorias Futuras

Possíveis extensões:
- [ ] Mostrar tempo ao pairar sobre pontos da barra (tooltip)
- [ ] Velocidade de reprodução ajustável
- [ ] Marcadores para capítulos na barra
- [ ] Atalhos de teclado (seta esquerda/direita para retroceder/avançar 10s)

## 📦 Arquivos Modificados

- `src/components/ReadingMode.jsx`: Lógica de interação
- `src/components/ReadingMode.css`: Estilos da barra
