
CREATE TABLE public.construtora_feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  construtora_id uuid NOT NULL REFERENCES public.construtoras(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (construtora_id, feature_key)
);

ALTER TABLE public.construtora_feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage construtora feature flags"
  ON public.construtora_feature_flags FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Construtora admins can read own flags"
  ON public.construtora_feature_flags FOR SELECT TO authenticated
  USING (public.is_construtora_admin(auth.uid(), construtora_id));
