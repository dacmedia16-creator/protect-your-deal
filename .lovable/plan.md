

## Testar envio do email de boas-vindas

A função `send-email` exige `SERVICE_ROLE_KEY` ou token de admin autenticado, o que impede teste direto. Solução: criar edge function temporária sem autenticação que faz o envio internamente.

### Mudanças

| Arquivo | O que fazer |
|---------|------------|
| `supabase/functions/test-welcome-email/index.ts` | Criar function temporária que invoca `send-email` com `SERVICE_ROLE_KEY` para enviar template `boas_vindas` para `denissouza@vip7imoveis.com.br` |
| `supabase/config.toml` | Adicionar `[functions.test-welcome-email]` com `verify_jwt = false` |

Após confirmar recebimento, ambos serão removidos.

