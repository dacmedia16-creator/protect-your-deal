

## Adicionar card do vídeo "Visão Geral do APP" na página Tutoriais

O vídeo `tutorial-visao-geral.mp4` já existe em `public/videos/`, mas o card correspondente não foi incluído no código de `Tutoriais.tsx`.

### Mudança

| Arquivo | O que fazer |
|---------|------------|
| `src/pages/Tutoriais.tsx` | Adicionar card de vídeo "🎯 Visão Geral do APP" como primeiro item do grid (antes do Android), apontando para `/videos/tutorial-visao-geral.mp4` |

O grid ficará com 4 itens: Visão Geral, Android, iOS, Placeholder.

