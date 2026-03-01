

## Plano: Corrigir erro 401 no envio de WhatsApp de boas-vindas

### Problema
Os logs confirmam que a correção do `supabaseUrl` funcionou, mas agora o erro é `{"code":401,"message":"Invalid JWT"}`. A função `send-whatsapp` tem `verify_jwt = true` no `config.toml`, enquanto `send-email` tem `verify_jwt = false` e funciona corretamente.

### Correção
**`supabase/config.toml`**: Alterar `verify_jwt` de `true` para `false` na seção `[functions.send-whatsapp]`, igualando ao padrão de `send-email`. A segurança é mantida porque a função valida internamente as credenciais do ZionTalk.

