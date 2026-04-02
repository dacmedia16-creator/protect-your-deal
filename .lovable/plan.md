

## Plano: Alinhar badge de pendentes com lógica da página

### Problema
O badge no sidebar conta todos os `user_roles` sem organização, incluindo corretores autônomos que possuem assinatura individual. A página `AdminUsuariosPendentes` exclui esses autônomos, causando divergência (badge mostra 6, página mostra 0).

### Alteração

**`src/components/layouts/SuperAdminLayout.tsx`** — linhas 167-180

Atualizar a query para excluir usuários que possuem assinatura individual (mesma lógica da página):

```typescript
// Buscar contagem de usuários pendentes (sem imobiliária e sem assinatura autônoma)
const { data: usuariosPendentesCount } = useQuery({
  queryKey: ['sidebar-usuarios-pendentes'],
  queryFn: async () => {
    // 1. Buscar roles sem organização
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id')
      .is('imobiliaria_id', null)
      .is('construtora_id', null)
      .neq('role', 'super_admin');

    if (!roles || roles.length === 0) return 0;

    const userIds = roles.map(r => r.user_id);

    // 2. Buscar quais desses têm assinatura individual (autônomos)
    const { data: assinaturas } = await supabase
      .from('assinaturas')
      .select('user_id')
      .in('user_id', userIds)
      .is('imobiliaria_id', null)
      .is('construtora_id', null);

    const autonomos = new Set(assinaturas?.map(a => a.user_id) || []);

    // 3. Retornar apenas os que NÃO são autônomos com assinatura
    return userIds.filter(id => !autonomos.has(id)).length;
  },
  refetchInterval: 60000,
});
```

Isso replica exatamente a lógica de filtragem da página `AdminUsuariosPendentes`, garantindo que o badge mostre o mesmo número que a lista real.

