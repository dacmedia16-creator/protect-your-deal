

## Criar Edge Function temporária para teste de WhatsApp

### Mudanças

| Arquivo | O que fazer |
|---------|------------|
| `supabase/functions/test-welcome-whatsapp/index.ts` | Criar function sem autenticação que envia a mensagem de boas-vindas para `15981788214` via `send-whatsapp` usando `SERVICE_ROLE_KEY` |
| `supabase/config.toml` | Adicionar `[functions.test-welcome-whatsapp]` com `verify_jwt = false` |

A function será um endpoint simples que, ao ser chamado (POST ou GET), envia a mesma mensagem de boas-vindas usada no cadastro do corretor autônomo para o número fixo `15981788214`, usando o canal `default` (ZionTalk texto). Após o teste, a function pode ser removida.

