CREATE TABLE public.fichas_ocultas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ficha_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, ficha_id)
);

ALTER TABLE public.fichas_ocultas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário pode ver suas ocultações"
  ON public.fichas_ocultas FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Usuário pode ocultar fichas"
  ON public.fichas_ocultas FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuário pode desfazer ocultação"
  ON public.fichas_ocultas FOR DELETE TO authenticated
  USING (user_id = auth.uid());