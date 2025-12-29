-- Política para Super Admin deletar qualquer ficha
CREATE POLICY "Super admin pode deletar fichas"
ON public.fichas_visita
FOR DELETE
USING (is_super_admin(auth.uid()));

-- Política para Admin da Imobiliária deletar fichas da sua imobiliária
CREATE POLICY "Admin imobiliária pode deletar fichas da sua imobiliária"
ON public.fichas_visita
FOR DELETE
USING (
  imobiliaria_id = get_user_imobiliaria(auth.uid()) 
  AND is_imobiliaria_admin(auth.uid(), imobiliaria_id)
);