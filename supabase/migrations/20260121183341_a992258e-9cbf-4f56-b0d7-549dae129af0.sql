-- Add ON DELETE CASCADE to survey_responses foreign key
ALTER TABLE public.survey_responses 
DROP CONSTRAINT IF EXISTS survey_responses_survey_id_fkey;

ALTER TABLE public.survey_responses
ADD CONSTRAINT survey_responses_survey_id_fkey 
FOREIGN KEY (survey_id) REFERENCES public.surveys(id) ON DELETE CASCADE;

-- Super Admin pode deletar qualquer pesquisa
CREATE POLICY "Super admin pode deletar surveys"
ON public.surveys
FOR DELETE
USING (is_super_admin(auth.uid()));

-- Admin da Imobiliária pode deletar pesquisas da sua imobiliária
CREATE POLICY "Admin imobiliaria pode deletar surveys"
ON public.surveys
FOR DELETE
USING (
  imobiliaria_id = get_user_imobiliaria(auth.uid()) 
  AND is_imobiliaria_admin(auth.uid(), imobiliaria_id)
);