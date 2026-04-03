

## Mostrar botões de pagamento no plano atual

### Problema
Quando o plano exibido é o plano atual do usuário, o código mostra apenas um botão desabilitado "Plano Atual" em vez dos botões de PIX, Cartão e Boleto. Isso impede o usuário de renovar, trocar forma de pagamento ou refazer o pagamento.

### Solução
Exibir os botões de pagamento (PIX, Cartão, Boleto) também no plano atual, mantendo o badge "Atual" para identificação visual.

### Alterações

**3 arquivos**: `CorretorAssinatura.tsx`, `EmpresaAssinatura.tsx`, `ConstutoraAssinatura.tsx`

- Remover o `if (isCurrentPlan)` que renderiza o botão desabilitado "Plano Atual"
- Sempre renderizar o componente `<PaymentButtons>` independente de ser o plano atual ou não
- Manter o badge "Atual" no header do card para o usuário saber qual é seu plano

