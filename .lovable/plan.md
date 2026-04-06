

# Recriar Secret ASAAS_SANDBOX

## Problema
O `check-config` retornou `sandbox_mode: false`, indicando que o valor atual do secret `ASAAS_SANDBOX` não é exatamente a string `true` (pode conter aspas, espaços ou casing diferente).

## Ação
Usar a ferramenta `add_secret` para sobrescrever o secret `ASAAS_SANDBOX` com o valor exato `true` (4 caracteres, minúsculas, sem aspas, sem espaços).

## Validação pós-correção
Após a atualização, executar novamente o `check-config` via `asaas-webhook-test` para confirmar que `sandbox_mode` retorna `true`.

