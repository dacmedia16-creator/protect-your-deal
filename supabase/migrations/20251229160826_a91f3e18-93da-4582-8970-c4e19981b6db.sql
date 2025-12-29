-- Permitir que qualquer pessoa valide um código de imobiliária durante cadastro
CREATE POLICY "Qualquer pessoa pode validar código de imobiliária"
ON public.imobiliarias
FOR SELECT
TO anon, authenticated
USING (true);