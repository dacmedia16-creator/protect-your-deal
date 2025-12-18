-- Tabela de perfis de corretores
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  creci TEXT,
  telefone TEXT,
  foto_url TEXT,
  imobiliaria TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seu próprio perfil"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seu próprio perfil"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Tabela de clientes (compradores e proprietários)
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  cpf TEXT,
  telefone TEXT NOT NULL,
  email TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('comprador', 'proprietario')),
  notas TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus próprios clientes"
ON public.clientes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar clientes"
ON public.clientes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus clientes"
ON public.clientes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus clientes"
ON public.clientes FOR DELETE
USING (auth.uid() = user_id);

-- Tabela de imóveis
CREATE TABLE public.imoveis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endereco TEXT NOT NULL,
  tipo TEXT NOT NULL,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  proprietario_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.imoveis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus próprios imóveis"
ON public.imoveis FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar imóveis"
ON public.imoveis FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus imóveis"
ON public.imoveis FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus imóveis"
ON public.imoveis FOR DELETE
USING (auth.uid() = user_id);

-- Tabela de fichas de visita
CREATE TABLE public.fichas_visita (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  protocolo TEXT NOT NULL UNIQUE,
  imovel_endereco TEXT NOT NULL,
  imovel_tipo TEXT NOT NULL,
  proprietario_nome TEXT NOT NULL,
  proprietario_cpf TEXT,
  proprietario_telefone TEXT NOT NULL,
  comprador_nome TEXT NOT NULL,
  comprador_cpf TEXT,
  comprador_telefone TEXT NOT NULL,
  data_visita TIMESTAMP WITH TIME ZONE NOT NULL,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aguardando_comprador', 'aguardando_proprietario', 'completo', 'expirado')),
  proprietario_confirmado_em TIMESTAMP WITH TIME ZONE,
  comprador_confirmado_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.fichas_visita ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias fichas"
ON public.fichas_visita FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar fichas"
ON public.fichas_visita FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas fichas"
ON public.fichas_visita FOR UPDATE
USING (auth.uid() = user_id);

-- Tabela de confirmações OTP
CREATE TABLE public.confirmacoes_otp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ficha_id UUID REFERENCES public.fichas_visita(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('proprietario', 'comprador')),
  codigo TEXT NOT NULL,
  telefone TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  confirmado BOOLEAN DEFAULT false,
  tentativas INTEGER DEFAULT 0,
  expira_em TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.confirmacoes_otp ENABLE ROW LEVEL SECURITY;

-- Permitir acesso público para verificação de OTP (via token único)
CREATE POLICY "Acesso público para verificação OTP"
ON public.confirmacoes_otp FOR SELECT
USING (true);

CREATE POLICY "Acesso público para atualização OTP"
ON public.confirmacoes_otp FOR UPDATE
USING (true);

-- Corretores podem criar OTPs
CREATE POLICY "Corretores podem criar OTPs"
ON public.confirmacoes_otp FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.fichas_visita
    WHERE id = ficha_id AND user_id = auth.uid()
  )
);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at
BEFORE UPDATE ON public.clientes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_imoveis_updated_at
BEFORE UPDATE ON public.imoveis
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fichas_visita_updated_at
BEFORE UPDATE ON public.fichas_visita
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para gerar protocolo único
CREATE OR REPLACE FUNCTION public.generate_protocolo()
RETURNS TEXT AS $$
DECLARE
  prefix TEXT := 'VS';
  year_part TEXT := to_char(now(), 'YY');
  random_part TEXT := upper(substr(md5(random()::text), 1, 6));
BEGIN
  RETURN prefix || year_part || random_part;
END;
$$ LANGUAGE plpgsql;

-- Função para criar perfil automaticamente quando usuário se cadastra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.email));
  RETURN NEW;
END;
$$;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();