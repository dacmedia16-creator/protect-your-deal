

# Corrigir URL do botao CTA no template Meta

## Problema

A URL base do template Meta e `https://visitaseguras.com{{1}}`, onde `{{1}}` substitui tudo apos o dominio. Atualmente estamos passando apenas o UUID do token (ex: `fe984944-223b-...`), resultando em `https://visitaseguras.com/fe984944-223b-...` sem o path `/confirmar/`.

## Solucao

Alterar o valor de `buttonUrlDynamicParams[0]` em todas as 3 edge functions para incluir o path `/confirmar/` antes do token:

De: `params.token` (ex: `fe984944-...`)
Para: `/confirmar/${params.token}` (ex: `/confirmar/fe984944-...`)

Isso gera a URL correta: `https://visitaseguras.com/confirmar/fe984944-...`

## Arquivos modificados

| Arquivo | Linha | Alteracao |
|---------|-------|-----------|
| `supabase/functions/send-otp/index.ts` | ~134 | `buttonUrlDynamicParams[0]` -> `/confirmar/${params.token}` |
| `supabase/functions/process-otp-queue/index.ts` | ~138 | Mesma alteracao |
| `supabase/functions/otp-reminder/index.ts` | ~106 | Mesma alteracao |

Alteracao minima e cirurgica em 3 linhas, uma por arquivo.
