

## Relatório de Comissões de Indicação — Admin

### Contexto
O sistema de afiliados já tem `AdminComissoes` para comissões de cupons. As indicações de corretores usam a tabela `indicacoes_corretor` com campos: `valor_comissao`, `comissao_paga`, `comissao_paga_em`, `tipo_comissao_indicacao`, `status`, `indicador_user_id`, `indicado_user_id`, `tipo_indicado`, `codigo`, `observacao_pagamento`.

### O que será criado

Uma nova página `AdminIndicacoes` no painel admin, seguindo o mesmo padrão visual de `AdminComissoes`, com:

- **Cards resumo**: Total pendente, total pago, quantidade de indicações
- **Filtros**: Tipo de comissão (percentual/primeira_mensalidade), período (mês), status de pagamento (pendente/pago/todos)
- **Tabela**: Código, indicador (nome via profiles), indicado, tipo, valor comissão, status pagamento, data
- **Ação**: Marcar como pago (com observação), igual ao fluxo de `AdminComissoes`

### Mudanças

| Arquivo | O que fazer |
|---------|------------|
| `src/pages/admin/AdminIndicacoes.tsx` | **Criar** — página completa com query em `indicacoes_corretor` joined com `profiles`, filtros, cards, tabela e ação de pagamento |
| `src/App.tsx` | Adicionar import e rota `/admin/indicacoes` protegida para `super_admin` |
| `src/components/layouts/SuperAdminLayout.tsx` | Adicionar nav item "Indicações" no grupo Financeiro com ícone `ArrowUpRight` |

### RLS
A tabela `indicacoes_corretor` precisa de uma policy SELECT para super_admin. Verificarei se já existe; caso contrário, criarei via migration.

### Dados exibidos
- Nome do indicador: join com `profiles` via `indicador_user_id`
- Nome do indicado: join com `profiles` via `indicado_user_id`
- Filtrar apenas registros com `status != 'pendente'` (ou seja, indicações que já foram convertidas/cadastradas)

