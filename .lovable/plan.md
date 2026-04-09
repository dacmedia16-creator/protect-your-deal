

# Fix: Checkbox de empreendimentos não funciona ao clicar

## Problema

O elemento `<label>` que envolve o `<Checkbox>` do Radix UI causa um duplo disparo do evento de clique: o label encaminha o clique para o checkbox, e o checkbox também processa o clique diretamente. Resultado: o toggle executa duas vezes (liga e desliga), parecendo que nada acontece.

## Solução

Trocar `<label>` por `<div>` no mapeamento dos empreendimentos dentro do dialog (linha 822 do `ConstutoraEquipes.tsx`). Isso mantém o visual e o cursor pointer, mas elimina o duplo disparo.

## Arquivo alterado

`src/pages/construtora/ConstutoraEquipes.tsx` — linha 822: substituir `<label ...>` por `<div ...>` (e o fechamento correspondente na linha 829).

