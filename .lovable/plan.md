

# Plano: Validar Email do Destinatário Antes de Enviar

## Objetivo

Adicionar validação no início da edge function `send-email` para verificar se o destinatário tem um email válido. Se não tiver, retornar sucesso silencioso (sem erro) e logar apropriadamente.

---

## Mudança Proposta

**Arquivo:** `supabase/functions/send-email/index.ts`

### 1. Adicionar Função de Validação de Email

```typescript
// Validar se o email é válido
function isValidEmail(email?: string): boolean {
  if (!email || email.trim() === '') return false;
  // Regex básico para validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}
```

### 2. Validar Antes de Enviar (ação `send-template`)

Antes da linha que busca o template, adicionar:

```typescript
// Validar email do destinatário
if (!isValidEmail(to)) {
  console.log(`Skipping email send: invalid or missing recipient email: "${to}"`);
  
  // Logar como "skipped" (não é erro, é comportamento esperado)
  await supabaseAdmin.from('email_logs').insert({
    to_email: to || 'não informado',
    subject: `[${template_tipo}] - não enviado`,
    template_tipo: template_tipo,
    status: 'skipped',
    error_message: 'Destinatário sem email válido',
    user_id: userId,
    ficha_id: ficha_id || null,
    from_email: null,
  });
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      skipped: true, 
      reason: "Destinatário sem email válido" 
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

### 3. Validar Antes de Enviar (ação `send`)

Mesmo comportamento para envios diretos:

```typescript
// Validar email do destinatário
if (!isValidEmail(to)) {
  console.log(`Skipping direct email: invalid or missing recipient: "${to}"`);
  
  await supabaseAdmin.from('email_logs').insert({
    to_email: to || 'não informado',
    subject: subject || 'não informado',
    template_tipo: null,
    status: 'skipped',
    error_message: 'Destinatário sem email válido',
    user_id: userId,
    ficha_id: ficha_id || null,
    from_email: null,
  });
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      skipped: true, 
      reason: "Destinatário sem email válido" 
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

---

## Comportamento Resultante

| Cenário | Comportamento | Status HTTP | Resposta |
|---------|---------------|-------------|----------|
| Email válido | Envia normalmente | 200 | `{ success: true, messageId: "..." }` |
| Email vazio/null | Não envia, retorna sucesso | 200 | `{ success: true, skipped: true, reason: "..." }` |
| Email inválido | Não envia, retorna sucesso | 200 | `{ success: true, skipped: true, reason: "..." }` |

---

## Benefícios

1. **Sem erros desnecessários** - Códigos que chamam a edge function não quebram
2. **Rastreabilidade** - Emails não enviados são logados com status `skipped`
3. **Transparência** - A resposta indica que foi pulado (`skipped: true`)
4. **Compatibilidade** - Não afeta fluxos existentes que passam emails válidos

---

## Nota sobre a Tabela email_logs

O status `skipped` é um novo valor. A coluna `status` já aceita texto livre, então não precisa de migração de banco de dados.

