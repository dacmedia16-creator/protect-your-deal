

## Plano: Melhorar visual do header + stats do Dashboard mobile

Baseado na screenshot, o foco é a área do header (logo + avatar), welcome e stats cards. Vou aplicar melhorias visuais modernas mantendo a estrutura.

### Alterações em `src/pages/Dashboard.tsx`

**1. Header mobile — gradiente de fundo**
- Trocar `border-b bg-card` por um gradiente sutil: `bg-gradient-to-r from-primary/5 via-background to-primary/10 border-b border-primary/10`
- Aumentar padding vertical para `py-4`

**2. Seção de boas-vindas — mais destaque**
- Adicionar gradiente no texto do nome: `bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent` no "Bem-vindo, Denis!"
- Ou simplesmente aplicar cor primária no nome para destaque

**3. Stats cards — visual premium**
- Adicionar um container com fundo sutil arredondado (`rounded-2xl bg-muted/30 p-3`) envolvendo os 3 cards
- Nos cards individuais, aumentar border-radius para `rounded-xl`
- Adicionar ícones com fundo colorido circular ao invés de ícone solto (ex: `bg-primary/10 rounded-full p-1.5`)
- Números maiores e com cor mais vibrante
- Adicionar seta `>` mais visível com fundo sutil

**4. Transições e micro-animações**
- Stagger animation nos cards (já existe, manter)
- Hover scale já existe, manter

### Resultado
Header com gradiente sutil, welcome text com destaque visual, stats cards dentro de um container com visual premium tipo "card group", ícones com badges coloridos circulares.

