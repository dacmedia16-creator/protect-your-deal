

## Plano: Módulo Completo de Construtoras

### Visão geral

Adicionar "Construtora" como um novo tipo de entidade no sistema, hierarquicamente acima das imobiliárias. A construtora pode ter corretores próprios E vincular imobiliárias parceiras aos seus empreendimentos, com visibilidade total das fichas de visita.

```text
┌──────────────────────────────┐
│         Super Admin          │
├──────────────────────────────┤
│        Construtora           │  ← NOVO
│   ┌──────────┬──────────┐    │
│   │ Corretores│ Imob.    │   │
│   │ Próprios  │ Parceiras│   │
│   └──────────┴──────────┘    │
├──────────────────────────────┤
│  Imobiliária (existente)     │
│  Corretor Autônomo (existente│
└──────────────────────────────┘
```

---

### FASE 1 — Banco de dados (migrations)

**1.1 Novo enum role: `construtora_admin`**
```sql
ALTER TYPE public.app_role ADD VALUE 'construtora_admin';
```

**1.2 Tabela `construtoras`**
```sql
CREATE TABLE public.construtoras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT,
  email TEXT NOT NULL,
  telefone TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'ativo',
  codigo INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
- Trigger para gerar código sequencial (similar a `generate_imobiliaria_codigo`)
- Trigger para normalizar telefone
- RLS: super_admin full access, construtora_admin pode ver a sua

**1.3 Tabela `empreendimentos`** (projetos da construtora)
```sql
CREATE TABLE public.empreendimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  construtora_id UUID NOT NULL REFERENCES construtoras(id),
  nome TEXT NOT NULL,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  tipo TEXT NOT NULL DEFAULT 'residencial', -- residencial, comercial, misto
  status TEXT NOT NULL DEFAULT 'ativo', -- ativo, em_obras, entregue, cancelado
  descricao TEXT,
  total_unidades INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**1.4 Tabela `construtora_imobiliarias`** (parceria hierárquica)
```sql
CREATE TABLE public.construtora_imobiliarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  construtora_id UUID NOT NULL REFERENCES construtoras(id),
  imobiliaria_id UUID NOT NULL REFERENCES imobiliarias(id),
  status TEXT NOT NULL DEFAULT 'ativa', -- ativa, suspensa, encerrada
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(construtora_id, imobiliaria_id)
);
```

**1.5 Tabela `empreendimento_imobiliarias`** (quais imobiliárias podem vender cada empreendimento)
```sql
CREATE TABLE public.empreendimento_imobiliarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empreendimento_id UUID NOT NULL REFERENCES empreendimentos(id),
  imobiliaria_id UUID NOT NULL REFERENCES imobiliarias(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empreendimento_id, imobiliaria_id)
);
```

**1.6 Adicionar `construtora_id` em tabelas existentes**
- `user_roles`: adicionar coluna `construtora_id UUID REFERENCES construtoras(id)`
- `assinaturas`: adicionar coluna `construtora_id UUID REFERENCES construtoras(id)`
- `fichas_visita`: adicionar coluna `construtora_id UUID REFERENCES construtoras(id)` e `empreendimento_id UUID REFERENCES empreendimentos(id)`
- `profiles`: adicionar coluna `construtora_id UUID`

**1.7 Funções de segurança**
```sql
CREATE FUNCTION public.get_user_construtora(_user_id UUID) RETURNS UUID ...
CREATE FUNCTION public.is_construtora_admin(_user_id UUID, _construtora_id UUID) RETURNS BOOLEAN ...
```

**1.8 Planos específicos**
- Adicionar `tipo_cadastro` = `'construtora'` na tabela `planos` (já existe coluna `tipo_cadastro`)
- Adicionar colunas: `max_empreendimentos INTEGER`, `max_imobiliarias_parceiras INTEGER`

**1.9 RLS policies** para todas as novas tabelas + atualizar policies existentes em `fichas_visita`, `user_roles`, `assinaturas`

---

### FASE 2 — Backend (Edge Functions)

**2.1 `registro-construtora/index.ts`** — Registro self-service
- Criar usuário, construtora, user_roles (construtora_admin), assinatura
- Similar ao `registro-imobiliaria`

**2.2 Atualizar funções existentes:**
- `admin-create-user`: suportar role `construtora_admin`
- `admin-update-user`: suportar `construtora_id`
- `admin-list-users`: incluir construtoras
- `master-login`: sem mudanças (já genérico)

**2.3 `construtora-convidar-imobiliaria/index.ts`** — Convite de parceria
- Construtora envia convite para imobiliária existente
- Imobiliária aceita/recusa

---

### FASE 3 — Frontend - Autenticação e Roles

**3.1 `useUserRole.tsx`**
- Adicionar `construtora_admin` ao tipo `AppRole`
- Fetch `construtora_id` do user_roles
- Fetch dados da construtora (similar a imobiliaria)

**3.2 `roleRedirect.ts`**
- `construtora_admin` → `/construtora`

**3.3 `RoleBadge.tsx`**
- Adicionar config para `construtora_admin` (ícone `HardHat` ou `Building`)

**3.4 `RegistroTipo.tsx`**
- Adicionar 4o card: "Construtora"

**3.5 `ProtectedRoute`**
- Adicionar `construtora_admin` aos `allowedRoles` relevantes

---

### FASE 4 — Frontend - Painel da Construtora

**4.1 Layout `ConstutoraLayout.tsx`**
- Similar ao `ImobiliariaLayout`, com menu:
  - Dashboard, Empreendimentos, Imobiliárias Parceiras, Corretores, Fichas, Relatórios, Pesquisas, Configurações, Assinatura

**4.2 Páginas:**
- `ConstrutoraDashboard.tsx` — KPIs: empreendimentos, fichas, imobiliárias parceiras, vendas
- `ConstutoraEmpreendimentos.tsx` — CRUD de empreendimentos
- `ConstutoraImobiliariasParceiras.tsx` — Gerenciar parcerias, convidar imobiliárias
- `ConstutoraCorretores.tsx` — Corretores próprios da construtora
- `ConstutoraFichas.tsx` — Fichas de todos os empreendimentos (próprias + parceiras)
- `ConstutoraRelatorios.tsx` — Relatórios por empreendimento, por imobiliária parceira
- `ConstutoraConfiguracoes.tsx` — Dados da empresa, logo
- `ConstutoraAssinatura.tsx` — Plano e pagamento
- `ConstutoraPesquisas.tsx` — Pesquisas de satisfação

**4.3 Rotas em `App.tsx`**
- `/construtora/*` protegidas com `allowedRoles={['construtora_admin']}`

---

### FASE 5 — Admin (Super Admin)

- `AdminConstrutoras.tsx` — Listar/gerenciar construtoras
- `AdminDetalhesConstrutora.tsx` — Detalhes, plano, parceiras, corretores
- Atualizar `GlobalSearch` para incluir construtoras
- Atualizar `AdminDashboard` com contadores de construtoras

---

### Estimativa de complexidade

| Fase | Arquivos | Complexidade |
|------|----------|-------------|
| 1 - DB | ~3 migrations | Alta |
| 2 - Edge Functions | ~3-5 funções | Média |
| 3 - Auth/Roles | ~5 arquivos | Média |
| 4 - Painel Construtora | ~10 páginas | Alta |
| 5 - Admin | ~3 páginas | Média |

**Total estimado: ~25-30 arquivos novos/modificados**

### Recomendação

Dado o tamanho, sugiro implementar em **etapas aprovadas separadamente**:
1. Primeiro: DB + roles + registro (esqueleto funcional)
2. Segundo: Painel da construtora (páginas)
3. Terceiro: Gestão de parcerias com imobiliárias
4. Quarto: Admin + relatórios

Deseja aprovar e começar pela Fase 1 (banco de dados + roles)?

