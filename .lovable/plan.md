
# Plano: Resolver Erro SMTP 554 5.7.8 do Zoho Mail

## Problema Identificado

O erro **"554 5.7.8 Access Restricted"** indica que as credenciais SMTP estao sendo rejeitadas pelo servidor Zoho. A edge function e a configuracao dos secrets estao corretas, mas as App Passwords nao estao funcionando.

---

## Causas Provaveis

| Causa | Descricao | Probabilidade |
|-------|-----------|---------------|
| App Passwords nao geradas | As senhas inseridas sao senhas de login, nao App Passwords | Alta |
| 2FA nao habilitado | App Passwords requerem Two-Factor Authentication ativo | Alta |
| Datacenter incorreto | O servidor SMTP pode ser diferente para contas do Brasil | Media |

---

## Solucao: Passos para Corrigir

### Passo 1: Verificar 2FA no Zoho

Para cada conta de email (noreply, suporte, contato, denis):

1. Acessar https://accounts.zoho.com/
2. Fazer login com a conta de email
3. Ir em **Security > Multi-Factor Authentication**
4. Se o 2FA nao estiver ativo, **ativar agora**

### Passo 2: Gerar App Passwords Corretamente

Apos ativar o 2FA:

1. Na mesma pagina de Security, clicar em **App Passwords**
2. Clicar em **Generate New App Password**
3. Dar um nome descritivo (ex: "VisitaProva SMTP")
4. **Copiar a senha gerada imediatamente** (so aparece uma vez)
5. Repetir para cada conta de email

### Passo 3: Verificar Servidor SMTP Correto

No Zoho Mail de cada conta:

1. Ir em **Settings > Mail Accounts > Primary Account**
2. Clicar em **SMTP**
3. Verificar qual servidor esta listado:
   - Se `smtppro.zoho.com` - OK, nao precisa mudar
   - Se `smtppro.zoho.com.br` ou `smtppro.zoho.in` - precisa atualizar a edge function

### Passo 4: Atualizar Secrets no Backend

Apos gerar as App Passwords corretas:

1. Abrir o painel do backend
2. Atualizar os secrets com as novas App Passwords:
   - `ZOHO_SMTP_PASSWORD` - App Password do noreply@
   - `ZOHO_SUPORTE_PASSWORD` - App Password do suporte@
   - `ZOHO_CONTATO_PASSWORD` - App Password do contato@
   - `ZOHO_DENIS_PASSWORD` - App Password do denis@

### Passo 5: Testar Novamente

Voltar a pagina de Email Sistema e testar a conexao SMTP.

---

## Mudancas no Codigo (Se Necessario)

Se o datacenter for diferente de `smtppro.zoho.com`, sera necessario atualizar a edge function:

**Arquivo:** `supabase/functions/send-email/index.ts`

Adicionar suporte a diferentes datacenters via variavel de ambiente:

```typescript
function createTransporter(credentials: SMTPCredentials) {
  const host = Deno.env.get("ZOHO_SMTP_HOST") || "smtppro.zoho.com";
  return nodemailer.createTransport({
    host: host,
    port: 465,
    secure: true,
    auth: {
      user: credentials.user,
      pass: credentials.pass,
    },
  });
}
```

---

## Checklist de Verificacao

- [ ] 2FA esta ativado em todas as 4 contas Zoho?
- [ ] App Passwords foram geradas (nao senhas de login)?
- [ ] O servidor SMTP correto foi identificado nas configuracoes do Zoho?
- [ ] Os secrets foram atualizados com as App Passwords corretas?
- [ ] Teste de conexao passou com sucesso?

---

## Proximos Passos Apos Resolver

1. Testar envio de email real para validar
2. Implementar interface completa de multi-remetentes conforme plano original
3. Associar templates a remetentes especificos

