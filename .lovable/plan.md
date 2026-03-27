

## Plano: Alinhar módulo Construtora com Imobiliária (mantendo Empreendimentos e Parcerias)

### Visão geral
Reescrever todas as páginas do módulo construtora para ficarem no mesmo nível de qualidade e funcionalidade do módulo imobiliária, mantendo as páginas exclusivas (Empreendimentos e Imobiliárias Parceiras).

### Comparação de funcionalidades

| Página | Imobiliária (referência) | Construtora (atual) | Ação |
|--------|-------------------------|---------------------|------|
| Dashboard | KPIs avançados, gráfico mensal, ações rápidas, uso do plano | 4 cards simples | Reescrever |
| Corretores | KPIs, busca, dropdown ações, detalhes | Já alinhado (feito antes) | Manter |
| Corretores/:userId | Perfil, KPIs, fichas, pesquisas | Não existe | Criar |
| Equipes | CRUD hierárquico, membros, líder, cores | Não existe | Criar (requer migration) |
| Fichas | Busca, mobile cards, link detalhes, delete | Tabela básica | Reescrever |
| Relatórios | Gráficos, evolução, performance por corretor | Básico | Reescrever |
| Assinatura | Planos, pagamento, uso | Só mostra status | Reescrever |
| Configurações | Zod, tabs, logo, copiar código | Form básico | Reescrever |
| Empreendimentos | — (exclusivo construtora) | Já existe | Manter |
| Imob. Parceiras | — (exclusivo construtora) | Já existe | Manter |

### Alterações necessárias

**1. Migration SQL — Suporte a equipes para construtora**
- Tornar `equipes.imobiliaria_id` nullable
- Adicionar `equipes.construtora_id uuid REFERENCES construtoras(id)`
- CHECK constraint: pelo menos um dos dois preenchido
- Atualizar trigger `check_equipe_imobiliaria` para suportar construtora
- RLS policies em `equipes` e `equipes_membros` para `construtora_admin`

**2. `ConstrutoraDashboard.tsx`** — Reescrever seguindo EmpresaDashboard
- KPIs: Corretores ativos, Fichas do mês, taxa confirmação, crescimento MoM
- Gráfico de barras mensal (últimos 6 meses)
- Ações rápidas
- Card de uso do plano com progress bars

**3. `ConstutoraFichas.tsx`** — Reescrever seguindo EmpresaFichas
- Busca por protocolo, endereço, nomes
- Layout mobile com cards clicáveis (link para `/fichas/:id`)
- Tabela desktop com nome do corretor
- Badge "Vendido", DeleteFichaDialog

**4. `ConstutoraRelatorios.tsx`** — Reescrever seguindo EmpresaRelatorios
- Gráfico de evolução 6 meses (total vs confirmadas)
- Performance por corretor com métricas individuais

**5. `ConstutoraAssinatura.tsx`** — Reescrever seguindo EmpresaAssinatura
- Listagem de planos disponíveis
- Link de pagamento via `asaas-payment-link`
- Estatísticas de uso (corretores, fichas/mês)

**6. `ConstutoraConfiguracoes.tsx`** — Aprimorar seguindo EmpresaConfiguracoes
- Validação com Zod + react-hook-form
- Tabs (Dados, Notificações, Integrações)
- Formatação CNPJ/telefone

**7. `ConstutoraDetalhesCorretor.tsx`** — Criar (seguindo EmpresaDetalhesCorretor)
- Perfil do corretor, KPIs, tabela de fichas recentes

**8. `ConstutoraEquipes.tsx`** — Criar (seguindo EmpresaEquipes)
- CRUD de equipes hierárquicas, membros, líder, cores, busca
- Usa `construtoraId` ao invés de `imobiliariaId`

**9. `ConstutoraLayout.tsx`** — Adicionar item "Equipes" no menu

**10. `App.tsx`** — Adicionar rotas:
- `/construtora/equipes` → ConstutoraEquipes
- `/construtora/corretores/:userId` → ConstutoraDetalhesCorretor

### Arquivos afetados
1. Migration SQL (equipes schema + RLS)
2. `src/pages/construtora/ConstrutoraDashboard.tsx`
3. `src/pages/construtora/ConstutoraFichas.tsx` (renomeado de ConstutoraFichas)
4. `src/pages/construtora/ConstutoraRelatorios.tsx`
5. `src/pages/construtora/ConstutoraAssinatura.tsx` (renomeado)
6. `src/pages/construtora/ConstutoraConfiguracoes.tsx` (renomeado)
7. `src/pages/construtora/ConstutoraDetalhesCorretor.tsx` (novo)
8. `src/pages/construtora/ConstutoraEquipes.tsx` (novo)
9. `src/components/layouts/ConstutoraLayout.tsx`
10. `src/App.tsx`

### Ordem de implementação
Devido ao volume, será implementado em 3-4 mensagens:
1. Migration + Equipes + DetalhesCorretor + Layout + Rotas
2. Dashboard + Fichas
3. Relatórios + Assinatura + Configurações

