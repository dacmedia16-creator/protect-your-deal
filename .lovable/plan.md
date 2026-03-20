

## Corrigir comissão "Primeira Mensalidade" para usar valor mensal no plano anual

### Problema
Atualmente, quando o tipo é `primeira_mensalidade`, o cálculo usa `value` (valor do pagamento recebido). Se o indicado escolher plano anual, a comissão seria o valor anual inteiro — incorreto.

### Solução
No webhook `asaas-webhook`, quando `tipo_comissao_indicacao === 'primeira_mensalidade'`, buscar o `valor_mensal` do plano da assinatura e usar esse valor como comissão (em vez do `value` do pagamento).

### Mudança

| Arquivo | O que fazer |
|---------|------------|
| `supabase/functions/asaas-webhook/index.ts` | No bloco de referral commission (~linhas 213-256), quando `tipo_comissao_indicacao === 'primeira_mensalidade'`, buscar o `valor_mensal` do plano vinculado à assinatura e usar esse valor como `valorComissao` em vez de `value` |

### Lógica atualizada
```text
if tipo === 'primeira_mensalidade':
  buscar plano da assinatura → valor_mensal
  valorComissao = valor_mensal
else:
  valorComissao = value * (comissao_percentual / 100)
```

Isso garante que mesmo no plano anual, a comissão será equivalente a apenas 1 mês.

