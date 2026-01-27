
# Plano: Integração Zoho Mail com VisitaProva

## Objetivo
Adicionar capacidade de envio de emails transacionais automáticos via Zoho Mail (SMTP) como canal adicional/complementar ao WhatsApp existente.

## Pre-requisitos
Antes de implementar, você precisa:

1. **Criar conta de email no Zoho Mail**
   - Acesse o painel do Zoho Mail
   - Crie o email `noreply@visitaprova.com.br`
   - Anote as credenciais

2. **Gerar App Password (Senha de Aplicativo)**
   - No Zoho Mail: Configurações → Segurança → Senhas de Aplicativo
   - Crie uma senha específica para o VisitaProva
   - Esta senha sera usada no SMTP (obrigatório se 2FA ativo)

3. **Configurar DKIM (Recomendado)**
   - Melhora entregabilidade dos emails
   - Configure no painel do Zoho e adicione registro DNS na Hostgator

---

## Arquitetura da Solucao

```text
+-------------------+     +----------------------+     +-----------------+
|   Frontend App    | --> |  Edge Function       | --> |   Zoho SMTP     |
|   (React)         |     |  send-email          |     |  smtppro.zoho   |
+-------------------+     +----------------------+     +-----------------+
                                    |
                                    v
                          +-------------------+
                          |  Supabase DB      |
                          |  logs_email       |
                          +-------------------+
```

---

## Etapa 1: Configurar Secrets

Adicionar 2 novas secrets no backend:

| Nome | Valor |
|------|-------|
| `ZOHO_SMTP_USER` | `noreply@visitaprova.com.br` |
| `ZOHO_SMTP_PASSWORD` | Senha de aplicativo gerada no Zoho |

---

## Etapa 2: Criar Edge Function `send-email`

Nova funcao para envio de emails via SMTP.

**Arquivo:** `supabase/functions/send-email/index.ts`

**Funcionalidades:**
- Envio via SMTP usando `nodemailer` (npm package)
- Suporte a HTML e texto plano
- Log de envios no banco de dados
- Tratamento de erros com retry

**Configuracao SMTP Zoho (Dominio personalizado):**
- Host: `smtppro.zoho.com`
- Porta: `465` (SSL)
- Seguro: `true`

**Acoes suportadas:**
- `send`: Enviar email simples
- `send-template`: Enviar usando template salvo

---

## Etapa 3: Criar Tabela de Logs de Email

**Tabela:** `email_logs`

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `id` | uuid | PK |
| `to_email` | text | Destinatario |
| `subject` | text | Assunto |
| `template_tipo` | text | Tipo de template usado |
| `status` | text | sent, failed, pending |
| `error_message` | text | Mensagem de erro se falhar |
| `ficha_id` | uuid | FK opcional para ficha |
| `user_id` | uuid | Usuario que disparou |
| `created_at` | timestamp | Data/hora do envio |

---

## Etapa 4: Criar Templates de Email

**Tabela:** `templates_email`

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `id` | uuid | PK |
| `tipo` | text | Tipo do template |
| `nome` | text | Nome legivel |
| `assunto` | text | Assunto do email |
| `conteudo_html` | text | Corpo em HTML |
| `conteudo_texto` | text | Corpo em texto puro |
| `ativo` | boolean | Se esta ativo |
| `user_id` | uuid | Dono do template (opcional) |

**Templates padrao:**
- `boas_vindas`: Email de boas-vindas ao novo usuario
- `confirmacao_visita`: Confirmacao de visita realizada
- `lembrete_pagamento`: Lembrete de pagamento pendente
- `assinatura_ativa`: Confirmacao de ativacao de plano
- `reset_senha`: Link para redefinir senha

---

## Etapa 5: Pagina de Configuracao de Email

**Arquivo:** `src/pages/ConfiguracoesEmail.tsx`

**Funcionalidades:**
- Configurar remetente (From name)
- Editar templates de email (similar a TemplatesMensagem.tsx)
- Testar envio de email
- Ver historico de emails enviados

**Rota:** `/integracoes/email`

---

## Etapa 6: Integrar com Fluxos Existentes

### 6.1 Notificacoes de Pagamento (asaas-webhook)
- Apos processar pagamento, enviar email + WhatsApp
- Email complementa o WhatsApp para redundancia

### 6.2 Boas-vindas ao Cadastro
- Apos registro bem-sucedido, enviar email de boas-vindas
- Modificar: `registro-imobiliaria`, `registro-corretor-autonomo`

### 6.3 Reset de Senha Customizado
- Modificar `admin-reset-password` para usar email personalizado
- Email com branding do VisitaProva

### 6.4 Confirmacao de Visita (Opcional)
- Enviar comprovante PDF por email alem do WhatsApp
- Apenas para usuarios que informarem email

---

## Etapa 7: Atualizar Pagina de Integracoes

**Arquivo:** `src/pages/Integracoes.tsx`

Adicionar card para Zoho Mail:
- Status da conexao SMTP
- Botao para testar conexao
- Link para configurar templates
- Link para ver historico de envios

---

## Secao Tecnica

### Estrutura da Edge Function send-email

```typescript
// supabase/functions/send-email/index.ts
import nodemailer from "npm:nodemailer@6.9.8";

interface SendEmailRequest {
  action: 'send' | 'send-template' | 'test-connection';
  to?: string;
  subject?: string;
  html?: string;
  text?: string;
  template_tipo?: string;
  variables?: Record<string, string>;
}

// Configuracao SMTP
const transporter = nodemailer.createTransport({
  host: "smtppro.zoho.com",
  port: 465,
  secure: true,
  auth: {
    user: Deno.env.get("ZOHO_SMTP_USER"),
    pass: Deno.env.get("ZOHO_SMTP_PASSWORD"),
  },
});

// Enviar email
await transporter.sendMail({
  from: '"VisitaProva" <noreply@visitaprova.com.br>',
  to: destinatario,
  subject: assunto,
  html: corpoHtml,
  text: corpoTexto,
});
```

### Config.toml

```toml
[functions.send-email]
verify_jwt = true
```

### Substituicao de Variaveis nos Templates

Variaveis disponiveis:
- `{nome}` - Nome do destinatario
- `{email}` - Email do destinatario
- `{protocolo}` - Protocolo da ficha
- `{endereco}` - Endereco do imovel
- `{data_visita}` - Data da visita
- `{link}` - Link para acao
- `{valor}` - Valor monetario
- `{plano}` - Nome do plano

---

## Resumo de Arquivos a Criar/Modificar

### Novos Arquivos:
1. `supabase/functions/send-email/index.ts` - Edge function de envio
2. `src/pages/ConfiguracoesEmail.tsx` - Pagina de configuracao
3. `src/pages/HistoricoEmails.tsx` - Historico de envios

### Arquivos a Modificar:
1. `supabase/config.toml` - Adicionar config da funcao
2. `src/pages/Integracoes.tsx` - Adicionar card do Zoho Mail
3. `supabase/functions/asaas-webhook/index.ts` - Adicionar envio de email
4. `supabase/functions/admin-reset-password/index.ts` - Usar email customizado
5. `src/App.tsx` - Adicionar novas rotas

### Migracao de Banco:
1. Criar tabela `email_logs`
2. Criar tabela `templates_email`
3. Inserir templates padrao

---

## Proximo Passo
Apos voce aprovar este plano, preciso que voce:
1. Crie o email `noreply@visitaprova.com.br` no Zoho Mail
2. Gere uma senha de aplicativo no Zoho
3. Me informe quando estiver pronto para eu adicionar as secrets e implementar
