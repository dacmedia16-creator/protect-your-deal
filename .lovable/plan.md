

## Fix: Edge Function `gerar-codigo-indicacao` falhando

### Problema
A Edge Function `gerar-codigo-indicacao` está com `verify_jwt = true` no `config.toml`, o que causa falha com o sistema de signing-keys do projeto. A função já valida o JWT manualmente no código.

### Solução

| Arquivo | Mudança |
|---------|---------|
| `supabase/config.toml` | Alterar `verify_jwt = true` para `verify_jwt = false` na seção `[functions.gerar-codigo-indicacao]` |

Isso é consistente com o padrão usado nas outras edge functions do projeto que validam JWT no código.

