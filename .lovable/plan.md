

## Plano: Corrigir recursão infinita nas RLS policies de empreendimentos

### Problema
Erro `42P17: infinite recursion detected in policy for relation "empreendimentos"`. A causa é um ciclo entre duas policies:

1. **`empreendimentos`** → policy "Imobiliaria parceira pode ver empreendimentos" consulta `empreendimento_imobiliarias`
2. **`empreendimento_imobiliarias`** → policy "Construtora admin pode gerenciar" consulta `empreendimentos`

Quando o Postgres avalia a policy de `empreendimentos`, ele precisa ler `empreendimento_imobiliarias`, que por sua vez precisa ler `empreendimentos` novamente → recursão infinita.

### Correção (1 migration SQL)

**Recriar a policy de `empreendimento_imobiliarias`** para usar `get_user_construtora()` em vez de fazer JOIN com `empreendimentos`:

```sql
-- Drop the recursive policy
DROP POLICY "Construtora admin pode gerenciar empreendimento_imobiliarias" 
  ON public.empreendimento_imobiliarias;

-- Recreate without querying empreendimentos
CREATE POLICY "Construtora admin pode gerenciar empreendimento_imobiliarias"
  ON public.empreendimento_imobiliarias
  FOR ALL
  TO authenticated
  USING (
    is_construtora_admin(auth.uid(), (SELECT construtora_id FROM public.empreendimentos WHERE id = empreendimento_imobiliarias.empreendimento_id))
  )
  WITH CHECK (
    is_construtora_admin(auth.uid(), (SELECT construtora_id FROM public.empreendimentos WHERE id = empreendimento_imobiliarias.empreendimento_id))
  );
```

Wait -- that still queries empreendimentos. The real fix is to store `construtora_id` on `empreendimento_imobiliarias` or use a different approach.

Actually, the simplest fix: change the `empreendimento_imobiliarias` policy to use `get_user_construtora()` to check if the user's construtora owns any of the linked empreendimentos indirectly -- but we can't avoid the join.

**Better approach**: Use a SECURITY DEFINER function to break the recursion:

```sql
-- Create helper function (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.empreendimento_belongs_to_construtora(
  _empreendimento_id uuid, _construtora_id uuid
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.empreendimentos
    WHERE id = _empreendimento_id AND construtora_id = _construtora_id
  )
$$;

-- Drop recursive policy
DROP POLICY "Construtora admin pode gerenciar empreendimento_imobiliarias"
  ON public.empreendimento_imobiliarias;

-- Recreate using SECURITY DEFINER function (bypasses RLS on empreendimentos)
CREATE POLICY "Construtora admin pode gerenciar empreendimento_imobiliarias"
  ON public.empreendimento_imobiliarias
  FOR ALL TO authenticated
  USING (
    empreendimento_belongs_to_construtora(empreendimento_id, get_user_construtora(auth.uid()))
  )
  WITH CHECK (
    empreendimento_belongs_to_construtora(empreendimento_id, get_user_construtora(auth.uid()))
  );
```

This breaks the recursion because `empreendimento_belongs_to_construtora` is SECURITY DEFINER, so it bypasses RLS when reading `empreendimentos`.

### Resultado esperado
- Criação de empreendimentos funciona sem erro
- Listagem de empreendimentos carrega normalmente
- Sem impacto em outras tabelas

