

# Correção: `body is not defined` no send-email

## Problema
A edge function `send-email` tem um bug crítico: a variável `body` (que contém os dados da requisição como destinatário, template, anexos) é usada mas nunca declarada. A linha `const body = await req.json()` foi removida acidentalmente em alguma edição recente.

**Impacto**: Todos os emails do sistema (ficha_completa, boas_vindas, etc.) estão falhando desde ~30/03/2026. Afeta tanto chamadas internas (verify-otp, regenerate-backup) quanto externas.

## Correção

### Arquivo: `supabase/functions/send-email/index.ts`

Adicionar `const body = await req.json()` logo antes da linha 173, após o bloco de autenticação:

```typescript
// Linha 171: } --- END AUTH GATE ---

const body: SendEmailRequest = await req.json();  // ← ADICIONAR

const { action, to, subject, html, text, template_tipo, variables, ficha_id, from_email } = body;
```

### Pós-correção
- Fazer redeploy da edge function `send-email`
- Reenviar o email do Denis usando `regenerate-backup` com `send_email: true` para a ficha `307f73b7-cc4f-46b1-b361-42f9cfae49cf`

## Escopo
- 1 arquivo modificado: `supabase/functions/send-email/index.ts`
- 1 linha adicionada
- Sem mudança de schema

