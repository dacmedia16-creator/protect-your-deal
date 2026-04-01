

## Plano: Modernizar Cards com Glassmorphism e Doughnut Chart

### Alterações

**1. `src/pages/Dashboard.tsx`**

- **Stats Cards (linhas 408-456)**: Remover bordas sólidas, adicionar sombras suaves e efeito glassmorphism:
  - Classe: `border-0 bg-card/80 backdrop-blur-sm shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]`
  - Hover: `hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]` no lugar de `hover:shadow-medium`

- **Cards de ações rápidas e alertas (convites, equipe, indicações, pesquisas)**: Mesmo tratamento — sombras difusas, sem bordas duras, backdrop-blur sutil

- **Card de Pesquisas (linhas 483-508)**: Substituir a barra de `Progress` por um mini doughnut chart usando Recharts `PieChart` + `Pie` com `innerRadius`/`outerRadius`:
  - Mover o gráfico circular para o lado esquerdo (substituindo o ícone quadrado)
  - Tamanho: ~40x40px, mostrando % respondidas vs pendentes
  - Cores: purple para respondidas, muted para pendentes
  - Remover o componente `Progress` desse card

**2. `src/index.css`** (opcional)
- Adicionar classe utilitária `shadow-soft` se necessário para reuso

### Detalhes técnicos
- Recharts `PieChart` e `Pie` já são importados via `recharts` (dependência existente)
- O doughnut é um `Pie` com `innerRadius > 0`
- Sem nova dependência — tudo com Tailwind + Recharts existentes

