

## Plano: Corrigir página de Corretores da Construtora e adicionar criação

### Problema
1. **Erro 400**: A query tenta fazer join `profiles!inner(...)` via `user_roles`, mas não existe foreign key entre essas tabelas. Erro: `"Could not find a relationship between 'user_roles' and 'profiles'"`.
2. **Sem opção de criar corretor**: A página só lista, não permite adicionar novos corretores.

### Correção

**Arquivo:** `src/pages/construtora/ConstutoraCorretores.tsx`

**1. Corrigir query** — Buscar em 2 etapas:
- Primeiro: buscar `user_roles` filtrados por `construtora_id` e `role = 'corretor'`
- Depois: buscar `profiles` usando os `user_id`s retornados
- Combinar no client-side (mesmo padrão usado em `AdminCorretoresAutonomos` e `AdminDetalhesConstrutora`)

**2. Adicionar funcionalidade de criar corretor** — Dialog com formulário (nome, email, senha, telefone, creci, cpf) que chama a edge function `admin-create-corretor` passando os dados. A edge function já suporta criação por `construtora_admin` (precisa ajuste: atualmente só permite `imobiliaria_admin` e `super_admin`).

**3. Atualizar edge function `admin-create-corretor`** — Adicionar suporte a `construtora_id`: quando o caller é `construtora_admin`, vincular o corretor à construtora em vez de imobiliária.

### Detalhes técnicos

- Query corrigida: 2 queries separadas (`user_roles` + `profiles`) combinadas via `user_id`
- Edge function: adicionar check para `construtora_admin` role e aceitar `construtora_id` no body
- UI: botão "Novo Corretor" + Dialog com form (nome, email, senha obrigatórios; telefone, creci, cpf opcionais)
- Toggle ativo/inativo para corretores existentes

### Arquivos alterados
1. `src/pages/construtora/ConstutoraCorretores.tsx` — Reescrever query + adicionar dialog de criação
2. `supabase/functions/admin-create-corretor/index.ts` — Suporte a `construtora_admin` caller

