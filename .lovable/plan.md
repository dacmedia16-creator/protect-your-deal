
## Plano: Tornar Validação do Webhook Asaas Obrigatória

### Vulnerabilidade Identificada
O código atual (linhas 64-86) implementa verificação do token, mas tem uma falha crítica:

```typescript
if (asaasWebhookToken) {
  // Valida token...
} else {
  // ⚠️ PROBLEMA: Apenas loga um warning e continua processando!
  console.warn('⚠️ SECURITY WARNING: ASAAS_WEBHOOK_TOKEN not configured...');
}
```

Se o secret `ASAAS_WEBHOOK_TOKEN` não estiver configurado, **qualquer requisição é aceita**, permitindo que atacantes:
- Falsifiquem eventos de pagamento confirmado
- Ativem assinaturas sem pagar
- Manipulem estados de contas

### Solução
Tornar a validação **obrigatória** - rejeitar requisições se o token não estiver configurado ou não corresponder.

---

### Mudanças no Arquivo

**Arquivo:** `supabase/functions/asaas-webhook/index.ts`

**Linhas 64-86** - Substituir a validação condicional por validação obrigatória:

```typescript
// ========================================
// VALIDAÇÃO DE SEGURANÇA DO WEBHOOK (OBRIGATÓRIA)
// ========================================
// A Asaas envia o token de autenticação no header 'asaas-access-token'
// Este token deve ser configurado no painel da Asaas em Integrações > Webhooks

if (!asaasWebhookToken) {
  // Token não configurado no servidor - bloquear por segurança
  console.error('CRITICAL: ASAAS_WEBHOOK_TOKEN not configured. Rejecting all webhook requests.');
  return new Response(
    JSON.stringify({ error: 'Server configuration error' }),
    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

const receivedToken = req.headers.get('asaas-access-token');

if (!receivedToken) {
  console.error('Webhook rejected: Missing asaas-access-token header');
  return new Response(
    JSON.stringify({ error: 'Unauthorized: Missing authentication token' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Comparação segura usando timing-safe comparison para prevenir timing attacks
const encoder = new TextEncoder();
const expectedBuffer = encoder.encode(asaasWebhookToken);
const receivedBuffer = encoder.encode(receivedToken);

// Verificar tamanho primeiro (se diferentes, já rejeitar)
if (expectedBuffer.length !== receivedBuffer.length) {
  console.error('Webhook rejected: Invalid asaas-access-token (length mismatch)');
  return new Response(
    JSON.stringify({ error: 'Unauthorized: Invalid authentication token' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Comparação timing-safe
let isValid = true;
for (let i = 0; i < expectedBuffer.length; i++) {
  if (expectedBuffer[i] !== receivedBuffer[i]) {
    isValid = false;
  }
}

if (!isValid) {
  console.error('Webhook rejected: Invalid asaas-access-token');
  return new Response(
    JSON.stringify({ error: 'Unauthorized: Invalid authentication token' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

console.log('Webhook authentication successful');
```

---

### Melhorias de Segurança Implementadas

| Antes | Depois |
|-------|--------|
| Token não configurado → Log warning e **continua** | Token não configurado → **Rejeita com 500** |
| Comparação simples `===` | **Timing-safe comparison** para prevenir timing attacks |
| Atacantes podem burlar | Todas requisições sem token válido são rejeitadas |

---

### Pré-requisito Verificado ✅
O secret `ASAAS_WEBHOOK_TOKEN` **já está configurado** no sistema, então a mudança não quebrará o funcionamento atual - apenas tornará a validação obrigatória em vez de opcional.

---

### Resultado
Após esta correção:
- ❌ Requisições sem token → Rejeitadas (401)
- ❌ Requisições com token inválido → Rejeitadas (401)
- ❌ Servidor sem token configurado → Erro (500) - força correção
- ✅ Requisições com token válido da Asaas → Processadas normalmente
