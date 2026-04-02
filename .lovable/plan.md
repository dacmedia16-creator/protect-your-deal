

## Plano: Suporte a vínculo com Construtora na página de Usuários Pendentes

### Contexto
O usuário "Amaral" é uma construtora, mas a página de Usuários Pendentes só permite vincular a imobiliárias. Precisamos adicionar suporte para vincular a construtoras também.

### Alterações

**1. `src/pages/admin/AdminUsuariosPendentes.tsx`**
- Adicionar query para buscar construtoras ativas (tabela `construtoras`)
- Adicionar estado `selectedType` por usuário (`'imobiliaria' | 'construtora'`) para controlar qual tipo de organização vincular
- Adicionar um seletor de tipo (Imobiliária / Construtora) antes do dropdown de seleção
- Quando "Construtora" for selecionado, mostrar lista de construtoras no dropdown ao invés de imobiliárias
- Ajustar a mutation para enviar `construtora_id` quando o tipo for construtora

**2. `supabase/functions/admin-vincular-usuario/index.ts`**
- Aceitar parâmetro opcional `construtora_id` no body (além de `imobiliaria_id`)
- Validar que pelo menos um dos dois foi enviado
- Quando `construtora_id` for fornecido:
  - Atualizar `user_roles` com `construtora_id` (e role para `construtora_admin`)
  - Atualizar `profiles` com `construtora_id`
  - Pular backfill de fichas (não se aplica a construtoras)

### Fluxo na UI
1. Admin seleciona o tipo: "Imobiliária" ou "Construtora"
2. O dropdown muda para mostrar a lista correspondente
3. Admin clica "Vincular" → chama a edge function com o parâmetro correto

