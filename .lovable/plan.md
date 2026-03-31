

## Plano: Tour de Onboarding com Balões no Primeiro Acesso

### Objetivo
Criar um sistema de "tour guiado" com balões/tooltips que aparece automaticamente no primeiro acesso do corretor ao Dashboard, explicando cada função principal do app.

### Como funciona
- No primeiro login, o corretor vê balões sequenciais apontando para cada elemento importante
- Cada balão tem título, descrição e botões "Próximo" / "Pular"
- Ao finalizar ou pular, salva no `localStorage` que o tour foi concluído
- O usuário pode reiniciar o tour pelo menu do perfil

### Passos do Tour (7 etapas)
1. **Bem-vindo** — Saudação inicial sobre o app
2. **Cards de Estatísticas** — "Aqui você vê seus registros, confirmados e pendentes"
3. **Novo Registro** (botão FAB ou card) — "Crie fichas de visita com confirmação via WhatsApp"
4. **Ver Registros** — "Consulte e gerencie todas as suas fichas"
5. **Convites/Parcerias** — "Envie e receba convites de parceria com outros corretores"
6. **Indique e Ganhe** — "Indique colegas e ganhe comissão"
7. **Menu de Navegação** — "Use o menu inferior para navegar entre as seções"

### Alterações

**1. Criar `src/components/OnboardingTour.tsx`**
- Componente que renderiza um overlay com balão posicionado sobre o elemento alvo
- Usa `data-tour="step-id"` nos elementos do Dashboard para localizar alvos
- Estado controlado por `localStorage.getItem('onboarding-tour-done')`
- Animação fade-in para cada balão
- Botões: "Próximo", "Pular tour", indicador de progresso (dots)
- Posicionamento inteligente (acima/abaixo do elemento alvo)

**2. Editar `src/pages/Dashboard.tsx`**
- Adicionar atributos `data-tour="stats"`, `data-tour="novo-registro"`, etc. nos cards/elementos relevantes
- Importar e renderizar `<OnboardingTour />` no final do componente
- Passa os steps com título e descrição

**3. Editar `src/components/MobileNav.tsx`**
- Adicionar `data-tour="nav-menu"` no container da nav inferior

### Detalhes técnicos
- Sem dependência externa (biblioteca de tour) — componente custom leve
- `localStorage` key: `visitaprova-onboarding-done`
- Balão usa classes Tailwind existentes com sombra, borda e seta CSS
- Z-index alto (z-[9999]) para ficar acima de tudo
- Backdrop semi-transparente com "spotlight" no elemento ativo via `getBoundingClientRect()`

