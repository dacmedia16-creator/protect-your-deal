

## Adicionar vídeo tutorial iOS na página Instalar App

### Mudanças

| Arquivo | O que fazer |
|---------|------------|
| Copiar vídeo | `user-uploads://Instalando_Visita_Prova_IOS.mp4` → `public/videos/instalando-app-ios.mp4` |
| `src/pages/InstalarApp.tsx` | Adicionar segundo card de vídeo para iOS logo após o card Android (linha 230) |

### Detalhes

Inserir após o card Android um novo card idêntico com:
- Título: `🎬 Veja como instalar — Versão iOS (iPhone)`
- `<video src="/videos/instalando-app-ios.mp4" controls playsInline preload="metadata" className="w-full rounded-xl" />`

