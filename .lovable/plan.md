

## Destacar Plano "Profissional" (R$ 79,90)

### Resumo
Atualmente o destaque "Mais escolhido" está no plano "Individual". Vamos movê-lo para o plano "Profissional" (R$ 79,90).

### Mudança

| Arquivo | O que fazer |
|---------|------------|
| `src/pages/Index.tsx` (linhas 664-686) | Trocar a lógica de `isIndividual` para `isProfissional` — detectar pelo nome `profissional`. Aplicar `ring-2 ring-primary`, badge "Mais Escolhido", e botão `variant="default"` nesse plano em vez do Individual |

### Detalhes
- Linha 664: adicionar `const isProfissional = plano.nome.toLowerCase().includes('profissional');`
- Linha 674: trocar `isIndividual` por `isProfissional` no `ring-2 ring-primary`
- Linhas 676-679: trocar condição do badge "Mais escolhido" para `isProfissional`
- Linha 686: trocar padding extra para `isProfissional`
- Linha 728: trocar variant do botão para `isProfissional`

