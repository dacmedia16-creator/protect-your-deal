

# Adicionar terceiro numero WhatsApp (Meta API 2)

## Resumo

Adicionar um terceiro canal WhatsApp usando a API oficial da Meta, com sua propria API Key separada. O novo canal sera chamado internamente de `meta2`.

## Alteracoes

### 1. Novo secret: `ZIONTALK_META2_API_KEY`

Sera solicitado ao usuario a API Key do terceiro numero via ZionTalk.

### 2. Edge Function: `supabase/functions/send-whatsapp/index.ts`

- Expandir o tipo `channel` de `'default' | 'meta'` para `'default' | 'meta' | 'meta2'`
- Atualizar `getApiKey()` para retornar `ZIONTALK_META2_API_KEY` quando channel = `'meta2'`
- Atualizar `getChannelLabel()` para retornar label do terceiro numero
- Atualizar `getDefaultChannel()` para aceitar `'meta2'` como valor valido

### 3. Edge Function: `supabase/functions/send-otp/index.ts`

- Expandir tipo do channel para incluir `'meta2'`
- Atualizar `getDefaultChannel()` para aceitar `'meta2'`
- Atualizar `sendViaZionTalk()` para mapear `'meta2'` ao secret correto
- Atualizar `sendMetaTemplate()` para mapear `'meta2'` ao secret correto
- Logica de envio: `meta2` segue o mesmo fluxo do `meta` (template)

### 4. Edge Function: `supabase/functions/process-otp-queue/index.ts`

- Mesmas alteracoes do send-otp: expandir tipo, atualizar funcoes de key/label/channel

### 5. Edge Function: `supabase/functions/otp-reminder/index.ts`

- Mesmas alteracoes: expandir tipo, atualizar funcoes de key/label/channel

### 6. Frontend: `src/pages/Integracoes.tsx`

- Adicionar terceiro card "ZionTalk Meta 2 (API Oficial)" com icone diferenciado
- Estado proprio para status, teste de conexao e envio de template de teste
- Usa `channel: 'meta2'` nas chamadas

### 7. Frontend: `src/pages/admin/AdminConfiguracoes.tsx`

- Adicionar opcao "API Oficial Meta 2" no Select de canal padrao com valor `'meta2'`

## Detalhes tecnicos

Todas as funcoes de mapeamento channel -> secret seguem o padrao:

```text
'default'  -> ZIONTALK_API_KEY
'meta'     -> ZIONTALK_META_API_KEY
'meta2'    -> ZIONTALK_META2_API_KEY
```

O canal `meta2` usa o mesmo fluxo de template que o `meta` (template `visita_prova`), apenas com API Key diferente (numero diferente).
