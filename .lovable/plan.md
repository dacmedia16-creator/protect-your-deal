

## Adicionar capa personalizada ao vídeo iOS na página Tutoriais

### Mudanças

| Arquivo | O que fazer |
|---------|------------|
| Copiar imagem | `user-uploads://image-277.png` → `public/videos/poster-tutorial-ios.png` |
| `src/pages/Tutoriais.tsx` | Adicionar `poster="/videos/poster-tutorial-ios.png"` ao `<video>` do tutorial iOS (linha ~68) |

