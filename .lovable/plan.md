

## Mostrar informação de comissão na tela "Minhas Indicações"

### O que será feito

Adicionar um bloco informativo na seção "Links de Indicação" que mostra ao corretor **o que ele ganha** com cada indicação, baseado nos dados já salvos no registro placeholder (`tipo_comissao_indicacao` e `comissao_percentual`).

### Dados disponíveis

O registro placeholder (código ativo) já contém:
- `tipo_comissao_indicacao`: `"percentual"` ou `"primeira_mensalidade"`
- `comissao_percentual`: valor numérico (ex: 10 para 10%, ou 100 para primeira mensalidade)

Não é necessário buscar dados adicionais — basta ler do registro ativo já carregado.

### Mudança

| Arquivo | O que fazer |
|---------|------------|
| `src/pages/MinhasIndicacoes.tsx` | Extrair `tipo_comissao_indicacao` e `comissao_percentual` do placeholder ativo e exibir um `Alert` ou card informativo abaixo do código, explicando a recompensa |

### UI proposta

Dentro do card "Links de Indicação", logo abaixo de "Seu código: IND-XXX", adicionar:

- Se `primeira_mensalidade`: "Você ganha o valor da 1ª mensalidade do plano escolhido pelo indicado"
- Se `percentual`: "Você ganha X% sobre o primeiro pagamento do indicado"

Usar um componente `Alert` com ícone `DollarSign` e visual suave (info/success) para destacar sem poluir.

