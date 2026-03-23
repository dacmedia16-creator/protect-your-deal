
## Correção do “Cadê o vídeo?” na Sofia

### Diagnóstico (já confirmado)
- A resposta da Sofia **está vindo com a tag** `[VIDEO:/videos/tutorial-cadastro.mp4]` (confirmado no stream da função de chat).
- O problema está no frontend (`ChatAssistente`): o texto passa por `fixTextSpacing` **antes** da extração de vídeo, e isso quebra `.mp4` para `. mp4`, fazendo a validação falhar.
- Resultado: a tag é removida do texto, mas o vídeo não é adicionado no `message.videos`.

### Mudanças propostas

| Arquivo | Ajuste |
|---|---|
| `src/components/ChatAssistente.tsx` | Corrigir ordem do processamento: extrair vídeo do conteúdo bruto primeiro, aplicar `fixTextSpacing` só no texto final exibido |
| `src/components/ChatAssistente.tsx` | Endurecer parser para aceitar pequenas variações de caminho e normalizar aliases comuns |
| `supabase/functions/chat-assistente/index.ts` | Corrigir paths de Android/iOS no mapeamento para arquivos reais em `/public/videos` |

### Implementação (passo a passo)
1. **Ajustar pipeline no typing effect**
   - Em vez de:
     - `fixTextSpacing(raw)` → `processMessageWithImages(...)`
   - Fazer:
     - `processMessageWithImages(raw)` (e dentro dele manter fix apenas no texto já limpo).
2. **Fortalecer extração de vídeo**
   - Normalizar caminho extraído (`trim`, remover espaços inválidos antes de extensão, garantir prefixo `/videos/` quando possível).
   - Manter fallback para caminho “solto” no texto.
3. **Corrigir mapeamento da Sofia para nomes reais**
   - Trocar:
     - `/videos/tutorial-android.mp4` → `/videos/tutorial-instalar-android.mp4`
     - `/videos/tutorial-ios.mp4` → `/videos/tutorial-instalar-ios.mp4`
   - Manter os demais paths já corretos.
4. **Teste manual focado**
   - Perguntar:
     - “como fazer o cadastro?”
     - “como instalar no android?”
     - “como instalar no iphone?”
   - Verificar:
     - player inline aparece no balão,
     - tag `[VIDEO:...]` não aparece em texto,
     - vídeo carrega e dá play normalmente.

### Resultado esperado
- A Sofia volta a mostrar vídeo inline consistentemente.
- Sem depender só do prompt: parsing mais resiliente no frontend.
- Android/iOS deixam de quebrar por nome de arquivo incorreto.
