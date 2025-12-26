-- =====================================================
-- FASE 1: ESTRUTURA MULTI-TENANT PARA SAAS
-- =====================================================

-- 1. Criar enum de roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'imobiliaria_admin', 'corretor');

-- 2. Criar tabela de imobiliárias
CREATE TABLE public.imobiliarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  email TEXT NOT NULL,
  telefone TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'suspenso', 'inativo')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Criar tabela de planos
CREATE TABLE public.planos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  max_corretores INTEGER NOT NULL DEFAULT 5,
  max_fichas_mes INTEGER NOT NULL DEFAULT 100,
  max_clientes INTEGER NOT NULL DEFAULT 500,
  max_imoveis INTEGER NOT NULL DEFAULT 200,
  valor_mensal NUMERIC(10,2) NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Criar tabela de assinaturas
CREATE TABLE public.assinaturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imobiliaria_id UUID NOT NULL REFERENCES public.imobiliarias(id) ON DELETE CASCADE,
  plano_id UUID NOT NULL REFERENCES public.planos(id),
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'pendente', 'suspensa', 'cancelada', 'trial')),
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE,
  proxima_cobranca DATE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Criar tabela de roles de usuário
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  imobiliaria_id UUID REFERENCES public.imobiliarias(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, imobiliaria_id)
);

-- 6. Criar tabela de convites
CREATE TABLE public.convites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imobiliaria_id UUID NOT NULL REFERENCES public.imobiliarias(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'corretor',
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aceito', 'expirado', 'cancelado')),
  convidado_por UUID REFERENCES auth.users(id),
  aceito_em TIMESTAMP WITH TIME ZONE,
  expira_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Criar tabela de logs de auditoria
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  imobiliaria_id UUID REFERENCES public.imobiliarias(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Adicionar coluna imobiliaria_id nas tabelas existentes
ALTER TABLE public.profiles ADD COLUMN imobiliaria_id UUID REFERENCES public.imobiliarias(id) ON DELETE SET NULL;
ALTER TABLE public.clientes ADD COLUMN imobiliaria_id UUID REFERENCES public.imobiliarias(id) ON DELETE CASCADE;
ALTER TABLE public.fichas_visita ADD COLUMN imobiliaria_id UUID REFERENCES public.imobiliarias(id) ON DELETE CASCADE;
ALTER TABLE public.imoveis ADD COLUMN imobiliaria_id UUID REFERENCES public.imobiliarias(id) ON DELETE CASCADE;
ALTER TABLE public.templates_mensagem ADD COLUMN imobiliaria_id UUID REFERENCES public.imobiliarias(id) ON DELETE CASCADE;

-- =====================================================
-- FUNÇÕES SECURITY DEFINER PARA EVITAR RECURSÃO RLS
-- =====================================================

-- Função para verificar se usuário tem role específico
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para verificar se é super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'super_admin')
$$;

-- Função para obter imobiliária do usuário
CREATE OR REPLACE FUNCTION public.get_user_imobiliaria(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT imobiliaria_id
  FROM public.user_roles
  WHERE user_id = _user_id
    AND imobiliaria_id IS NOT NULL
  LIMIT 1
$$;

-- Função para verificar se é admin da imobiliária
CREATE OR REPLACE FUNCTION public.is_imobiliaria_admin(_user_id UUID, _imobiliaria_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'imobiliaria_admin'
      AND imobiliaria_id = _imobiliaria_id
  )
$$;

-- Função para verificar se usuário pertence à imobiliária
CREATE OR REPLACE FUNCTION public.user_belongs_to_imobiliaria(_user_id UUID, _imobiliaria_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND imobiliaria_id = _imobiliaria_id
  )
$$;

-- Função para verificar status da assinatura
CREATE OR REPLACE FUNCTION public.check_subscription_status(_imobiliaria_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT status FROM public.assinaturas 
     WHERE imobiliaria_id = _imobiliaria_id 
     ORDER BY created_at DESC LIMIT 1),
    'sem_assinatura'
  )
$$;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.imobiliarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para IMOBILIARIAS
CREATE POLICY "Super admin pode ver todas imobiliárias" ON public.imobiliarias
  FOR SELECT USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admin pode criar imobiliárias" ON public.imobiliarias
  FOR INSERT WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admin pode atualizar imobiliárias" ON public.imobiliarias
  FOR UPDATE USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admin pode deletar imobiliárias" ON public.imobiliarias
  FOR DELETE USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Usuários podem ver sua própria imobiliária" ON public.imobiliarias
  FOR SELECT USING (id = public.get_user_imobiliaria(auth.uid()));

-- Políticas para PLANOS (públicos para leitura)
CREATE POLICY "Qualquer um pode ver planos ativos" ON public.planos
  FOR SELECT USING (ativo = true);

CREATE POLICY "Super admin gerencia planos" ON public.planos
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- Políticas para ASSINATURAS
CREATE POLICY "Super admin pode ver todas assinaturas" ON public.assinaturas
  FOR SELECT USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admin pode gerenciar assinaturas" ON public.assinaturas
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Admin imobiliária pode ver sua assinatura" ON public.assinaturas
  FOR SELECT USING (imobiliaria_id = public.get_user_imobiliaria(auth.uid()));

-- Políticas para USER_ROLES
CREATE POLICY "Super admin pode ver todos roles" ON public.user_roles
  FOR SELECT USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admin pode gerenciar roles" ON public.user_roles
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Usuário pode ver seu próprio role" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admin imobiliária pode ver roles da sua imobiliária" ON public.user_roles
  FOR SELECT USING (
    imobiliaria_id = public.get_user_imobiliaria(auth.uid()) 
    AND public.is_imobiliaria_admin(auth.uid(), imobiliaria_id)
  );

CREATE POLICY "Admin imobiliária pode criar roles na sua imobiliária" ON public.user_roles
  FOR INSERT WITH CHECK (
    imobiliaria_id = public.get_user_imobiliaria(auth.uid())
    AND public.is_imobiliaria_admin(auth.uid(), imobiliaria_id)
    AND role = 'corretor'
  );

CREATE POLICY "Admin imobiliária pode deletar roles de corretores" ON public.user_roles
  FOR DELETE USING (
    imobiliaria_id = public.get_user_imobiliaria(auth.uid())
    AND public.is_imobiliaria_admin(auth.uid(), imobiliaria_id)
    AND role = 'corretor'
  );

-- Políticas para CONVITES
CREATE POLICY "Admin imobiliária pode ver convites da sua imobiliária" ON public.convites
  FOR SELECT USING (imobiliaria_id = public.get_user_imobiliaria(auth.uid()));

CREATE POLICY "Admin imobiliária pode criar convites" ON public.convites
  FOR INSERT WITH CHECK (
    imobiliaria_id = public.get_user_imobiliaria(auth.uid())
    AND public.is_imobiliaria_admin(auth.uid(), imobiliaria_id)
  );

CREATE POLICY "Admin imobiliária pode atualizar convites" ON public.convites
  FOR UPDATE USING (
    imobiliaria_id = public.get_user_imobiliaria(auth.uid())
    AND public.is_imobiliaria_admin(auth.uid(), imobiliaria_id)
  );

CREATE POLICY "Super admin pode gerenciar convites" ON public.convites
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- Políticas para AUDIT_LOGS
CREATE POLICY "Super admin pode ver todos logs" ON public.audit_logs
  FOR SELECT USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Admin imobiliária pode ver logs da sua imobiliária" ON public.audit_logs
  FOR SELECT USING (imobiliaria_id = public.get_user_imobiliaria(auth.uid()));

CREATE POLICY "Sistema pode inserir logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- ATUALIZAR RLS DAS TABELAS EXISTENTES
-- =====================================================

-- Remover políticas antigas de PROFILES
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem criar seu próprio perfil" ON public.profiles;

-- Novas políticas para PROFILES
CREATE POLICY "Usuários podem ver seu próprio perfil" ON public.profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Usuários podem criar seu próprio perfil" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Super admin pode ver todos perfis" ON public.profiles
  FOR SELECT USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Admin imobiliária pode ver perfis da sua imobiliária" ON public.profiles
  FOR SELECT USING (
    imobiliaria_id = public.get_user_imobiliaria(auth.uid())
    AND public.is_imobiliaria_admin(auth.uid(), imobiliaria_id)
  );

-- Remover políticas antigas de CLIENTES
DROP POLICY IF EXISTS "Usuários podem ver seus próprios clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuários podem criar clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuários podem atualizar seus clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuários podem deletar seus clientes" ON public.clientes;

-- Novas políticas para CLIENTES (multi-tenant)
CREATE POLICY "Corretor pode ver seus clientes" ON public.clientes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Corretor pode criar clientes" ON public.clientes
  FOR INSERT WITH CHECK (
    user_id = auth.uid() 
    AND imobiliaria_id = public.get_user_imobiliaria(auth.uid())
  );

CREATE POLICY "Corretor pode atualizar seus clientes" ON public.clientes
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Corretor pode deletar seus clientes" ON public.clientes
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Admin imobiliária pode ver clientes da sua imobiliária" ON public.clientes
  FOR SELECT USING (
    imobiliaria_id = public.get_user_imobiliaria(auth.uid())
    AND public.is_imobiliaria_admin(auth.uid(), imobiliaria_id)
  );

CREATE POLICY "Super admin pode ver todos clientes" ON public.clientes
  FOR SELECT USING (public.is_super_admin(auth.uid()));

-- Remover políticas antigas de FICHAS_VISITA
DROP POLICY IF EXISTS "Usuários podem ver suas próprias fichas" ON public.fichas_visita;
DROP POLICY IF EXISTS "Usuários podem criar fichas" ON public.fichas_visita;
DROP POLICY IF EXISTS "Usuários podem atualizar suas fichas" ON public.fichas_visita;
DROP POLICY IF EXISTS "Usuários podem excluir fichas não finalizadas" ON public.fichas_visita;

-- Novas políticas para FICHAS_VISITA (multi-tenant)
CREATE POLICY "Corretor pode ver suas fichas" ON public.fichas_visita
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Corretor pode criar fichas" ON public.fichas_visita
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND imobiliaria_id = public.get_user_imobiliaria(auth.uid())
  );

CREATE POLICY "Corretor pode atualizar suas fichas" ON public.fichas_visita
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Corretor pode excluir fichas não finalizadas" ON public.fichas_visita
  FOR DELETE USING (user_id = auth.uid() AND status <> 'confirmado');

CREATE POLICY "Admin imobiliária pode ver fichas da sua imobiliária" ON public.fichas_visita
  FOR SELECT USING (
    imobiliaria_id = public.get_user_imobiliaria(auth.uid())
    AND public.is_imobiliaria_admin(auth.uid(), imobiliaria_id)
  );

CREATE POLICY "Super admin pode ver todas fichas" ON public.fichas_visita
  FOR SELECT USING (public.is_super_admin(auth.uid()));

-- Remover políticas antigas de IMOVEIS
DROP POLICY IF EXISTS "Usuários podem ver seus próprios imóveis" ON public.imoveis;
DROP POLICY IF EXISTS "Usuários podem criar imóveis" ON public.imoveis;
DROP POLICY IF EXISTS "Usuários podem atualizar seus imóveis" ON public.imoveis;
DROP POLICY IF EXISTS "Usuários podem deletar seus imóveis" ON public.imoveis;

-- Novas políticas para IMOVEIS (multi-tenant)
CREATE POLICY "Corretor pode ver seus imóveis" ON public.imoveis
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Corretor pode criar imóveis" ON public.imoveis
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND imobiliaria_id = public.get_user_imobiliaria(auth.uid())
  );

CREATE POLICY "Corretor pode atualizar seus imóveis" ON public.imoveis
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Corretor pode deletar seus imóveis" ON public.imoveis
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Admin imobiliária pode ver imóveis da sua imobiliária" ON public.imoveis
  FOR SELECT USING (
    imobiliaria_id = public.get_user_imobiliaria(auth.uid())
    AND public.is_imobiliaria_admin(auth.uid(), imobiliaria_id)
  );

CREATE POLICY "Super admin pode ver todos imóveis" ON public.imoveis
  FOR SELECT USING (public.is_super_admin(auth.uid()));

-- Remover políticas antigas de TEMPLATES_MENSAGEM
DROP POLICY IF EXISTS "Usuários podem ver seus templates" ON public.templates_mensagem;
DROP POLICY IF EXISTS "Usuários podem criar templates" ON public.templates_mensagem;
DROP POLICY IF EXISTS "Usuários podem atualizar seus templates" ON public.templates_mensagem;
DROP POLICY IF EXISTS "Usuários podem deletar seus templates" ON public.templates_mensagem;

-- Novas políticas para TEMPLATES_MENSAGEM (multi-tenant)
CREATE POLICY "Usuário pode ver seus templates" ON public.templates_mensagem
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Usuário pode criar templates" ON public.templates_mensagem
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND imobiliaria_id = public.get_user_imobiliaria(auth.uid())
  );

CREATE POLICY "Usuário pode atualizar seus templates" ON public.templates_mensagem
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Usuário pode deletar seus templates" ON public.templates_mensagem
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Admin imobiliária pode ver templates da sua imobiliária" ON public.templates_mensagem
  FOR SELECT USING (
    imobiliaria_id = public.get_user_imobiliaria(auth.uid())
    AND public.is_imobiliaria_admin(auth.uid(), imobiliaria_id)
  );

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

CREATE TRIGGER update_imobiliarias_updated_at
  BEFORE UPDATE ON public.imobiliarias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_planos_updated_at
  BEFORE UPDATE ON public.planos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assinaturas_updated_at
  BEFORE UPDATE ON public.assinaturas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- INSERIR PLANOS INICIAIS
-- =====================================================

INSERT INTO public.planos (nome, descricao, max_corretores, max_fichas_mes, max_clientes, max_imoveis, valor_mensal, ativo) VALUES
('Individual', 'Ideal para corretores autônomos', 1, 50, 100, 50, 49.90, true),
('Pequena', 'Para imobiliárias de pequeno porte', 5, 200, 500, 200, 149.90, true),
('Média', 'Para imobiliárias de médio porte', 15, 500, 1500, 500, 299.90, true),
('Grande', 'Para grandes imobiliárias', 50, 2000, 5000, 2000, 599.90, true),
('Enterprise', 'Personalizado para grandes operações', 999, 99999, 99999, 99999, 0, true);