

# Adicionar anexo de imagem e vídeo no envio de WhatsApp

## Contexto

A página AdminWhatsApp envia apenas texto livre hoje. O usuário quer poder anexar uma imagem ou vídeo que será enviado junto com a mensagem para todos os destinatários selecionados.

## Abordagem

A API ZionTalk aceita um campo `file` no FormData do endpoint `/send_message/` para enviar mídia. O fluxo será:

1. O admin seleciona um arquivo (imagem ou vídeo) no frontend
2. O arquivo é enviado como base64 para a edge function `send-whatsapp`
3. A edge function converte o base64 em `Blob` e anexa como campo `file` no FormData enviado ao ZionTalk

Isso evita a necessidade de storage intermediário e mantém o fluxo simples.

## Alterações

### 1. `supabase/functions/send-whatsapp/index.ts`

- Atualizar a interface `SendMessageRequest` para incluir campos opcionais `mediaBase64` (string base64) e `mediaFilename` (nome do arquivo)
- No case `send-text`: se `mediaBase64` estiver presente, converter para `Blob` e fazer `formData.append('file', blob, mediaFilename)` junto com `msg`
- Logar o tipo como `'texto_com_midia'` quando houver anexo

### 2. `src/lib/whatsappSendEngine.ts`

- Adicionar `mediaBase64?: string` e `mediaFilename?: string` aos parâmetros de `start()`
- Passar esses campos no body da chamada `send-whatsapp` dentro do `processQueue`

### 3. `src/pages/admin/AdminWhatsApp.tsx`

- Adicionar estado para o arquivo selecionado (`mediaFile: File | null`)
- Adicionar um botão de anexo (ícone de clipe/imagem) abaixo do textarea com preview
- Ao selecionar arquivo, converter para base64 e armazenar no estado
- Limitar tipos aceitos: `image/jpeg, image/png, image/webp, video/mp4`
- Limitar tamanho: 10MB para imagens, 16MB para vídeos
- Mostrar preview da mídia selecionada (thumbnail para imagem, nome do arquivo para vídeo)
- Botão para remover o anexo
- Passar `mediaBase64` e `mediaFilename` no `handleSend` para o engine

## Detalhes técnicos

- O base64 é enviado no body JSON para a edge function (limite de ~50MB no body)
- Na edge function, o base64 é decodificado para `Uint8Array`, convertido em `Blob`, e anexado ao FormData como `file`
- A mensagem de texto continua sendo enviada no campo `msg` junto com o arquivo
- Se o admin não digitar texto mas anexar mídia, enviar com `msg` vazio ou um espaço

## Escopo

- 3 arquivos alterados
- Sem migração de banco
- Redeploy automático da edge function

