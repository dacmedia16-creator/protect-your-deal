

## Plano: Reordenar seções do Dashboard mobile

Mover a seção "Ações Rápidas" para cima, antes dos cards de "Registro Parceiro", "Pesquisas" e "Indique e Ganhe".

### Alteração

**`src/pages/Dashboard.tsx`**

Reordenar as seções mobile de:
1. Stats → Fichas Parceiro → Pesquisas → PlanUsage → Indique e Ganhe → **Ações Rápidas**

Para:
1. Stats → **Ações Rápidas** → Fichas Parceiro → Pesquisas → PlanUsage → Indique e Ganhe

Mover o bloco `sm:hidden space-y-2` (linhas 735-802) para logo após o stats grid (após linha 560), e manter os cards de Parceiro, Pesquisas e Indique e Ganhe abaixo.

