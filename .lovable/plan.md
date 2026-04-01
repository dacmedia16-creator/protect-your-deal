

## Plano: Modernizar EmpresaDashboard com Glassmorphism e Doughnut Chart

### Alterações em `src/pages/empresa/EmpresaDashboard.tsx`

**1. Glassmorphism em todos os cards** (linhas 249, 271, 291, 330, 362, 412, 438)
- Substituir classes padrão por: `border-0 bg-card/80 backdrop-blur-sm shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all`
- Card de trial warning: `border-0 bg-warning/5 backdrop-blur-sm shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)]`

**2. Card de Pesquisas — doughnut chart** (linhas 328-358)
- Substituir o ícone `ClipboardCheck` e a barra `Progress` por um mini doughnut chart Recharts (`PieChart` + `Pie` com `innerRadius=13, outerRadius=20`, 44x44px)
- Dados: respondidas (purple `hsl(270,70%,55%)`) vs pendentes (muted)
- Manter média de satisfação com estrela

**3. Imports**
- Adicionar `PieChart, Pie, Cell` ao import de `recharts`
- Remover `ClipboardCheck` do import de lucide-react

### Detalhes técnicos
- Mesmo padrão visual já aplicado no `Dashboard.tsx`
- Recharts já é dependência do projeto

