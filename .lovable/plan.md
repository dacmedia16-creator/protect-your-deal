

## Diagnóstico

A correção anterior no `verify-otp` está correta mas **nunca será acionada para fichas parciais**, porque:

1. O `verify-otp` define o status como `aguardando_comprador` ou `aguardando_proprietario` quando apenas uma parte confirma — nunca como `finalizado_parcial`
2. O status `finalizado_parcial` é definido **manualmente pelo corretor** na função `handleFinalizarParcial` do frontend (`DetalhesFicha.tsx`)
3. `handleFinalizarParcial` gera o backup PDF mas **não envia o email** com o PDF anexado

## Correção

### 1. `src/pages/DetalhesFicha.tsx` — `handleFinalizarParcial` (linhas 664-714)

Após gerar o backup com sucesso via `regenerate-backup`, invocar a função `send-email` com `template_tipo: 'ficha_completa'` e o PDF anexado para o corretor (e parceiro, se houver). Alternativamente, criar uma chamada ao backend para enviar o email.

Porém, o frontend não tem acesso ao PDF em bytes para anexar. A melhor solução é mover a lógica para o backend.

### 2. `supabase/functions/regenerate-backup/index.ts` — Adicionar envio de email

Após gerar e fazer upload do backup, chamar `sendCompletionEmails` (ou invocar `send-email` diretamente) para enviar o PDF por email ao corretor. Isso cobre tanto a finalização parcial quanto qualquer regeneração manual.

**Abordagem alternativa (mais limpa):** Criar uma flag `send_email: true` no body de `regenerate-backup`, e quando ativada, enviar o email com o PDF gerado. O `handleFinalizarParcial` passaria `{ ficha_id, send_email: true }`.

### Detalhes técnicos

**Arquivo**: `supabase/functions/regenerate-backup/index.ts`
- Aceitar parâmetro opcional `send_email` no body
- Quando `send_email === true`, após upload do PDF ao storage:
  - Buscar dados do corretor principal (email via `profiles`)
  - Buscar dados do corretor parceiro (se houver)
  - Invocar `send-email` com `action: 'send-template'`, `template_tipo: 'ficha_completa'`, e o PDF em base64 como attachment
  
**Arquivo**: `src/pages/DetalhesFicha.tsx`
- Na chamada `regenerate-backup` dentro de `handleFinalizarParcial`, adicionar `send_email: true` no body

