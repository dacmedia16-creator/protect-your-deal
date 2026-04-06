

# Alterar ASAAS_SANDBOX para Produção

## Situação atual
- O secret `ASAAS_SANDBOX` está configurado (provavelmente com valor `true`)
- A `ASAAS_API_KEY` é uma chave de **produção**
- As Edge Functions tentam acessar `sandbox.asaas.com` mas a chave não é válida nesse ambiente → erro `invalid_environment`

## Solução
Atualizar o valor do secret `ASAAS_SANDBOX` para `false`. Isso fará com que todas as Edge Functions (`asaas-payment-link`, `asaas-create-subscription`, `asaas-cancel-subscription`, `asaas-webhook`) usem a URL de produção `https://api.asaas.com/v3`.

## Ação necessária
Atualizar 1 secret:
- **ASAAS_SANDBOX**: alterar valor para `false`

Após a atualização, as Edge Functions serão automaticamente redeployadas e passarão a usar a API de produção do Asaas.

## Validação
Após o deploy, invocar a Edge Function `asaas-webhook-test` com action `check-config` para confirmar que `sandbox_mode` retorna `false`.

