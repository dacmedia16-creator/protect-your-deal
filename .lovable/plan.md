

# Corrigir campo de anexo na Edge Function `send-whatsapp`

## Causa raiz

A action `send-text` tem dois problemas:

1. **Endpoint errado**: usa `/send_file_message/` quando há mídia, mas a documentação do ZionTalk diz que tudo vai por `/send_message/`
2. **Campo errado**: usa `file` (anteriormente `media_file`) em vez de `attachments`, que é o campo documentado pelo ZionTalk

Resultado: a API aceita a requisição (201) mas ignora o anexo silenciosamente.

## Alterações (1 arquivo)

### `supabase/functions/send-whatsapp/index.ts` — action `send-text` (linhas 233-282)

1. **Endpoint**: remover a lógica condicional e usar sempre `${ZIONTALK_API_URL}/send_message/` (linha 233-235)
2. **Campo do arquivo**: trocar `formData.append('file', blob, fname)` para `formData.append('attachments', blob, fname)` (linha 255)
3. **Logs de diagnóstico**: mover o log de response headers para fora do `if (mediaBase64)` — logar sempre status, headers e body para toda requisição send-text (linhas 273-282)

### O que NÃO muda
- Autenticação, CORS, auth gate
- Actions `test-connection` e `send-template`
- Conversão base64→Blob, mimeMap, logWhatsApp
- Arquitetura geral

## Como validar

Nos logs da edge function `send-whatsapp`, após um envio com anexo, verificar:
1. `FormData fields:` deve mostrar `attachments=Blob(...)` em vez de `file=Blob(...)`
2. `Send message response status: 201`
3. O destinatário recebe a mídia no WhatsApp

