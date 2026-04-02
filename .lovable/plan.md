

## Plano: Enviar email com credenciais ao criar acesso de afiliado

Atualmente a edge function `admin-criar-acesso-afiliado` gera uma senha temporária, cria o usuário, e tenta gerar um link de recuperação — mas nunca envia um email real com as credenciais.

### Alteração

**`supabase/functions/admin-criar-acesso-afiliado/index.ts`**

Após criar o usuário e vincular o `user_id`, invocar a edge function `send-email` (já existente no projeto, usa Zoho SMTP) para enviar um email ao afiliado com:
- Email de login
- Senha temporária
- Link para acessar o painel

O envio será feito internamente (com `SUPABASE_SERVICE_ROLE_KEY` no header Authorization) chamando `send-email` via fetch, seguindo o mesmo padrão usado em `registro-imobiliaria` e `registro-corretor-autonomo`.

Código a adicionar (após a atualização do `user_id`, antes do return de sucesso):

```typescript
// Enviar email com credenciais
try {
  const emailHtml = `
    <h2>Bem-vindo ao painel de afiliados!</h2>
    <p>Olá ${afiliado.nome},</p>
    <p>Seu acesso ao painel de afiliados foi criado com sucesso.</p>
    <p><strong>Email:</strong> ${afiliado.email}</p>
    <p><strong>Senha temporária:</strong> ${tempPassword}</p>
    <p>Acesse o painel e altere sua senha no primeiro login.</p>
    <p><a href="${req.headers.get("origin")}/auth">Acessar o painel</a></p>
  `;

  await fetch(`${supabaseUrl}/functions/v1/send-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({
      action: "send",
      to: afiliado.email,
      subject: "Seu acesso ao painel de afiliados foi criado",
      html: emailHtml,
    }),
  });
} catch (emailError) {
  console.error("Erro ao enviar email:", emailError);
}
```

O envio é não-bloqueante (try/catch) — se falhar, o acesso foi criado com sucesso e a resposta já retorna a senha no front-end.

### Resultado
O afiliado receberá um email com email + senha temporária + link de acesso assim que o admin criar o acesso pelo painel.

