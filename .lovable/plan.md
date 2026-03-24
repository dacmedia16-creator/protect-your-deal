

## Adicionar Seção de Depoimentos Dinâmicos na Landing Page

### Resumo
Criar uma tabela `depoimentos` no banco de dados para o super_admin cadastrar/gerenciar depoimentos, e exibir uma seção de carrossel/cards na landing page principal, entre a seção de Preços e o FAQ.

### Mudanças

| Arquivo/Recurso | O que fazer |
|-----------------|------------|
| **Migration SQL** | Criar tabela `depoimentos` (nome, cargo, empresa, texto, nota, avatar_url, ativo, ordem) com RLS: leitura pública para ativos, CRUD para super_admin |
| `src/pages/Index.tsx` | Adicionar seção "Depoimentos" antes do FAQ, buscando da tabela `depoimentos` onde `ativo = true`, ordenado por `ordem`. Cards com avatar, nome, cargo/empresa, texto e estrelas |
| `src/pages/admin/AdminDepoimentos.tsx` | Página CRUD para super_admin gerenciar depoimentos (criar, editar, ativar/desativar, reordenar) |
| `src/App.tsx` | Adicionar rota `/admin/depoimentos` dentro do layout SuperAdmin |
| Layout SuperAdmin | Adicionar link "Depoimentos" no menu de navegação |

### Tabela `depoimentos`

```text
id          uuid PK default gen_random_uuid()
nome        text NOT NULL
cargo       text (nullable) -- ex: "Corretor autônomo"
empresa     text (nullable) -- ex: "Imobiliária XYZ"
texto       text NOT NULL
nota        integer NOT NULL default 5 (1-5 estrelas)
avatar_url  text (nullable)
ativo       boolean default true
ordem       integer default 0
created_at  timestamptz default now()
```

**RLS:**
- SELECT para `anon` e `authenticated`: onde `ativo = true` (público, sem login)
- ALL para `authenticated` com `is_super_admin(auth.uid())`

### Design da seção na landing
- Título: "O que nossos clientes dizem"
- Badge: icone Star + "Depoimentos"
- Grid 1-3 colunas responsivo com cards
- Cada card: avatar (ou iniciais), nome, cargo/empresa, estrelas amarelas, texto em itálico
- Estilo consistente com as demais seções (Card com bg-card, bordas arredondadas)
- Se não houver depoimentos ativos, a seção não aparece

### Painel Admin
- Tabela listando todos os depoimentos com toggle ativo/inativo
- Dialog para criar/editar com campos: nome, cargo, empresa, texto, nota (1-5), ordem
- Botão deletar com confirmação

