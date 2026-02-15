
# Corrigir envio de OTP para usar o canal WhatsApp configurado

## Problema

As 3 edge functions que enviam mensagens WhatsApp (OTP, fila de processamento e lembretes) usam sempre a chave `ZIONTALK_API_KEY` (numero padrao), ignorando a configuracao `whatsapp_channel_padrao` salva no banco pelo Super Admin. Mesmo com "API Oficial Meta" selecionado nas configuracoes, os envios continuam saindo pelo numero antigo.

## Solucao

Adicionar em cada uma das 3 edge functions a logica de consultar a tabela `configuracoes_sistema` para determinar qual API Key usar (`ZIONTALK_API_KEY` ou `ZIONTALK_META_API_KEY`), exatamente como ja foi feito no `send-whatsapp`.

## Alteracoes

### 1. `supabase/functions/send-otp/index.ts`

- Adicionar funcao `getDefaultChannel()` que consulta `configuracoes_sistema` com chave `whatsapp_channel_padrao`
- Modificar `sendViaZionTalk()` para aceitar parametro `channel` e usar a API Key correta (`ZIONTALK_API_KEY` para default, `ZIONTALK_META_API_KEY` para meta)
- No handler principal, chamar `getDefaultChannel()` e passar o canal para `sendViaZionTalk()`

### 2. `supabase/functions/process-otp-queue/index.ts`

- Mesma alteracao: adicionar `getDefaultChannel()` e modificar `sendViaZionTalk()` para respeitar o canal configurado
- O supabase client ja existe no handler, entao sera passado para a funcao

### 3. `supabase/functions/otp-reminder/index.ts`

- Mesma alteracao: adicionar `getDefaultChannel()` e modificar `sendViaZionTalk()` para respeitar o canal configurado

## Detalhes tecnicos

A funcao `getDefaultChannel` sera identica nas 3 functions:

```text
async function getDefaultChannel(supabase): Promise<'default' | 'meta'> {
  try {
    const { data } = await supabase
      .from('configuracoes_sistema')
      .select('valor')
      .eq('chave', 'whatsapp_channel_padrao')
      .single();
    const val = data?.valor;
    if (val === 'meta' || val === '"meta"') return 'meta';
    return 'default';
  } catch {
    return 'default';
  }
}
```

A funcao `sendViaZionTalk` passara a receber o channel:

```text
async function sendViaZionTalk(phone, message, channel = 'default') {
  const secretName = channel === 'meta' ? 'ZIONTALK_META_API_KEY' : 'ZIONTALK_API_KEY';
  const apiKey = Deno.env.get(secretName);
  // ... resto igual
}
```

## Arquivos modificados

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/send-otp/index.ts` | Ler canal padrao do banco e usar API Key correspondente |
| `supabase/functions/process-otp-queue/index.ts` | Ler canal padrao do banco e usar API Key correspondente |
| `supabase/functions/otp-reminder/index.ts` | Ler canal padrao do banco e usar API Key correspondente |
