

## Corrigir bug no envio do email de boas-vindas para imobiliárias

### Problema

No `registro-imobiliaria/index.ts`, o payload do email usa campos incorretos:
- `email` → deveria ser `to`
- `vars` → deveria ser `variables`

O `send-email` extrai `{ to, variables }` do body, então os dados não chegam.

### Mudança

| Arquivo | O que fazer |
|---------|------------|
| `supabase/functions/registro-imobiliaria/index.ts` (linhas 344-353) | Trocar `email: admin.email` por `to: admin.email` e `vars` por `variables` |

