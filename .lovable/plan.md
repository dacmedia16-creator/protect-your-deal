

## Adicionar índice clicável na página Tutoriais

### Mudança

| Arquivo | O que fazer |
|---------|------------|
| `src/pages/Tutoriais.tsx` | 1. Adicionar `id` a cada card de vídeo (ex: `id="android"`, `id="ios"`, etc.) |
| | 2. Inserir lista de links clicáveis entre o título e o grid, usando `<a href="#android">` com `scroll-behavior: smooth` |

O índice será uma lista vertical centralizada com os 6 títulos dos tutoriais. Ao clicar, a página rola suavemente até o vídeo correspondente. Estilo: links com ícone de número ou bullet, fonte `text-sm`, cor `text-primary`, hover underline.

