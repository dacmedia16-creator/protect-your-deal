

## Testar envio de WhatsApp de boas-vindas

Criar novamente a Edge Function temporária `test-welcome-whatsapp` para enviar a mensagem de boas-vindas atualizada (com o link dos tutoriais) para o número `15981788214`, e removê-la após o teste.

### Mudanças

| Arquivo | O que fazer |
|---------|------------|
| `supabase/functions/test-welcome-whatsapp/index.ts` | Criar function temporária que envia a mensagem de boas-vindas completa (incluindo link dos tutoriais) para `15981788214` via canal `default` |
| `supabase/config.toml` | Adicionar temporariamente `[functions.test-welcome-whatsapp]` com `verify_jwt = false` |

Após confirmar o envio, ambos os arquivos serão revertidos (function deletada e config.toml restaurado).

