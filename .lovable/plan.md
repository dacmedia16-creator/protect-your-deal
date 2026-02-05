
# Plano: Enviar Email com PDF para Corretores ao Completar Ficha

## Objetivo

Quando uma ficha for confirmada por ambas as partes (status = `completo`), enviar automaticamente um email com o comprovante em PDF anexado para:
1. **Corretor Principal** - quem criou a ficha (`user_id`)
2. **Corretor Parceiro** - se houver (`corretor_parceiro_id`)

---

## Análise Atual

| Componente | Estado Atual |
|------------|--------------|
| Template `confirmacao_visita` | ✅ Existe (mas sem anexo) |
| Função `send-email` | ✅ Suporta nodemailer |
| Função `generate-pdf` | ✅ Retorna PDF em bytes |
| Função `verify-otp` | ✅ Já gera backup quando ficha completa |
| Emails dos corretores | ✅ Disponível em `profiles.email` ou `auth.users.email` |

---

## Solução Proposta

### 1. Criar Novo Template de Email

**Tipo**: `ficha_completa`  
**Assunto**: `Registro confirmado! Protocolo {protocolo} 📋`

Variáveis:
- `{nome}` - Nome do corretor
- `{protocolo}` - Protocolo da ficha
- `{endereco}` - Endereço do imóvel
- `{data_visita}` - Data da visita
- `{link}` - Link para ver detalhes

### 2. Atualizar Função `send-email`

Adicionar suporte a anexos (attachments) no nodemailer:

```text
interface SendEmailRequest {
  ...
  attachments?: Array<{
    filename: string;
    content: string; // base64
    contentType: string;
  }>;
}
```

### 3. Atualizar Função `verify-otp`

Após gerar o backup do PDF, enviar emails para os corretores:

```text
Fluxo:
1. Quando newStatus = 'completo':
   a. Gerar PDF via generate-pdf
   b. Salvar backup no storage
   c. Buscar email do corretor principal
   d. Enviar email com PDF anexado para corretor principal
   e. Se houver corretor_parceiro_id:
      - Buscar email do corretor parceiro
      - Enviar email com PDF anexado para corretor parceiro
```

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/send-email/index.ts` | Adicionar suporte a attachments |
| `supabase/functions/verify-otp/index.ts` | Adicionar envio de emails após conclusão |
| Migração SQL | Criar template `ficha_completa` |

---

## Seção Técnica

### Modificação no `send-email/index.ts`

Adicionar campo `attachments` no tipo e no `sendMail`:

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
  from_email?: string;
  attachments?: Array<{
    filename: string;
    content: string; // base64
    contentType: string;
  }>;
}

// No sendMail:
const info = await transporter.sendMail({
  from: `"${credentials.displayName}" <${credentials.user}>`,
  to: to,
  subject: finalSubject,
  html: finalHtml,
  text: finalText,
  attachments: body.attachments?.map(att => ({
    filename: att.filename,
    content: Buffer.from(att.content, 'base64'),
    contentType: att.contentType,
  })),
});
```

### Modificação no `verify-otp/index.ts`

Adicionar função para enviar emails após conclusão:

```typescript
async function sendCompletionEmails(
  supabase: any, 
  ficha: any, 
  pdfBytes: Uint8Array
): Promise<void> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Converter PDF para base64
  const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));
  
  // Buscar email do corretor principal
  const { data: corretorPrincipal } = await supabase
    .from('profiles')
    .select('nome, email, user_id')
    .eq('user_id', ficha.user_id)
    .single();
  
  // Se não tem email no profile, buscar do auth.users
  let emailPrincipal = corretorPrincipal?.email;
  if (!emailPrincipal) {
    const { data: authUser } = await supabase.auth.admin.getUserById(ficha.user_id);
    emailPrincipal = authUser?.user?.email;
  }
  
  const variables = {
    nome: corretorPrincipal?.nome || 'Corretor',
    protocolo: ficha.protocolo,
    endereco: ficha.imovel_endereco,
    data_visita: new Date(ficha.data_visita).toLocaleDateString('pt-BR'),
    link: `https://visitaprova.com.br/ficha/${ficha.id}`,
  };
  
  // Enviar para corretor principal
  if (emailPrincipal) {
    await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        action: 'send-template',
        to: emailPrincipal,
        template_tipo: 'ficha_completa',
        variables,
        ficha_id: ficha.id,
        attachments: [{
          filename: `comprovante-${ficha.protocolo}.pdf`,
          content: pdfBase64,
          contentType: 'application/pdf',
        }],
      }),
    });
  }
  
  // Se tem corretor parceiro, enviar para ele também
  if (ficha.corretor_parceiro_id) {
    const { data: corretorParceiro } = await supabase
      .from('profiles')
      .select('nome, email')
      .eq('user_id', ficha.corretor_parceiro_id)
      .single();
    
    let emailParceiro = corretorParceiro?.email;
    if (!emailParceiro) {
      const { data: authUser } = await supabase.auth.admin.getUserById(ficha.corretor_parceiro_id);
      emailParceiro = authUser?.user?.email;
    }
    
    if (emailParceiro) {
      variables.nome = corretorParceiro?.nome || 'Corretor Parceiro';
      
      await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        // ... mesmo payload adaptado
      });
    }
  }
}
```

### Template HTML

```html
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #2563eb;">VisitaProva</h1>
  </div>
  
  <h2 style="color: #1e293b;">Registro Confirmado! 📋</h2>
  
  <p>Olá, <strong>{nome}</strong>!</p>
  
  <p>O registro de visita foi confirmado por ambas as partes.</p>
  
  <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <p><strong>Protocolo:</strong> {protocolo}</p>
    <p><strong>Endereço:</strong> {endereco}</p>
    <p><strong>Data:</strong> {data_visita}</p>
  </div>
  
  <p>📎 O comprovante em PDF está anexado a este email.</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{link}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">Ver Detalhes</a>
  </div>
  
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
  <p style="color: #94a3b8; font-size: 12px; text-align: center;">VisitaProva</p>
</body>
</html>
```

---

## Resultado Esperado

Após implementação:
- ✅ Corretor principal recebe email com PDF anexado ao completar ficha
- ✅ Corretor parceiro (se houver) recebe email com PDF anexado
- ✅ Emails são logados em `email_logs` para rastreamento
- ✅ Processo não bloqueia a confirmação (erros são apenas logados)
