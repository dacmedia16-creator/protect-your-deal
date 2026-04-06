

# Trocar ASAAS_API_KEY para Sandbox

## Objetivo
Substituir o valor atual da `ASAAS_API_KEY` pela chave de API do ambiente sandbox do Asaas, permitindo testes de pagamento sem afetar produção.

## Ação
Usar a ferramenta `add_secret` para solicitar que você insira a nova chave sandbox. Isso sobrescreverá o valor atual.

## Onde obter a chave
1. Acesse https://sandbox.asaas.com
2. Faça login (ou crie conta sandbox)
3. Vá em **Configurações → Integrações → API**
4. Copie a API Key gerada

## Impacto
- Todas as Edge Functions de pagamento passarão a autenticar no sandbox
- Combinado com `ASAAS_SANDBOX=true` (já configurado), o fluxo completo estará em modo teste
- **Atenção**: enquanto a chave sandbox estiver ativa, cobranças reais não serão processadas

## Reversão
Para voltar à produção: troque `ASAAS_API_KEY` de volta para a chave de produção e remova/altere `ASAAS_SANDBOX` para `false`.

