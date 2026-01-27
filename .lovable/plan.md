
# Plano: Implementar Suporte a Multiplos Remetentes de Email

## Visao Geral

Configurar o sistema para usar os 4 emails do Zoho de forma inteligente:

| Email | Uso | Exemplos |
|-------|-----|----------|
| `noreply@visitaprova.com.br` | Notificacoes automaticas | OTPs, confirmacoes, lembretes |
| `suporte@visitaprova.com.br` | Tickets de suporte | Respostas a duvidas, problemas |
| `contato@visitaprova.com.br` | Comercial | Boas-vindas, upsell, renovacoes |
| `denis@visitaprova.com.br` | Pessoal/Admin | Casos especiais, VIPs |

---

## Fase 1: Banco de Dados

### 1.1 Criar tabela de remetentes

Nova tabela `email_remetentes` para armazenar os emails disponiveis:

```text
+-------------------+-------------------+
| Campo             | Tipo              |
+-------------------+-------------------+
| id                | uuid (PK)         |
| email             | text (unique)     |
| nome_exibicao     | text              |
| categoria         | text              |
| ativo             | boolean           |
| created_at        | timestamp         |
+-------------------+-------------------+
```

**Categorias sugeridas:** `sistema`, `suporte`, `comercial`, `admin`

### 1.2 Adicionar coluna na tabela templates_email

Adicionar campo `remetente_email` para definir qual email usa cada template:

```sql
ALTER TABLE templates_email 
ADD COLUMN remetente_email text DEFAULT 'noreply@visitaprova.com.br';
```

### 1.3 Adicionar coluna na tabela email_logs

Para rastrear de qual email foi enviado:

```sql
ALTER TABLE email_logs 
ADD COLUMN from_email text;
```

---

## Fase 2: Secrets (Credenciais)

Configurar App Passwords separadas para cada email Zoho:

| Secret | Valor |
|--------|-------|
| `ZOHO_NOREPLY_USER` | noreply@visitaprova.com.br |
| `ZOHO_NOREPLY_PASSWORD` | [App Password] |
| `ZOHO_SUPORTE_USER` | suporte@visitaprova.com.br |
| `ZOHO_SUPORTE_PASSWORD` | [App Password] |
| `ZOHO_CONTATO_USER` | contato@visitaprova.com.br |
| `ZOHO_CONTATO_PASSWORD` | [App Password] |
| `ZOHO_DENIS_USER` | denis@visitaprova.com.br |
| `ZOHO_DENIS_PASSWORD` | [App Password] |

**Obs:** Manter `ZOHO_SMTP_USER` e `ZOHO_SMTP_PASSWORD` atuais como fallback para o noreply.

---

## Fase 3: Edge Function (send-email)

### 3.1 Logica de selecao de remetente

Atualizar a edge function para:

1. Receber parametro opcional `from_email` na requisicao
2. Se usar template, buscar o `remetente_email` do template
3. Selecionar as credenciais corretas baseado no email
4. Fazer fallback para noreply se credenciais nao encontradas

### 3.2 Pseudo-codigo da nova logica

```text
function getCredentials(fromEmail):
    if fromEmail contains "suporte":
        return { user: ZOHO_SUPORTE_USER, pass: ZOHO_SUPORTE_PASSWORD }
    else if fromEmail contains "contato":
        return { user: ZOHO_CONTATO_USER, pass: ZOHO_CONTATO_PASSWORD }
    else if fromEmail contains "denis":
        return { user: ZOHO_DENIS_USER, pass: ZOHO_DENIS_PASSWORD }
    else:
        return { user: ZOHO_SMTP_USER, pass: ZOHO_SMTP_PASSWORD }
```

### 3.3 Nova interface da requisicao

```typescript
interface SendEmailRequest {
  action: 'send' | 'send-template' | 'test-connection';
  to?: string;
  subject?: string;
  html?: string;
  text?: string;
  template_tipo?: string;
  variables?: Record<string, string>;
  ficha_id?: string;
  from_email?: string;  // NOVO: escolher remetente
}
```

---

## Fase 4: Frontend (ConfiguracoesEmail.tsx)

### 4.1 Nova aba "Remetentes"

Adicionar terceira aba para gerenciar os emails:
- Listar remetentes cadastrados
- Testar conexao de cada um individualmente
- Ativar/desativar remetentes

### 4.2 Atualizar edicao de templates

No modal de edicao de template, adicionar dropdown para selecionar o remetente:

```text
[Remetente: noreply@visitaprova.com.br ▼]
  - noreply@visitaprova.com.br (Sistema)
  - suporte@visitaprova.com.br (Suporte)
  - contato@visitaprova.com.br (Comercial)
```

### 4.3 Atualizar teste de email

Permitir escolher de qual email enviar o teste.

---

## Resumo de Arquivos

| Arquivo | Acao |
|---------|------|
| Migration SQL | Criar tabela email_remetentes, alterar templates_email e email_logs |
| supabase/functions/send-email/index.ts | Adicionar logica multi-remetente |
| src/pages/ConfiguracoesEmail.tsx | Adicionar aba Remetentes e dropdown no template |

---

## Secao Tecnica Detalhada

### Migration SQL Completa

```sql
-- 1. Criar tabela de remetentes
CREATE TABLE public.email_remetentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  nome_exibicao text NOT NULL DEFAULT 'VisitaProva',
  categoria text NOT NULL DEFAULT 'sistema',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Inserir remetentes padrao
INSERT INTO public.email_remetentes (email, nome_exibicao, categoria) VALUES
  ('noreply@visitaprova.com.br', 'VisitaProva', 'sistema'),
  ('suporte@visitaprova.com.br', 'Suporte VisitaProva', 'suporte'),
  ('contato@visitaprova.com.br', 'Contato VisitaProva', 'comercial'),
  ('denis@visitaprova.com.br', 'Denis - VisitaProva', 'admin');

-- 3. Adicionar campo de remetente aos templates
ALTER TABLE public.templates_email 
ADD COLUMN remetente_email text DEFAULT 'noreply@visitaprova.com.br';

-- 4. Adicionar campo from_email ao log
ALTER TABLE public.email_logs 
ADD COLUMN from_email text;

-- 5. RLS para email_remetentes (somente super_admin)
ALTER TABLE public.email_remetentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin pode gerenciar remetentes"
  ON public.email_remetentes FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admin pode ver remetentes"
  ON public.email_remetentes FOR SELECT
  USING (is_super_admin(auth.uid()));
```

### Edge Function - Mudancas Principais

1. Adicionar mapeamento de credenciais por email
2. Modificar createTransporter para aceitar credenciais dinamicas
3. Ao usar template, buscar remetente_email do banco
4. Registrar from_email no email_logs

### Ordem de Implementacao

1. Solicitar App Passwords do Zoho para cada email
2. Adicionar secrets ao projeto
3. Executar migration do banco
4. Atualizar edge function
5. Atualizar frontend
6. Testar cada remetente

---

## Prerequisito

Antes de implementar, voce precisara gerar **App Passwords** no Zoho para cada email:

1. Acessar https://accounts.zoho.com/
2. Ir em Security → App Passwords
3. Gerar uma senha para cada email que sera usado
4. Fornecer as senhas para configurar os secrets
