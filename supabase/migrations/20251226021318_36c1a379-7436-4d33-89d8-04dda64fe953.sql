-- Permitir que usuários excluam suas próprias fichas não finalizadas
CREATE POLICY "Usuários podem excluir fichas não finalizadas"
ON public.fichas_visita
FOR DELETE
USING (auth.uid() = user_id AND status != 'confirmado');