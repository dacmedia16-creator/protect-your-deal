

# Diagnóstico: ZionTalk ignora anexo no `/send_message/`

## Problema

Tanto `file` quanto `media_file` resultaram em status 201 com resposta vazia — a API aceita silenciosamente mas **não entrega a mídia**. Isso indica que o endpoint `/send_message/` do ZionTalk **não suporta upload de arquivo**. APIs similares (como a do ChatWoot/WPPConnect) usam um endpoint separado para mídia.

## Solução proposta

Usar um endpoint separado para enviar mídia. O padrão mais comum em APIs similares ao ZionTalk é `/send_file_message/`. A lógica será:

### `supabase/functions/send-whatsapp/index.ts`

No case `send-text`, quando houver `mediaBase64`:

1. **Usar endpoint diferente**: `${ZIONTALK_API_URL}/send_file_message/` em vez de `/send_message/`
2. **Manter o campo como `file`** (nome padrão para FormData em APIs de upload)
3. **Enviar a legenda no campo `msg`** (mensagem de texto acompanha a mídia)
4. **Adicionar log do response headers** para diagnóstico caso ainda falhe — isso mostrará se o endpoint existe ou retorna 404
5. **Fallback**: se o endpoint retornar 404/405, tentar envio em duas etapas (mídia separada + texto separado)

### Mudança principal

```typescript
// Escolher endpoint baseado em presença de mídia
const url = mediaBase64 
  ? `${ZIONTALK_API_URL}/send_file_message/`
  : `${ZIONTALK_API_URL}/send_message/`;

// Campo volta a ser 'file' (padrão de upload)
formData.append('file', blob, fname);
```

### Diagnóstico extra

Logar response headers e status para que, se o endpoint também não funcionar, possamos identificar o correto rapidamente.

## Escopo
- 1 arquivo alterado (edge function)
- Redeploy automático
- Se `/send_file_message/` não funcionar, os logs revelarão o status correto para tentarmos outro endpoint

