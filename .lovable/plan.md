
# Corrigir URL duplicada no botao do template Meta

## Problema

O botao "Confirmar Visita" do template `visita_prova_2` gera a URL `visitaseguras.com.br/confirmar/confirmar/token` (com "confirmar" duplicado). Isso acontece porque o template Meta ja tem a URL base configurada como `visitaseguras.com.br/confirmar/`, e o codigo envia `confirmar/${token}` como parametro dinamico do botao.

## Correcao

Alterar o valor de `buttonUrlDynamicParams[0]` de `confirmar/${params.token}` para apenas `${params.token}` em 3 edge functions:

### Arquivos

1. **`supabase/functions/send-otp/index.ts`** (linha 135)
   - De: `buttonUrlDynamicParams[0]`, `confirmar/${params.token}`
   - Para: `buttonUrlDynamicParams[0]`, `${params.token}`

2. **`supabase/functions/process-otp-queue/index.ts`** (linha 139)
   - De: `buttonUrlDynamicParams[0]`, `confirmar/${params.token}`
   - Para: `buttonUrlDynamicParams[0]`, `${params.token}`

3. **`supabase/functions/otp-reminder/index.ts`** (linha 107)
   - De: `buttonUrlDynamicParams[0]`, `confirmar/${params.token}`
   - Para: `buttonUrlDynamicParams[0]`, `${params.token}`

## Resultado esperado

A URL gerada passara a ser `visitaseguras.com.br/confirmar/{token}` (correta, sem duplicacao).

## Detalhes tecnicos

A alteracao e uma unica linha em cada arquivo. As 3 edge functions serao redeployadas apos a mudanca.
