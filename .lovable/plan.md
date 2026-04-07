

# Corrigir rastreabilidade do fluxo OTP

## Problema identificado
O `process-otp-queue` marca itens como "enviado" mesmo quando o WhatsApp não foi efetivamente entregue (simulação). Não há log de WhatsApp para rastrear o que aconteceu. O OTP do proprietário da ficha VS266F1823 foi criado mas desapareceu, provavelmente deletado por um reenvio subsequente.

## Correções

### 1. Corrigir `process-otp-queue/index.ts` — distinguir simulação de envio real
- Quando `sent = false` após todas as tentativas de envio, marcar o item como `simulado` em vez de `enviado`
- Adicionar log de WhatsApp na tabela `whatsapp_logs` dentro do `processQueueItem` para rastreabilidade (como já é feito em `send-whatsapp`)

### 2. Corrigir `process-otp-queue/index.ts` — proteção contra perda de OTP
- Não deletar o OTP existente se o novo envio falhar: mover a exclusão do OTP anterior para **depois** da confirmação de que o novo OTP foi inserido com sucesso

### 3. Corrigir `send-otp/index.ts` — mesma proteção
- Aplicar a mesma lógica: só deletar OTP antigo depois de confirmar que o novo foi criado

## Arquivos a modificar
- `supabase/functions/process-otp-queue/index.ts`
- `supabase/functions/send-otp/index.ts`

## Impacto
- Sem mudança de schema
- Sem mudança de frontend
- Melhora rastreabilidade e evita perda silenciosa de OTPs
