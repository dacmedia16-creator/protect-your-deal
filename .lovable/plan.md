

## Plano: Uniformizar EmpresaDashboard com o estilo do Dashboard

O Dashboard do corretor tem um layout mais compacto e moderno (3 colunas, cards menores, pesquisas inline). O EmpresaDashboard será atualizado para seguir o mesmo padrão visual.

### Alterações em `src/pages/empresa/EmpresaDashboard.tsx`

**1. Stats Grid — layout 3 colunas compacto** (linhas 268-370)
- Mudar grid de `gap-4 md:grid-cols-2 lg:grid-cols-3` para `grid-cols-3 gap-3 md:gap-6`
- Corretores e Registros do Mês: usar padding compacto (`p-3 md:p-6`), título `text-xs md:text-sm`, valor `text-xl md:text-2xl`, adicionar `hover:scale-[1.02]` e `ChevronRight`
- Terceiro card: se surveys habilitado, mostrar card de pesquisas no grid; senão, card de "Total Registros" (total acumulado)

**2. Card de Pesquisas — formato compacto inline** (se surveys habilitado)
- No grid de 3 colunas, o card de pesquisas fica compacto como os outros stats cards
- Manter doughnut no header e valor + "de X" no content
- Remover o card separado de pesquisas que existia antes

**3. Card de Pesquisas separado (abaixo do grid)** — estilo horizontal
- Se surveys habilitado e há pesquisas, adicionar também um card horizontal compacto (como o "Parceiro" do Dashboard) com doughnut + texto + status "Concluído!" quando todas respondidas

**4. Remover botão "Novo Corretor" do header**
- Mover para Ações Rápidas para ficar mais limpo como o Dashboard

**5. Paddings e espaçamentos**
- Header: `CardHeader` com `pb-1 md:pb-2 p-3 md:p-6`
- Content: `p-3 pt-0 md:p-6 md:pt-0`
- Adicionar `animate-fade-in` e `animationDelay` escalonado nos cards

### Imports adicionais
- Adicionar `ChevronRight` do lucide-react

### Resultado esperado
O EmpresaDashboard terá a mesma estética compacta e moderna do Dashboard do corretor, com cards de 3 colunas, sombras suaves, e transições sutis.

