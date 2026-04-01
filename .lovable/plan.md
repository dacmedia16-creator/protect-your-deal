

## Plano: Redesign Moderno do Dashboard Mobile

### Resumo das mudanças
Redesign completo da view mobile do Dashboard com foco em hierarquia visual, modernização e redução de scroll. O layout desktop permanece inalterado.

---

### 1. Header com Gradiente e Avatar (mobile only)

Substituir o header atual por um header com gradiente azul escuro (primary → slate-900), bordas inferiores arredondadas, e incluir avatar do usuário ao lado da saudação. A saudação muda conforme a hora do dia ("Bom dia", "Boa tarde", "Boa noite").

**Arquivo:** `src/pages/Dashboard.tsx`
- Mover a seção "Welcome" para dentro do header mobile
- Adicionar avatar do perfil (buscar `foto_url` na query de profile)
- Aplicar gradiente `bg-gradient-to-br from-primary to-slate-900` com `rounded-b-3xl`
- Texto em branco sobre o gradiente

### 2. Card de Stats Flutuante com Destaque em Pendentes

O card de 3 colunas (Total, Confirmadas, Pendentes) fica sobreposto ao header com `margin-top negativa`.

- Card "Pendentes" ganha fundo `bg-amber-50 dark:bg-amber-950/30` e borda `border-amber-300` quando valor > 0
- Quando Pendentes = 0, mostrar "Tudo em dia! ✅" em vez de "0"
- Cantos mais arredondados: `rounded-2xl`
- Sombras suaves: `shadow-lg` em vez de borda

### 3. Ações Rápidas em Grid de Ícones Circulares

Substituir a lista vertical de "Ações Rápidas" mobile por um grid horizontal `grid-cols-4` com ícones circulares e labels curtos embaixo (estilo app bancário).

Items:
- **Novo Registro** (Plus, gradient-primary)
- **Registros** (FileText)
- **Convites** (Handshake)
- **Ajuda Jurídica** (Scale, amber)

Se houver parcerias com construtoras, trocar "Ajuda Jurídica" pelo 4o item e empurrar ou adicionar "Registro Construtoras" (Building2).

Remover o FAB (+) flutuante no mobile, já que "Novo Registro" está no grid.

### 4. Carrossel Horizontal para Cards Secundários

Agrupar "Parceiro", "Pesquisas" e "Indique e Ganhe" em um carrossel horizontal deslizável (`overflow-x-auto snap-x`), economizando espaço vertical.

- Cards com largura fixa (`min-w-[280px]`), cantos `rounded-2xl`, sombras suaves
- "Indique e Ganhe" ganha um gradiente dourado (`from-amber-500/10 to-yellow-500/10`) com ícone mais proeminente
- Scroll horizontal com `snap-mandatory`

### 5. PlanUsageCard compacto mantido como está

Sem mudanças no PlanUsageCard.

### 6. Estilos Gerais (mobile only via `sm:hidden`)

- Cards com `rounded-2xl` e `shadow-soft` (sombra difusa) em vez de `border`
- Remover `FloatingActionButton` do mobile (ação já no grid)

---

### Arquivos a editar

1. **`src/pages/Dashboard.tsx`** — Todas as mudanças acima (header, stats, grid, carrossel, remoção do FAB mobile)
2. **`src/index.css`** — Adicionar classe utilitária `shadow-soft` se necessário
3. **`src/hooks/useAuth.tsx`** ou query existente — Expandir query de profile para incluir `foto_url`

### Detalhes técnicos
- Saudação dinâmica: `new Date().getHours()` → "Bom dia" (<12), "Boa tarde" (<18), "Boa noite"
- Carrossel via CSS nativo (`overflow-x-auto`, `scroll-snap-type: x mandatory`), sem lib externa
- FAB removido apenas no mobile (`sm:hidden` → escondido); desktop mantém grid atual
- Avatar usa componente `UserAvatar` existente ou `Avatar` do shadcn
- `data-tour` attributes mantidos para o onboarding tour

