

# Adicionar Segundo Numero WhatsApp (API Oficial Meta via ZionTalk)

## Resumo

Adicionar suporte a um segundo numero WhatsApp usando a API oficial da Meta atraves do ZionTalk. O sistema tera dois canais de envio que o admin pode escolher qual usar.

## Alteracoes

### 1. Cadastrar nova secret

Criar a secret `ZIONTALK_META_API_KEY` para a chave da API do segundo numero.

### 2. Atualizar Edge Function `send-whatsapp`

Adicionar um parametro opcional `channel` no request:
- `channel: 'default'` (ou omitido) -- usa `ZIONTALK_API_KEY` (numero atual)
- `channel: 'meta'` -- usa `ZIONTALK_META_API_KEY` (numero oficial Meta)

Adicionar suporte ao parametro `buttonUrlDynamicParams` no `send-template`, que sera enviado como `buttonUrlDynamicParams[0]`, `buttonUrlDynamicParams[1]`, etc. no FormData.

Atualizar a interface `SendMessageRequest`:
```text
channel?: 'default' | 'meta';
buttonUrlDynamicParams?: string[];
```

A logica de autenticacao selecionara a API Key correta com base no channel.

### 3. Atualizar pagina de Integracoes

Adicionar um segundo card na pagina `Integracoes.tsx` para o numero Meta:
- Card "ZionTalk Meta (API Oficial)" com icone diferenciado (azul)
- Botao "Testar Conexao" independente (envia `channel: 'meta'`)
- Envio de mensagem de teste usando template (nao texto livre, ja que a API da Meta so aceita templates)
- Status independente do primeiro numero

### 4. Atualizar `send-otp` e `process-otp-queue` (opcional agora)

Neste momento, os envios de OTP continuam usando o numero padrao. Futuramente, o admin podera selecionar qual canal usar para OTP nas configuracoes. Por enquanto, o `channel` so sera usado explicitamente quando chamado pela pagina de integracoes ou pelo `AdminUsuarios`.

## Arquivos modificados

| Arquivo | Alteracao |
|---------|-----------|
| Secret `ZIONTALK_META_API_KEY` | Nova secret para o segundo numero |
| `supabase/functions/send-whatsapp/index.ts` | Suporte a `channel` e `buttonUrlDynamicParams` |
| `src/pages/Integracoes.tsx` | Segundo card para testar o numero Meta |

## Detalhes tecnicos

### FormData para template com botao dinamico (Meta)
```text
formData.append('mobile_phone', '+5515981767268');
formData.append('template_identifier', 'visita_prova');
formData.append('language', 'pt_BR');
formData.append('bodyParams[nome]', 'Joao');
formData.append('bodyParams[aviso]', 'Titulo');
formData.append('bodyParams[lembrete]', 'Texto');
formData.append('buttonUrlDynamicParams[0]', 'c/slug-da-org');
```

### Selecao de API Key no edge function
```text
const apiKeyName = channel === 'meta' ? 'ZIONTALK_META_API_KEY' : 'ZIONTALK_API_KEY';
const apiKey = Deno.env.get(apiKeyName);
```

