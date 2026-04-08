

# Mudar `buttonUrlDynamicParams` de `[1]` para `[0]` no template `pesquisa_pos_visita`

## Mudança

### `supabase/functions/verify-otp/index.ts` (linha 352)

**De:**
```typescript
buttonUrlDynamicParams: ['', surveyToken],
```

**Para:**
```typescript
buttonUrlDynamicParams: [surveyToken],
```

Isso envia o `surveyToken` no índice `[0]`, eliminando o parâmetro vazio que pode causar rejeição silenciosa do Meta. O `send-whatsapp` já ignora valores vazios, mas enviar direto no `[0]` é mais limpo e compatível.

## Escopo
- 1 arquivo: `supabase/functions/verify-otp/index.ts`
- 1 linha alterada
- Redeploy automático

