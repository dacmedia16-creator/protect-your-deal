

## Pagamento direto ao clicar na forma de pagamento

### Problema
Atualmente, clicar em "Cartão", "PIX" ou "Boleto" apenas seleciona o método (muda o state). O usuário espera que ao clicar, já abra o checkout do Asaas diretamente.

### Solução
Mover os botões de forma de pagamento para **dentro de cada card de plano**, substituindo o botão "Assinar Plano". Cada plano terá 3 botões (PIX, Cartão, Boleto) que ao clicar chamam `handleSubscribe(planoId, billingType)` imediatamente, redirecionando para o Asaas.

### Alterações

#### 1. Remover o componente `PaymentMethodSelector` das 3 páginas
Não será mais necessário o seletor separado no topo da página.

#### 2. Substituir o botão "Assinar Plano" em cada card por 3 botões de pagamento
Em `EmpresaAssinatura.tsx`, `ConstutoraAssinatura.tsx` e `CorretorAssinatura.tsx`:

- Onde hoje existe um `<Button>Assinar Plano</Button>`, colocar 3 botões lado a lado:
  - **PIX** (ícone QrCode) → chama `handleSubscribe(plano.id, 'PIX')`
  - **Cartão** (ícone CreditCard) → chama `handleSubscribe(plano.id, 'CREDIT_CARD')`
  - **Boleto** (ícone Receipt) → chama `handleSubscribe(plano.id, 'BOLETO')`
- Atualizar `handleSubscribe` para receber `billingType` como parâmetro (remover o state `billingType`)
- Remover o state e import do `PaymentMethodSelector`

#### 3. Layout dos botões dentro do card

```text
┌─────────────────────────┐
│  Plano Profissional     │
│  R$ 79,90/mês           │
│  20 registros/mês       │
│                         │
│  ┌─────┐ ┌─────┐ ┌────┐│
│  │ PIX │ │Cart.│ │Bol.││
│  └─────┘ └─────┘ └────┘│
└─────────────────────────┘
```

Cada botão mostra o ícone + nome curto, e ao clicar já redireciona para o Asaas com o método pré-selecionado.

#### 4. Edge Function
Sem alterações — já aceita `billingType` corretamente.

### Fluxo do usuário (após a mudança)
1. Usuário vê os planos com 3 botões de pagamento em cada card
2. Clica em "Cartão" no plano desejado
3. É redirecionado imediatamente para o checkout do Asaas com cartão pré-selecionado

