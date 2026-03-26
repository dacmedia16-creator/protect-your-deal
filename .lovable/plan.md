

## Plano: Fase 5 — Páginas Admin para Construtoras

### Alterações

**1. Nova página `src/pages/admin/AdminConstrutoras.tsx`**
- Listagem de construtoras com busca, status, contagem de empreendimentos e imobiliárias parceiras
- Ações: ver detalhes, toggle status, alterar plano
- Padrão idêntico ao `AdminImobiliarias.tsx` (cards mobile + tabela desktop)

**2. Nova página `src/pages/admin/AdminDetalhesConstrutora.tsx`**  
- Tabs: Dados (form edição + logo), Assinatura (atribuir plano), Empreendimentos (lista), Imobiliárias Parceiras (lista), Corretores (lista com reset senha)
- Padrão idêntico ao `AdminDetalhesImobiliaria.tsx`

**3. Atualizar `src/components/admin/GlobalSearch.tsx`**
- Adicionar tipo `'construtora'` ao `SearchResult`
- Nova query buscando em `construtoras` por nome/cnpj/email
- Novo grupo "Construtoras" nos resultados com ícone `HardHat`
- Navegação para `/admin/construtoras/{id}`

**4. Atualizar `src/pages/admin/AdminDashboard.tsx`**
- Adicionar contagem de construtoras (`totalConstrutoras` / `construtorasAtivas`)
- Novo card KPI "Construtoras" clicável → `/admin/construtoras`

**5. Atualizar `src/components/layouts/SuperAdminLayout.tsx`**
- Adicionar item `{ href: '/admin/construtoras', icon: HardHat, label: 'Construtoras' }` no grupo "Operações"

**6. Atualizar `src/App.tsx`**
- Importar `AdminConstrutoras` e `AdminDetalhesConstrutora`
- Adicionar rotas `/admin/construtoras` e `/admin/construtoras/:id` protegidas com `super_admin`

### Detalhes técnicos

- `AdminConstrutoras`: fetch `construtoras.*`, count `user_roles` (role `corretor`, construtora_id), count `construtora_imobiliarias`, latest `assinaturas` (construtora_id)
- `AdminDetalhesConstrutora`: fetch construtora por id, planos com `tipo_cadastro = 'construtora'`, empreendimentos, parcerias, corretores via `user_roles` + `profiles`
- GlobalSearch: query paralela com `useQuery` em `construtoras` table, ícone `HardHat` cor verde
- Dashboard: 1 query adicional `count` em `construtoras`

