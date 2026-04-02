

## Plano: Configurar noreply@visitaprova.com.br como remetente

### Problema
A função `getCredentials` no `send-email/index.ts` não tem tratamento para "noreply". Quando `from_email` contém "noreply", nenhum dos blocos (`suporte`, `contato`, `denis`) é ativado, caindo no fallback `ZOHO_SMTP_USER` que está configurado como `denis@visitaprova.com.br`.

### Alterações

**1. Adicionar secrets para noreply**
- `ZOHO_NOREPLY_USER` → `noreply@visitaprova.com.br`
- `ZOHO_NOREPLY_PASSWORD` → senha do App Password Zoho para noreply

**2. `supabase/functions/send-email/index.ts`**
Adicionar bloco para "noreply" na função `getCredentials`, antes do fallback:

```typescript
if (emailLower.includes("noreply")) {
  const user = Deno.env.get("ZOHO_NOREPLY_USER");
  const pass = Deno.env.get("ZOHO_NOREPLY_PASSWORD");
  if (user && pass) {
    return { user, pass, displayName: "VisitaProva" };
  }
}
```

Inserido após o check de "denis" (linha ~75) e antes do return final.

**3. Redeploy** da edge function `send-email`.

### Resultado
Quando qualquer parte do sistema enviar email com `from_email: "noreply@visitaprova.com.br"`, as credenciais corretas serão usadas e o remetente aparecerá como `noreply@visitaprova.com.br`.

