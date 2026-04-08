

# Diagnóstico de anexo: tratar Data URL e melhorar logs

## Análise da causa raiz

Verifiquei o código do frontend (`fileToBase64` em AdminWhatsApp.tsx, linha 38): ele já faz `result.split(',')[1]` para remover o prefixo Data URL. Portanto, o `mediaBase64` que chega na edge function **já é base64 puro** na maioria dos casos.

Mesmo assim, adicionar a detecção de Data URL na edge function é uma boa prática defensiva (caso outro caller envie com prefixo). E os logs aprimorados vão ajudar a identificar se o problema está no tamanho, no MIME, ou na montagem do Blob.

**Hipótese mais provável**: dado que os logs mostram 201 com `attachments=Blob(3990118b, video/mp4)` e o texto chega mas o anexo não, o problema pode ser um **limite de tamanho do nginx/ZionTalk** para multipart (o vídeo tem ~4MB). O diagnóstico melhorado confirmará isso.

## Alterações (1 arquivo)

### `supabase/functions/send-whatsapp/index.ts` — linhas 240-255

Substituir o bloco `if (mediaBase64)` por:

1. **Detectar prefixo Data URL** com regex `/^data:([^;]+);base64,/`
2. Se detectar, extrair o MIME do prefixo e remover antes do `atob`
3. Se não, usar base64 direto e inferir MIME pela extensão
4. **Prioridade do MIME**: prefixo Data URL > extensão > `application/octet-stream`
5. **Logs de diagnóstico**:
   - `[send-whatsapp] mediaBase64 received: <length> chars, hasDataUrlPrefix: true/false`
   - `[send-whatsapp] MIME resolved: <mime> (source: dataurl|extension|fallback)`
   - `[send-whatsapp] Blob created: <size> bytes, filename: <name>`
6. **Em caso de falha** (status != 201), incluir no JSON de retorno: `mimeDetected`, `blobSize`, `filename`

### O que NÃO muda
- Endpoint (`/send_message/`), campo (`attachments`), auth, CORS, outras actions, logWhatsApp

## Como validar nos logs

Após envio com anexo, verificar:
1. `hasDataUrlPrefix: false` (confirma que frontend já limpa)
2. `Blob created: X bytes` — se X for muito diferente do tamanho esperado, o base64 está corrompido
3. `MIME resolved: video/mp4 (source: extension)` — confirma detecção correta
4. Status 201 + destinatário recebe mídia = resolvido
5. Status 201 + sem mídia = problema é do lado do ZionTalk (limite de tamanho ou formato não suportado)

