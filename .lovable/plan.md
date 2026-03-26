

## Plano: Alinhar página de Corretores da Construtora com a da Imobiliária

### Problema
A página `ConstutoraCorretores` (386 linhas) é muito mais simples que a `EmpresaCorretores` (1285 linhas). Faltam KPIs, busca, contagem de fichas, dropdown de ações, layout mobile responsivo e redefinição de senha.

### O que será implementado

Reescrever `ConstutoraCorretores.tsx` seguindo o mesmo design da imobiliária, adaptado ao contexto da construtora (sem equipes, sem convites).

**1. Header unificado com toolbar**
- Título "Corretores" + subtítulo "X corretores"
- Campo de busca por nome/CRECI
- Botão "Criar"

**2. KPI Cards** (grid 3 colunas)
- Ativos / Inativos / Total de Fichas

**3. Tabela desktop com dropdown de ações**
- Colunas: Nome (com RoleBadge), CRECI, Telefone, Fichas, Status, Ações (...)
- Dropdown: Editar, Desativar/Ativar, Redefinir Senha
- Contagem de fichas por corretor (`fichas_visita` count)

**4. Layout mobile responsivo**
- Cards clicáveis com nome, badges, CRECI, fichas e dropdown de ações (mesmo padrão da imobiliária)

**5. Redefinir Senha**
- Dialog para definir nova senha chamando `admin-reset-corretor-password`
- Requer atualização da edge function para aceitar `construtora_admin`

### Arquivos alterados
1. `src/pages/construtora/ConstutoraCorretores.tsx` — Reescrita completa seguindo padrão da imobiliária
2. `supabase/functions/admin-reset-corretor-password/index.ts` — Adicionar suporte a `construtora_admin`

### Sem alterações no banco de dados

