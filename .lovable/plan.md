

# Enviar pesquisa pós-visita assim que o comprador assinar

## Problema atual
A pesquisa só é disparada quando o status final da ficha é `completo` ou `finalizado_parcial`. Quando o comprador confirma primeiro, o status fica `aguardando_proprietario` — e a pesquisa nunca é enviada.

## Correção

### Arquivo: `supabase/functions/verify-otp/index.ts`

Alterar a condição de disparo (linha ~699) de:

```typescript
if (otp.tipo === 'comprador' && (newStatus === 'completo' || newStatus === 'finalizado_parcial'))
```

Para:

```typescript
if (otp.tipo === 'comprador')
```

Isso garante que a pesquisa seja enviada sempre que o comprador confirmar a visita via OTP, independente do status resultante da ficha (`aguardando_proprietario`, `completo`, `finalizado_parcial`, etc.).

A função `sendSurveyWhatsApp` já tem proteção contra duplicatas (verifica se já existe survey para a ficha) e está isolada em `try/catch`, então não há risco de envio duplicado ou de bloquear o fluxo.

## Escopo
- 1 arquivo, 1 linha alterada
- Sem mudança de schema

