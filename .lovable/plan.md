

## Corrigir escalação de privilégio na política de INSERT da tabela `convites`

### Problema
A política de INSERT na tabela `convites` permite que um `imobiliaria_admin` insira convites com qualquer role, incluindo `super_admin`. O fluxo de aceitação (`AceitarConvite.tsx`, linha 135) copia o role diretamente do convite para `user_roles`, permitindo escalação de privilégio.

### Correção
Atualizar a política RLS de INSERT na tabela `convites` para restringir o campo `role` apenas a `corretor` e `imobiliaria_admin` — impedindo criação de convites com `super_admin`.

**Migration SQL:**
```sql
DROP POLICY "Admin imobiliária pode criar convites" ON public.convites;

CREATE POLICY "Admin imobiliária pode criar convites"
ON public.convites
FOR INSERT
TO public
WITH CHECK (
  imobiliaria_id = get_user_imobiliaria(auth.uid())
  AND is_imobiliaria_admin(auth.uid(), imobiliaria_id)
  AND role IN ('corretor'::app_role, 'imobiliaria_admin'::app_role)
);
```

### Escopo
- 1 migration SQL (drop + recreate policy)
- Nenhuma mudança no frontend
- Bloqueia qualquer tentativa de criar convite com role `super_admin` via RLS

