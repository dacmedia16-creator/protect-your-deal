

## Adicionar lazy loading no vídeo da página Como Funciona

### Mudança

| Arquivo | O que fazer |
|---------|------------|
| `src/pages/ComoFunciona.tsx` | Importar `useScrollAnimation` e `Skeleton`/`PlayCircle`, criar componente `LazyVideo` local (mesmo padrão de Tutoriais), substituir o `<video>` atual pelo `<LazyVideo>` |

### Detalhes

- Reutilizar o mesmo padrão já implementado em Tutoriais: Intersection Observer com `rootMargin: '200px'`, `triggerOnce: true`
- Placeholder: `Skeleton` com ícone `PlayCircle` centralizado
- Manter `poster={videoThumbnail}`, `controls`, `muted`, `preload="metadata"`

