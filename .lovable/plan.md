

## Usar imagem como capa do vídeo iOS

### Mudanças

| Arquivo | O que fazer |
|---------|------------|
| Copiar imagem | `user-uploads://image-276.png` → `public/videos/poster-ios.png` |
| `src/pages/InstalarApp.tsx` | Adicionar `poster="/videos/poster-ios.png"` ao `<video>` do iOS (linha 239) |

### Detalhes

Adicionar o atributo `poster` ao elemento `<video>` do tutorial iOS para exibir a imagem enviada como thumbnail antes do play:

```tsx
<video
  src="/videos/instalando-app-ios.mp4"
  poster="/videos/poster-ios.png"
  controls
  playsInline
  preload="metadata"
  className="w-full rounded-xl"
/>
```

