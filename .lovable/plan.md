

## Plano: Ocultar vídeo da página Como Funciona

Remover a seção de vídeo demo da página `src/pages/ComoFunciona.tsx`, incluindo o componente `LazyVideo`, o import do thumbnail e os imports não utilizados (`Skeleton`, `useScrollAnimation`, `PlayCircle`).

### Alteração

**`src/pages/ComoFunciona.tsx`**:
- Remover o componente `LazyVideo` (linhas 19-30)
- Remover o bloco `AnimatedSection` do vídeo (linhas 80-82)
- Remover imports não utilizados: `Skeleton`, `useScrollAnimation`, `videoThumbnail`, `PlayCircle`

