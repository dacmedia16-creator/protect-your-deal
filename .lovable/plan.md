

## Formas de pagamento clicáveis

### Problema
Os ícones de PIX, Cartão e Boleto são apenas informativos (elementos `<span>`) e não fazem nada ao clicar. O usuário espera que eles funcionem como seleção de método de pagamento.

### Solução
Transformar as formas de pagamento em botões selecionáveis (radio-style). O método escolhido será enviado ao gerar o link de pagamento, fazendo o Asaas abrir direto na tela do método selecionado (PIX, boleto ou cartão).

### Alterações

#### 1. Edge Function `asaas-payment-link/index.ts`
- Aceitar novo parâmetro opcional `billingType` (valores: `UNDEFINED`, `PIX`, `BOLETO`, `CREDIT_CARD`)
- Passar esse valor para a API do Asaas ao criar o payment link (campo `billingType`)
- Default continua `UNDEFINED` (cliente escolhe na hora)

#### 2. Páginas de assinatura (3 arquivos)
**`EmpresaAssinatura.tsx`**, **`ConstutoraAssinatura.tsx`**, **`CorretorAssinatura.tsx`**:

- Adicionar state `billingType` com valor padrão `'UNDEFINED'`
- Transformar os `<span>` de formas de pagamento em `<button>` com estilo de seleção (borda azul/primary quando ativo)
- Ao clicar em PIX/Cartão/Boleto, selecionar aquele método
- Passar `billingType` no body da chamada `handleSubscribe`
- Adicionar opção "Todas" (UNDEFINED) como default para quem quiser escolher depois

### Fluxo do usuário
1. Usuário seleciona a forma de pagamento (PIX, Cartão ou Boleto) — ou deixa em "Todas"
2. Clica em "Assinar Plano" no card do plano desejado
3. É redirecionado para o Asaas já na tela do método escolhido

