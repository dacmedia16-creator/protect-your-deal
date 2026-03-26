
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

-- Restrict access
REVOKE EXECUTE ON FUNCTION public.empreendimento_belongs_to_construtora FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.empreendimento_belongs_to_construtora TO authenticated;

-- Drop recursive policy
DROP POLICY IF EXISTS "Construtora admin pode gerenciar empreendimento_imobiliarias"
  ON public.empreendimento_imobiliarias;

-- Recreate using SECURITY DEFINER function
CREATE POLICY "Construtora admin pode gerenciar empreendimento_imobiliarias"
  ON public.empreendimento_imobiliarias
  FOR ALL TO authenticated
  USING (
    empreendimento_belongs_to_construtora(empreendimento_id, get_user_construtora(auth.uid()))
  )
  WITH CHECK (
    empreendimento_belongs_to_construtora(empreendimento_id, get_user_construtora(auth.uid()))
  );
