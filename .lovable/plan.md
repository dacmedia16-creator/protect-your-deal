

## Corrigir vídeos inline no chat da Sofia

### Problema identificado

O system prompt da edge function `chat-assistente` já contém as instruções com `[VIDEO:/videos/...]`, e o frontend já tem o código para extrair e renderizar os vídeos. Porém os vídeos não aparecem. Possíveis causas:

1. **Edge function não foi re-deployada** - o código atualizado pode não estar em produção
2. **O modelo de IA não segue a sintaxe exatamente** - pode escrever o vídeo como texto em vez de usar `[VIDEO:...]`

### Mudanças

| Arquivo | O que fazer |
|---------|------------|
| Edge function `chat-assistente` | Re-deployar para garantir que o system prompt atualizado está em produção |
| `supabase/functions/chat-assistente/index.ts` | Reforçar a instrução no system prompt, tornando-a mais enfática e repetida (o modelo precisa de ênfase para seguir formatação especial) |
| `src/components/ChatAssistente.tsx` | Tornar o regex de extração mais tolerante (aceitar variações como `[video:...]`, `[Video:...]`, com ou sem espaços) e adicionar fallback para detectar URLs de vídeo em texto puro (ex: `/videos/tutorial-*.mp4`) |

### Detalhes técnicos

**System prompt** - Adicionar no topo das regras de formato (seção mais visível):
```
REGRA CRÍTICA: Quando o assunto corresponder a um tutorial em vídeo, você DEVE incluir a tag [VIDEO:/videos/arquivo.mp4] na sua resposta. Isso faz o vídeo aparecer diretamente no chat!
```

**Frontend fallback** - Além do regex `[VIDEO:...]`, detectar URLs soltas como `/videos/tutorial-*.mp4` no texto e renderizá-las como player:
```typescript
// Fallback: detect bare video paths in text
const bareVideoPattern = /(\/videos\/[\w-]+\.mp4)/gi;
```

**Re-deploy** da edge function para garantir que está em produção.

