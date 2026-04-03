

## Corrigir webhook para reconhecer pagamentos via Payment Link

### Problema raiz
O webhook do Asaas não consegue encontrar a assinatura quando o pagamento vem de um **Payment Link**:

1. A edge function `asaas-payment-link` envia `externalReference: assinaturaId` (UUID puro: `"b2d6cb16-ca6d-45c4-9e98-23971cbcfd99"`)
2. O webhook busca por `asaas_subscription_id`, que nunca foi preenchido (é NULL)
3. O fallback tenta `JSON.parse(externalReference)` esperando `{planoId, userId}`, mas recebe uma string UUID — falha silenciosamente
4. Resultado: pagamento confirmado no Asaas mas assinatura permanece em "trial"

### Dados da conta afetada
- Assinatura `b2d6cb16-ca6d-45c4-9e98-23971cbcfd99`: status `trial`, `asaas_subscription_id` = NULL
- Plano pendente: "Teste" (`a988b889-...`)
- Webhook recebido: PAYMENT_CONFIRMED com `externalReference: "b2d6cb16-..."` e `subscription: "sub_ckapb49ry5w4cpn3"`

### Solução

#### 1. Corrigir o webhook (`asaas-webhook/index.ts`)
Após a busca por `asaas_subscription_id` falhar (linha 150-154), adicionar fallback que busca a assinatura pelo `externalReference` como UUID direto:

```
Se assinatura não encontrada por asaas_subscription_id:
  → Tentar buscar por id = externalReference
  → Se encontrar, salvar o asaas_subscription_id na row para futuras cobranças
  → Processar normalmente (ativar, aplicar plano pendente, etc.)
```

Isso corrige tanto o cenário atual quanto garante que cobranças recorrentes futuras funcionem (pois o `asaas_subscription_id` será salvo na primeira vez).

#### 2. Corrigir a conta afetada manualmente
Após o deploy do fix, a conta já terá o webhook processado nas próximas cobranças. Mas para ativar agora, será necessária uma migration que:
- Atualiza `status` de `trial` para `ativa`
- Aplica o `plano_pendente_id` ao `plano_id`
- Limpa `plano_pendente_id`
- Salva `asaas_subscription_id = 'sub_ckapb49ry5w4cpn3'`

### Arquivos alterados
- `supabase/functions/asaas-webhook/index.ts` — adicionar fallback de busca por `externalReference` como UUID
- Migration SQL — corrigir dados da assinatura `b2d6cb16-...`

