

## Plano: Adicionar edição e desativação de corretores da construtora

### Problema
A página de corretores da construtora só tem toggle ativo/inativo (que usa update direto no `profiles` — pode falhar por RLS). Falta funcionalidade de editar dados (nome, telefone, CRECI, CPF) e a edge function `admin-update-corretor` não reconhece `construtora_admin`.

### Alterações

**1. Edge function `admin-update-corretor`** — Adicionar suporte a `construtora_admin`:
- Buscar role `construtora_admin` além de `imobiliaria_admin` e `super_admin`
- Verificar que o corretor alvo pertence à mesma construtora (`user_roles.construtora_id`)
- Permitir edição completa (nome, telefone, creci, cpf, ativo) para `construtora_admin`

**2. Frontend `ConstutoraCorretores.tsx`** — Adicionar dialog de edição:
- Adicionar botão de editar (ícone Pencil) na coluna de ações
- Dialog de edição com campos: nome, telefone, CRECI, CPF
- Chamar `admin-update-corretor` via `invokeWithRetry` para salvar
- Usar a mesma edge function para toggle ativo/inativo (substituir update direto no `profiles`)
- Adicionar confirmação visual ao desativar (AlertDialog)

### Arquivos alterados
1. `supabase/functions/admin-update-corretor/index.ts` — Suporte a `construtora_admin`
2. `src/pages/construtora/ConstutoraCorretores.tsx` — Dialog de edição + usar edge function para toggle

