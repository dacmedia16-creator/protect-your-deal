

## Embutir vídeos diretamente no chat da Sofia

### Ideia

Em vez de Sofia enviar apenas um link de texto, ela pode incluir uma tag especial na resposta (ex: `[video:/videos/tutorial-cadastro.mp4]`) que o frontend intercepta e renderiza como um `<video>` player inline dentro do balão de chat.

### Como funciona

1. **System Prompt** — Instruir Sofia a usar a sintaxe `[video:/videos/tutorial-cadastro.mp4]` quando quiser enviar um vídeo, junto com o texto explicativo.

2. **Renderização no chat** — No componente `ChatAssistente.tsx`, antes de passar o conteúdo para `ReactMarkdown`, detectar padrões `[video:...]`, extrair os caminhos dos vídeos, e renderizar um `<video>` player compacto abaixo do texto.

### Mudanças

| Arquivo | O que fazer |
|---------|------------|
| `supabase/functions/chat-assistente/index.ts` | Atualizar o mapeamento de vídeos no SYSTEM_PROMPT para usar a sintaxe `[video:/videos/arquivo.mp4]` em vez de links de âncora |
| `src/components/ChatAssistente.tsx` | Adicionar função que extrai `[video:...]` do conteúdo, remove do texto, e renderiza `<video>` inline no balão da mensagem |

### Mapeamento atualizado no System Prompt

```
Mapeamento de assuntos → vídeos:
- Cadastro → [video:/videos/tutorial-cadastro.mp4]
- Android → [video:/videos/tutorial-android.mp4]
- iOS → [video:/videos/tutorial-ios.mp4]
- Visão geral → [video:/videos/tutorial-visao-geral.mp4]
- Criar ficha → [video:/videos/tutorial-primeira-ficha.mp4]
- Parceiro → [video:/videos/tutorial-assinatura-parceiro.mp4]
- Pesquisa → [video:/videos/tutorial-pesquisa-cliente.mp4]
```

### Renderização no chat

O vídeo aparece como um player compacto (arredondado, com controles) dentro do balão da Sofia, logo abaixo do texto explicativo. Tamanho máximo limitado à largura do balão (~85% do chat).

### Observação

Os vídeos são servidos de `/public/videos/` que já estão no projeto. O player usa `preload="metadata"` para não carregar o vídeo inteiro até o usuário dar play.

