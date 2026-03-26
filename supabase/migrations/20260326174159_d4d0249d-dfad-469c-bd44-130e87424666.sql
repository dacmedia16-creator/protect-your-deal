-- Create construtoras table
CREATE TABLE public.construtoras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT,
  email TEXT NOT NULL,
  telefone TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'ativo',
  codigo INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.construtoras ENABLE ROW LEVEL SECURITY;

-- Create empreendimentos table
CREATE TABLE public.empreendimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  construtora_id UUID NOT NULL REFERENCES public.construtoras(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  tipo TEXT NOT NULL DEFAULT 'residencial',
  status TEXT NOT NULL DEFAULT 'ativo',
  descricao TEXT,
  total_unidades INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.empreendimentos ENABLE ROW LEVEL SECURITY;

-- Create construtora_imobiliarias table
CREATE TABLE public.construtora_imobiliarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  construtora_id UUID NOT NULL REFERENCES public.construtoras(id) ON DELETE CASCADE,
  imobiliaria_id UUID NOT NULL REFERENCES public.imobiliarias(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'ativa',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(construtora_id, imobiliaria_id)
);
ALTER TABLE public.construtora_imobiliarias ENABLE ROW LEVEL SECURITY;

-- Create empreendimento_imobiliarias table
CREATE TABLE public.empreendimento_imobiliarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empreendimento_id UUID NOT NULL REFERENCES public.empreendimentos(id) ON DELETE CASCADE,
  imobiliaria_id UUID NOT NULL REFERENCES public.imobiliarias(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empreendimento_id, imobiliaria_id)
);
ALTER TABLE public.empreendimento_imobiliarias ENABLE ROW LEVEL SECURITY;

-- Add construtora_id to existing tables
ALTER TABLE public.user_roles ADD COLUMN construtora_id UUID REFERENCES public.construtoras(id);
ALTER TABLE public.assinaturas ADD COLUMN construtora_id UUID REFERENCES public.construtoras(id);
ALTER TABLE public.fichas_visita ADD COLUMN construtora_id UUID REFERENCES public.construtoras(id);
ALTER TABLE public.fichas_visita ADD COLUMN empreendimento_id UUID REFERENCES public.empreendimentos(id);
ALTER TABLE public.profiles ADD COLUMN construtora_id UUID REFERENCES public.construtoras(id);

-- Add plan columns for construtoras
ALTER TABLE public.planos ADD COLUMN max_empreendimentos INTEGER DEFAULT 999;
ALTER TABLE public.planos ADD COLUMN max_imobiliarias_parceiras INTEGER DEFAULT 999;

-- Security functions
CREATE OR REPLACE FUNCTION public.get_user_construtora(_user_id UUID)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT construtora_id FROM public.user_roles WHERE user_id = _user_id AND construtora_id IS NOT NULL LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.is_construtora_admin(_user_id UUID, _construtora_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'construtora_admin' AND construtora_id = _construtora_id) $$;

-- Triggers
CREATE OR REPLACE FUNCTION public.generate_construtora_codigo()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.codigo IS NULL THEN
    SELECT COALESCE(MAX(codigo), 999) + 1 INTO NEW.codigo FROM public.construtoras;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER set_construtora_codigo BEFORE INSERT ON public.construtoras FOR EACH ROW EXECUTE FUNCTION public.generate_construtora_codigo();

CREATE OR REPLACE FUNCTION public.normalize_construtora_phone()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.telefone = normalize_phone(NEW.telefone); RETURN NEW; END; $$;

CREATE TRIGGER normalize_construtora_phone_trigger BEFORE INSERT OR UPDATE ON public.construtoras FOR EACH ROW EXECUTE FUNCTION public.normalize_construtora_phone();
CREATE TRIGGER update_construtoras_updated_at BEFORE UPDATE ON public.construtoras FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_empreendimentos_updated_at BEFORE UPDATE ON public.empreendimentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies: construtoras
CREATE POLICY "Super admin full access construtoras" ON public.construtoras FOR ALL TO public USING (is_super_admin(auth.uid()));
CREATE POLICY "Construtora admin pode ver sua construtora" ON public.construtoras FOR SELECT TO authenticated USING (id = get_user_construtora(auth.uid()));
CREATE POLICY "Construtora admin pode atualizar sua construtora" ON public.construtoras FOR UPDATE TO authenticated USING (is_construtora_admin(auth.uid(), id));

-- RLS: empreendimentos
CREATE POLICY "Super admin full access empreendimentos" ON public.empreendimentos FOR ALL TO public USING (is_super_admin(auth.uid()));
CREATE POLICY "Construtora admin pode gerenciar empreendimentos" ON public.empreendimentos FOR ALL TO authenticated USING (is_construtora_admin(auth.uid(), construtora_id)) WITH CHECK (is_construtora_admin(auth.uid(), construtora_id));
CREATE POLICY "Imobiliaria parceira pode ver empreendimentos" ON public.empreendimentos FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.empreendimento_imobiliarias ei WHERE ei.empreendimento_id = empreendimentos.id AND ei.imobiliaria_id = get_user_imobiliaria(auth.uid())));

-- RLS: construtora_imobiliarias
CREATE POLICY "Super admin full access construtora_imobiliarias" ON public.construtora_imobiliarias FOR ALL TO public USING (is_super_admin(auth.uid()));
CREATE POLICY "Construtora admin pode gerenciar parcerias" ON public.construtora_imobiliarias FOR ALL TO authenticated USING (is_construtora_admin(auth.uid(), construtora_id)) WITH CHECK (is_construtora_admin(auth.uid(), construtora_id));
CREATE POLICY "Imobiliaria pode ver suas parcerias" ON public.construtora_imobiliarias FOR SELECT TO authenticated USING (imobiliaria_id = get_user_imobiliaria(auth.uid()));

-- RLS: empreendimento_imobiliarias
CREATE POLICY "Super admin full access empreendimento_imobiliarias" ON public.empreendimento_imobiliarias FOR ALL TO public USING (is_super_admin(auth.uid()));
CREATE POLICY "Construtora admin pode gerenciar empreendimento_imobiliarias" ON public.empreendimento_imobiliarias FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.empreendimentos e WHERE e.id = empreendimento_imobiliarias.empreendimento_id AND is_construtora_admin(auth.uid(), e.construtora_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.empreendimentos e WHERE e.id = empreendimento_imobiliarias.empreendimento_id AND is_construtora_admin(auth.uid(), e.construtora_id)));
CREATE POLICY "Imobiliaria pode ver seus empreendimento_imobiliarias" ON public.empreendimento_imobiliarias FOR SELECT TO authenticated USING (imobiliaria_id = get_user_imobiliaria(auth.uid()));

-- Additional RLS for existing tables
CREATE POLICY "Construtora admin pode ver fichas dos seus empreendimentos" ON public.fichas_visita FOR SELECT TO authenticated USING (construtora_id = get_user_construtora(auth.uid()) AND get_user_construtora(auth.uid()) IS NOT NULL);
CREATE POLICY "Construtora admin pode ver sua assinatura" ON public.assinaturas FOR SELECT TO authenticated USING (construtora_id = get_user_construtora(auth.uid()) AND get_user_construtora(auth.uid()) IS NOT NULL);
CREATE POLICY "Construtora admin pode ver roles da sua construtora" ON public.user_roles FOR SELECT TO authenticated USING (construtora_id = get_user_construtora(auth.uid()) AND get_user_construtora(auth.uid()) IS NOT NULL);
CREATE POLICY "Construtora admin pode criar roles na sua construtora" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (construtora_id = get_user_construtora(auth.uid()) AND is_construtora_admin(auth.uid(), construtora_id) AND role = 'corretor');

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('logos-construtoras', 'logos-construtoras', true) ON CONFLICT (id) DO NOTHING;