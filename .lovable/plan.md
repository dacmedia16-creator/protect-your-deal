
# Trocar template de `visita_prova` para `visita_prova_2`

## Resumo

Substituir o nome do template do WhatsApp Meta de `visita_prova` para `visita_prova_2` em todos os pontos do sistema. Os parametros permanecem os mesmos (`nome`, `imovel`, `codigo`, `lembrete`), entao a unica alteracao necessaria e o nome do template.

## Arquivos a alterar

### 1. `supabase/functions/send-otp/index.ts`
- Linha 116: log "visita_prova" -> "visita_prova_2"
- Linha 129: `template_identifier` de `visita_prova` para `visita_prova_2`
- Linhas 458-459: comentarios e logs referenciando o nome do template

### 2. `supabase/functions/process-otp-queue/index.ts`
- Linha 120: log "visita_prova" -> "visita_prova_2"
- Linha 133: `template_identifier` de `visita_prova` para `visita_prova_2`
- Linhas 371-372: comentarios e logs referenciando o nome do template

### 3. `supabase/functions/otp-reminder/index.ts`
- Linha 88: log "visita_prova" -> "visita_prova_2"
- Linha 101: `template_identifier` de `visita_prova` para `visita_prova_2`
- Linhas 316-318: comentarios e logs referenciando o nome do template

### 4. `src/pages/Integracoes.tsx`
- Linha 122: `templateName` de `visita_prova` para `visita_prova_2`
- Linhas 289, 343: textos de interface referenciando o nome do template

## Impacto

Alteracao simples de string em 4 arquivos. Nenhuma mudanca de logica, parametros ou banco de dados. As 3 edge functions serao redeployadas automaticamente.
