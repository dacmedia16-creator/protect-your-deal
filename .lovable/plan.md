

## Problema

O `AdminUsuarios.tsx` é o único local que chama `send-whatsapp` com `action: 'send-text'` **sem especificar** `channel: 'default'`. Isso faz com que a edge function consulte o banco e use `meta2`, que falha para mensagens de texto.

- `AdminWhatsApp.tsx` - ja tem `channel: 'default'`
- `Integracoes.tsx` - ja tem `channel: 'default'`
- **`AdminUsuarios.tsx` - FALTA `channel: 'default'`**

Opcionalmente, podemos também proteger na edge function `send-whatsapp` para que `action: 'send-text'` sempre force o canal `default`, independente do que vier do frontend.

## Correções

### 1. `src/pages/admin/AdminUsuarios.tsx` (linha ~495-499)
Adicionar `channel: 'default'` no body da chamada `send-whatsapp`:
```typescript
body: {
  action: "send-text",
  phone: createdUser.telefone,
  message,
  channel: 'default',
},
```

### 2. `supabase/functions/send-whatsapp/index.ts` (proteção no servidor)
No case `send-text`, forçar `channel = 'default'` se nenhum canal foi especificado, para que mensagens de texto nunca usem `meta2` (que só suporta templates):
```typescript
case 'send-text': {
  // Meta channels only support templates, force default for text
  const textChannel = (channel === 'meta' || channel === 'meta2') ? 'default' : channel;
  // usar textChannel no resto do bloco
}
```

Isso garante que mesmo se algum lugar esquecer de passar `channel: 'default'`, a edge function nunca tente enviar texto livre pelo canal Meta.

