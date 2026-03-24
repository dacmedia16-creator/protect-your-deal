
CREATE TABLE public.depoimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cargo text,
  empresa text,
  texto text NOT NULL,
  nota integer NOT NULL DEFAULT 5,
  avatar_url text,
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.depoimentos ENABLE ROW LEVEL SECURITY;

-- Public read for active testimonials (no login required)
CREATE POLICY "Anyone can view active depoimentos"
  ON public.depoimentos
  FOR SELECT
  TO anon, authenticated
  USING (ativo = true);

-- Super admin full access
CREATE POLICY "Super admin full access on depoimentos"
  ON public.depoimentos
  FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));
