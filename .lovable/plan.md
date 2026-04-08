

# Diagnóstico: Vídeo não chegou como anexo no WhatsApp

## O que aconteceu

Os logs confirmam que a edge function processou corretamente:
- Status 201 (aceito pelo ZionTalk)
- "Media attached: Atualização.mp4 (3990118 bytes)"
- Resposta vazia do ZionTalk (normal para 201)

O problema é que o ZionTalk aceitou a requisição mas **ignorou o arquivo anexado**. Isso pode acontecer por:

1. O nome do campo FormData (`file`) pode estar incorreto — a API pode esperar outro nome
2. A API não-oficial (canal default) pode não suportar vídeo via `/send_message/`

## Correção proposta

Adicionar **log de diagnóstico completo** dos campos FormData enviados e testar nomes de campo alternativos que APIs de WhatsApp costumam usar:

### `supabase/functions/send-whatsapp/index.ts`

1. Trocar o nome do campo de `file` para `media_file` (nome mais comum em APIs de WhatsApp não-oficiais)
2. Adicionar log listando todos os campos do FormData antes do envio para diagnóstico
3. Relaxar a validação de `message` para permitir envio de mídia sem texto (usar espaço como fallback, que já existe no `msg`)

### Mudança principal (1 linha)

```typescript
// De:
formData.append('file', blob, fname);

// Para:
formData.append('media_file', blob, fname);
```

Se `media_file` também não funcionar, o log detalhado ajudará a identificar o campo correto testando manualmente pela documentação do ZionTalk.

## Escopo
- 1 arquivo alterado (edge function)
- Redeploy automático
- Sem risco — apenas muda o nome do campo e adiciona logs

