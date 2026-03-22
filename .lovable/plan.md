

## Adicionar lazy loading nos vídeos da página de Tutoriais

Usar Intersection Observer para renderizar os `<video>` apenas quando o card fica visível na tela, evitando que o navegador carregue metadata de todos os vídeos simultaneamente.

### Mudanças

| Arquivo | O que fazer |
|---------|------------|
| `src/pages/Tutoriais.tsx` | Criar componente interno `LazyVideo` que usa `useScrollAnimation` (já existente) para renderizar o `<video>` somente quando visível; substituir todos os `<video>` por `<LazyVideo>` |

### Detalhes técnicos

- Reutilizar o hook `useScrollAnimation` com `rootMargin: '200px'` (pré-carrega um pouco antes de ficar visível)
- Enquanto não visível, exibir um placeholder com `Skeleton` e ícone de play
- Quando visível, renderizar o `<video>` com `preload="metadata"`

