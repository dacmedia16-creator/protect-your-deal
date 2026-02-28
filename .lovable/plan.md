

## Causa da Falha

Os logs da edge function mostram claramente o problema:

```
Action: send-text, Phone: 15998459830, Channel: meta2
Sending text message to +5515998459830 via ZionTalk Meta 2 (API Oficial)
Send message response status: 500
Send message response: Failed to send the message
```

O código do `AdminWhatsApp.tsx` **não especifica o `channel`** no body da requisição (linha 176-181). Quando o canal não é informado, a edge function busca o canal padrão no banco (`configuracoes_sistema.whatsapp_channel_padrao`), que está configurado como **`meta2`** -- e esse canal está falhando com erro 500.

A correção é simples: forçar `channel: 'default'` no body da requisição, como combinado ("usar o canal padrão").

## Correção

**Arquivo**: `src/pages/admin/AdminWhatsApp.tsx`

Adicionar `channel: 'default'` no body do `supabase.functions.invoke`:

```typescript
body: {
  action: 'send-text',
  phone: user.telefone,
  message: personalizedMessage,
  channel: 'default',  // forçar canal default (ZionTalk texto livre)
},
```

Apenas essa linha resolve o problema.

