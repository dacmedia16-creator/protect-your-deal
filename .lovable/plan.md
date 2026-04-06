

# Adicionar Secret ASAAS_SANDBOX

## Objetivo
Ativar o ambiente sandbox do Asaas adicionando o secret `ASAAS_SANDBOX` com valor `true`. Isso fará com que todas as Edge Functions (`asaas-payment-link`, `asaas-create-customer`, `asaas-create-subscription`, `asaas-cancel-subscription`) apontem para `https://sandbox.asaas.com/api/v3` em vez da API de produção.

## Ação
Usar a ferramenta `add_secret` para criar o secret `ASAAS_SANDBOX` com valor `true`.

## Impacto
- Nenhuma mudança de código necessária — o toggle já existe em todas as funções
- Todas as cobranças/assinaturas criadas passarão a usar o sandbox
- **Importante**: Você também precisará trocar a `ASAAS_API_KEY` para uma chave de sandbox, caso a atual seja de produção

