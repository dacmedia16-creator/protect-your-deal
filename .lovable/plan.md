

# Remover barra extra do parametro dinamico do botao Meta

## Problema

A URL gerada pelo botao CTA esta com duplo `//`:
`visitaseguras.com.br//confirmar/TOKEN`

Isso acontece porque o template Meta tem a URL base `https://visitaseguras.com.br/{{1}}` (ja inclui uma `/` antes do parametro dinamico), e estamos passando `/confirmar/TOKEN` (com `/` no inicio), resultando em `//confirmar/`.

## Solucao

Remover a barra inicial do valor de `buttonUrlDynamicParams[0]` nas 3 edge functions:

De: `/confirmar/${params.token}`
Para: `confirmar/${params.token}`

Resultado final: `https://visitaseguras.com.br/confirmar/TOKEN`

## Arquivos modificados

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/send-otp/index.ts` | `buttonUrlDynamicParams[0]` de `/confirmar/...` para `confirmar/...` |
| `supabase/functions/process-otp-queue/index.ts` | Mesma alteracao |
| `supabase/functions/otp-reminder/index.ts` | Mesma alteracao |

Alteracao de 1 caractere em cada arquivo.

