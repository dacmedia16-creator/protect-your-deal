

## Adicionar vídeo tutorial na página Instalar App

### Mudanças

| Arquivo | O que fazer |
|---------|------------|
| Copiar vídeo | Copiar `user-uploads://Instalando_Visita_Prova_em_pe2.mp4` para `public/videos/instalando-app.mp4` |
| `src/pages/InstalarApp.tsx` | Adicionar seção de vídeo entre o grid de benefícios (linha ~214) e o botão de instalação automática, com um `<video>` responsivo com controls, poster e bordas arredondadas |

### Detalhes

Inserir após o grid de benefícios (~linha 214) um card com:
- Título "Veja como instalar"
- Elemento `<video>` com `controls`, `playsInline`, `preload="metadata"`, apontando para `/videos/instalando-app.mp4`
- Estilo: `rounded-xl`, `w-full`, dentro de um `Card` com padding

