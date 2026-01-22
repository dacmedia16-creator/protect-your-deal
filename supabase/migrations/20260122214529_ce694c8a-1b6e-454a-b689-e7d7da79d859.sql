
-- Função para verificar se usuário é líder de alguma equipe ativa
CREATE OR REPLACE FUNCTION public.is_equipe_lider(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.equipes
    WHERE lider_id = _user_id AND ativa = true
  )
$$;

-- Função para verificar se usuário é líder de uma equipe específica
CREATE OR REPLACE FUNCTION public.is_lider_of_equipe(_user_id uuid, _equipe_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.equipes
    WHERE id = _equipe_id AND lider_id = _user_id AND ativa = true
  )
$$;

-- Função para verificar se um corretor pertence à equipe liderada pelo usuário
CREATE OR REPLACE FUNCTION public.is_membro_da_minha_equipe(_lider_id uuid, _membro_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.equipes e
    JOIN public.equipes_membros em ON em.equipe_id = e.id
    WHERE e.lider_id = _lider_id 
      AND e.ativa = true
      AND em.user_id = _membro_user_id
  )
$$;

-- RLS: Líder pode ver fichas dos membros da sua equipe
CREATE POLICY "Líder pode ver fichas da sua equipe"
ON public.fichas_visita
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.equipes e
    JOIN public.equipes_membros em ON em.equipe_id = e.id
    WHERE e.lider_id = auth.uid()
      AND e.ativa = true
      AND em.user_id = fichas_visita.user_id
  )
);

-- RLS: Líder pode ver surveys dos membros da sua equipe
CREATE POLICY "Líder pode ver surveys da sua equipe"
ON public.surveys
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.equipes e
    JOIN public.equipes_membros em ON em.equipe_id = e.id
    WHERE e.lider_id = auth.uid()
      AND e.ativa = true
      AND em.user_id = surveys.corretor_id
  )
);

-- RLS: Líder pode ver respostas de surveys da sua equipe
CREATE POLICY "Líder pode ver respostas de surveys da sua equipe"
ON public.survey_responses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM surveys s
    JOIN public.equipes e ON e.ativa = true AND e.lider_id = auth.uid()
    JOIN public.equipes_membros em ON em.equipe_id = e.id
    WHERE s.id = survey_responses.survey_id
      AND em.user_id = s.corretor_id
  )
);
