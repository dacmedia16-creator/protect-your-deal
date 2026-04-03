

## Corrigir fluxo de pagamento: seletor acima dos planos

### Problema
O `PaymentMethodSelector` está renderizado **abaixo** dos cards de plano. O usuário seleciona PIX/Cartão/Boleto mas não percebe que precisa clicar "Assinar Plano" no card acima. A experiência fica confusa.

### Solução
Mover o `PaymentMethodSelector` para **acima** dos cards de plano nas 3 páginas de assinatura, para que o fluxo seja natural: primeiro escolhe o método, depois clica no plano.

### Alterações

**3 arquivos**: `EmpresaAssinatura.tsx`, `ConstutoraAssinatura.tsx`, `CorretorAssinatura.tsx`

- Mover o `<PaymentMethodSelector>` de depois dos cards para **antes** dos cards de plano (logo abaixo do toggle mensal/anual)
- Isso garante que o usuário veja e selecione o método de pagamento primeiro, e depois clique "Assinar Plano" no card desejado

### Fluxo corrigido
1. Usuário vê o seletor de forma de pagamento (PIX, Cartão, Boleto, Todas)
2. Seleciona o método desejado
3. Clica "Assinar Plano" no card do plano
4. É redirecionado ao Asaas com o método pré-selecionado

