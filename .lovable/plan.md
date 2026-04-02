

## Plano: Corrigir contagem do badge "Pendentes" no sidebar

### Problema
A query do badge no `SuperAdminLayout.tsx` só filtra `imobiliaria_id IS NULL`, mas não filtra `construtora_id IS NULL`. Isso inclui usuários já vinculados a construtoras na contagem. Além disso, não exclui corretores autônomos (que têm assinatura individual), gerando divergência com a página real.

### Alteração

**`src/components/layouts/SuperAdminLayout.tsx`** — query `sidebar-usuarios-pendentes` (linhas ~170-177)

Adicionar `.is('construtora_id', null)` à query:

```typescript
const { count } = await supabase
  .from('user_roles')
  .select('*', { count: 'exact', head: true })
  .is('imobiliaria_id', null)
  .is('construtora_id', null)
  .neq('role', 'super_admin');
```

Isso alinha a contagem do badge com a lógica da página `AdminUsuariosPendentes`.

