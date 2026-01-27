-- Tabela para log de emails enviados
CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_tipo TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  ficha_id UUID REFERENCES public.fichas_visita(id) ON DELETE SET NULL,
  user_id UUID,
  imobiliaria_id UUID REFERENCES public.imobiliarias(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para email_logs
CREATE POLICY "Super admin pode ver todos email_logs"
  ON public.email_logs FOR SELECT
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admin pode gerenciar email_logs"
  ON public.email_logs FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Admin imobiliária pode ver logs da sua imobiliária"
  ON public.email_logs FOR SELECT
  USING (
    imobiliaria_id = get_user_imobiliaria(auth.uid())
    AND is_imobiliaria_admin(auth.uid(), imobiliaria_id)
  );

CREATE POLICY "Usuário pode ver seus próprios logs"
  ON public.email_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Sistema pode inserir logs"
  ON public.email_logs FOR INSERT
  WITH CHECK (true);

-- Tabela para templates de email
CREATE TABLE public.templates_email (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL,
  nome TEXT NOT NULL,
  assunto TEXT NOT NULL,
  conteudo_html TEXT NOT NULL,
  conteudo_texto TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  user_id UUID,
  imobiliaria_id UUID REFERENCES public.imobiliarias(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.templates_email ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para templates_email
CREATE POLICY "Super admin pode gerenciar todos templates"
  ON public.templates_email FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Admin imobiliária pode gerenciar templates da sua imobiliária"
  ON public.templates_email FOR ALL
  USING (
    imobiliaria_id = get_user_imobiliaria(auth.uid())
    AND is_imobiliaria_admin(auth.uid(), imobiliaria_id)
  );

CREATE POLICY "Usuário pode ver templates globais"
  ON public.templates_email FOR SELECT
  USING (imobiliaria_id IS NULL AND user_id IS NULL);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_templates_email_updated_at
  BEFORE UPDATE ON public.templates_email
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir templates padrão do sistema
INSERT INTO public.templates_email (tipo, nome, assunto, conteudo_html, conteudo_texto) VALUES
('boas_vindas', 'Boas-vindas', 'Bem-vindo ao VisitaProva! 🏠', 
'<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="color: #2563eb;">VisitaProva</h1>
  <p style="color: #64748b;">Registro de intermediação</p>
</div>
<h2 style="color: #1e293b;">Olá, {nome}! 👋</h2>
<p style="color: #475569;">Seja bem-vindo ao <strong>VisitaProva</strong>! Sua conta foi criada com sucesso.</p>
<p style="color: #475569;">Com o VisitaProva você pode:</p>
<ul style="color: #475569;">
  <li>Registrar visitas com comprovação digital</li>
  <li>Enviar confirmações via WhatsApp</li>
  <li>Gerar comprovantes em PDF</li>
  <li>Proteger suas intermediações</li>
</ul>
<div style="text-align: center; margin: 30px 0;">
  <a href="{link}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Acessar Minha Conta</a>
</div>
<p style="color: #94a3b8; font-size: 14px; text-align: center;">Se você não criou esta conta, ignore este email.</p>
<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
<p style="color: #94a3b8; font-size: 12px; text-align: center;">VisitaProva - Registro de intermediação<br>visitaprova.com.br</p>
</body></html>',
'Olá, {nome}!

Seja bem-vindo ao VisitaProva! Sua conta foi criada com sucesso.

Com o VisitaProva você pode:
- Registrar visitas com comprovação digital
- Enviar confirmações via WhatsApp
- Gerar comprovantes em PDF
- Proteger suas intermediações

Acesse sua conta: {link}

Se você não criou esta conta, ignore este email.

--
VisitaProva - Registro de intermediação
visitaprova.com.br'),

('assinatura_ativa', 'Assinatura Ativada', 'Sua assinatura foi ativada! ✅', 
'<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="color: #2563eb;">VisitaProva</h1>
  <p style="color: #64748b;">Registro de intermediação</p>
</div>
<h2 style="color: #1e293b;">Pagamento Confirmado! 🎉</h2>
<p style="color: #475569;">Olá, <strong>{nome}</strong>!</p>
<p style="color: #475569;">Recebemos o pagamento da sua assinatura do plano <strong>{plano}</strong>.</p>
<div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
  <p style="color: #166534; margin: 0;"><strong>✅ Sua assinatura está ativa!</strong></p>
  <p style="color: #166534; margin: 10px 0 0 0;">Valor: R$ {valor}</p>
</div>
<div style="text-align: center; margin: 30px 0;">
  <a href="{link}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Acessar Minha Conta</a>
</div>
<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
<p style="color: #94a3b8; font-size: 12px; text-align: center;">VisitaProva - Registro de intermediação<br>visitaprova.com.br</p>
</body></html>',
'Olá, {nome}!

Recebemos o pagamento da sua assinatura do plano {plano}.

✅ Sua assinatura está ativa!
Valor: R$ {valor}

Acesse sua conta: {link}

--
VisitaProva - Registro de intermediação
visitaprova.com.br'),

('lembrete_pagamento', 'Lembrete de Pagamento', 'Lembrete: Pagamento pendente ⚠️', 
'<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="color: #2563eb;">VisitaProva</h1>
  <p style="color: #64748b;">Registro de intermediação</p>
</div>
<h2 style="color: #1e293b;">Lembrete de Pagamento ⚠️</h2>
<p style="color: #475569;">Olá, <strong>{nome}</strong>!</p>
<p style="color: #475569;">Identificamos que o pagamento da sua assinatura está pendente.</p>
<div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 20px; margin: 20px 0;">
  <p style="color: #92400e; margin: 0;"><strong>⚠️ Pagamento Pendente</strong></p>
  <p style="color: #92400e; margin: 10px 0 0 0;">Plano: {plano}<br>Valor: R$ {valor}</p>
</div>
<p style="color: #475569;">Para evitar a suspensão do seu acesso, regularize seu pagamento o mais rápido possível.</p>
<div style="text-align: center; margin: 30px 0;">
  <a href="{link}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Regularizar Pagamento</a>
</div>
<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
<p style="color: #94a3b8; font-size: 12px; text-align: center;">VisitaProva - Registro de intermediação<br>visitaprova.com.br</p>
</body></html>',
'Olá, {nome}!

Identificamos que o pagamento da sua assinatura está pendente.

⚠️ Pagamento Pendente
Plano: {plano}
Valor: R$ {valor}

Para evitar a suspensão do seu acesso, regularize seu pagamento o mais rápido possível.

Regularize aqui: {link}

--
VisitaProva - Registro de intermediação
visitaprova.com.br'),

('reset_senha', 'Reset de Senha', 'Redefinir sua senha 🔐', 
'<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="color: #2563eb;">VisitaProva</h1>
  <p style="color: #64748b;">Registro de intermediação</p>
</div>
<h2 style="color: #1e293b;">Redefinir Senha 🔐</h2>
<p style="color: #475569;">Olá!</p>
<p style="color: #475569;">Recebemos uma solicitação para redefinir a senha da sua conta.</p>
<div style="text-align: center; margin: 30px 0;">
  <a href="{link}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Redefinir Minha Senha</a>
</div>
<p style="color: #475569;">Este link expira em <strong>1 hora</strong>.</p>
<p style="color: #94a3b8; font-size: 14px;">Se você não solicitou a redefinição de senha, ignore este email. Sua senha permanecerá inalterada.</p>
<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
<p style="color: #94a3b8; font-size: 12px; text-align: center;">VisitaProva - Registro de intermediação<br>visitaprova.com.br</p>
</body></html>',
'Olá!

Recebemos uma solicitação para redefinir a senha da sua conta.

Clique no link abaixo para redefinir sua senha:
{link}

Este link expira em 1 hora.

Se você não solicitou a redefinição de senha, ignore este email. Sua senha permanecerá inalterada.

--
VisitaProva - Registro de intermediação
visitaprova.com.br'),

('confirmacao_visita', 'Confirmação de Visita', 'Visita confirmada! ✅ Protocolo {protocolo}', 
'<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="color: #2563eb;">VisitaProva</h1>
  <p style="color: #64748b;">Registro de intermediação</p>
</div>
<h2 style="color: #1e293b;">Visita Confirmada! ✅</h2>
<p style="color: #475569;">Olá, <strong>{nome}</strong>!</p>
<p style="color: #475569;">A visita foi confirmada com sucesso.</p>
<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
  <p style="color: #1e293b; margin: 0 0 10px 0;"><strong>Protocolo:</strong> {protocolo}</p>
  <p style="color: #1e293b; margin: 0 0 10px 0;"><strong>Endereço:</strong> {endereco}</p>
  <p style="color: #1e293b; margin: 0;"><strong>Data:</strong> {data_visita}</p>
</div>
<div style="text-align: center; margin: 30px 0;">
  <a href="{link}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Ver Comprovante</a>
</div>
<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
<p style="color: #94a3b8; font-size: 12px; text-align: center;">VisitaProva - Registro de intermediação<br>visitaprova.com.br</p>
</body></html>',
'Olá, {nome}!

A visita foi confirmada com sucesso.

Protocolo: {protocolo}
Endereço: {endereco}
Data: {data_visita}

Ver comprovante: {link}

--
VisitaProva - Registro de intermediação
visitaprova.com.br');