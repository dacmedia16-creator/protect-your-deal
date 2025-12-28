-- Criar policy de INSERT para imobiliaria_admin na tabela clientes
CREATE POLICY "Admin imobiliária pode criar clientes da sua imobiliária" 
ON public.clientes 
FOR INSERT 
WITH CHECK (
  (imobiliaria_id = get_user_imobiliaria(auth.uid())) 
  AND is_imobiliaria_admin(auth.uid(), imobiliaria_id)
  AND (user_id = auth.uid())
);

-- Criar policy de UPDATE para imobiliaria_admin na tabela clientes
CREATE POLICY "Admin imobiliária pode atualizar clientes da sua imobiliária" 
ON public.clientes 
FOR UPDATE 
USING (
  (imobiliaria_id = get_user_imobiliaria(auth.uid())) 
  AND is_imobiliaria_admin(auth.uid(), imobiliaria_id)
);

-- Criar policy de DELETE para imobiliaria_admin na tabela clientes
CREATE POLICY "Admin imobiliária pode deletar clientes da sua imobiliária" 
ON public.clientes 
FOR DELETE 
USING (
  (imobiliaria_id = get_user_imobiliaria(auth.uid())) 
  AND is_imobiliaria_admin(auth.uid(), imobiliaria_id)
);