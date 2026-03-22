

## Adicionar vídeo "Instalando o APP no Android" na página Tutoriais

### Mudanças

| Arquivo | O que fazer |
|---------|------------|
| Copiar vídeo | `user-uploads://Instalando_Visita_Prova_em_pe2-2.mp4` → `public/videos/tutorial-instalar-android.mp4` |
| `src/pages/Tutoriais.tsx` | Substituir o card placeholder por um card com `<video>` do tutorial Android, título "Instalando o App no Android" e manter um segundo card placeholder para futuros vídeos |

### Detalhes

No grid de vídeos, adicionar como primeiro card:
- Título: "📱 Instalando o App no Android"
- `<video src="/videos/tutorial-instalar-android.mp4" controls playsInline preload="metadata" className="w-full rounded-xl" />`
- Manter o card placeholder ao lado para futuros tutoriais

