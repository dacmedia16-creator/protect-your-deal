

# Adicionar logging detalhado para diagnosticar meta2

## Problema

O envio via canal `meta2` retorna HTTP 201 (sucesso) mas a mensagem nao chega ao destinatario. Precisamos capturar headers de resposta e body completo para entender o que o ZionTalk esta retornando.

## Alteracoes

### 1. `supabase/functions/process-otp-queue/index.ts`

Na funcao `sendTemplateViaZionTalk`, apos o fetch, adicionar:

- Log de **todos os headers de resposta** (iterando `response.headers`)
- Log do **body completo** (sem truncar)
- Log do **content-type** da resposta
- Identificacao explicita quando o canal e `meta2` para facilitar filtragem nos logs

Trecho afetado: linhas 150-153 (apos o fetch na funcao sendTemplateViaZionTalk)

### 2. `supabase/functions/send-whatsapp/index.ts`

Na action `send-template` (linhas 199-207), adicionar o mesmo logging detalhado de headers e body completo quando o canal for `meta2`.

### 3. `supabase/functions/send-otp/index.ts`

Mesma alteracao na funcao equivalente de envio de template, capturando headers e body completo para o canal `meta2`.

## Detalhes tecnicos

O logging adicional seguira este padrao:

```text
// Apos o fetch da API ZionTalk:
const responseHeaders: Record<string, string> = {};
response.headers.forEach((value, key) => {
  responseHeaders[key] = value;
});
console.log(`[func] Canal: ${channel} | Status: ${response.status}`);
console.log(`[func] Response Headers:`, JSON.stringify(responseHeaders));
console.log(`[func] Response Body COMPLETO:`, responseText);
```

Isso permitira ver se o ZionTalk retorna algum campo de erro, message ID, status de entrega ou indicacao de numero invalido dentro do body da resposta 201.

