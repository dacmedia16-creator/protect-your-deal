
# Corrigir Rate Limit Excessivo no Envio de OTP

## Problema

O rate limit de envio de OTP tem dois problemas:

1. **Tempo excessivo**: O rate limit e de 30 minutos, o que e muito longo. Se o corretor precisa reenviar (ex: numero errado, mensagem nao chegou), ele tem que esperar 30 minutos.

2. **OTPs auto-enviados contam no rate limit**: Quando a ficha e criada com auto-envio (padrao ON), o sistema cria o OTP automaticamente em 1-7 segundos. Quando o corretor abre a ficha para reenviar manualmente, o rate limit detecta esse OTP auto-enviado e bloqueia por 30 minutos, mesmo que o corretor nunca tenha clicado "enviar" manualmente.

Dados reais do banco confirmam que quase todos os OTPs sao criados em menos de 12 segundos apos a ficha - sao auto-envios, nao envios manuais.

## Solucao

### 1. Reduzir rate limit de 30 para 3 minutos

Tanto no backend quanto no frontend, alterar `RATE_LIMIT_MINUTES` de 30 para 3. Isso mantem a protecao contra spam mas permite reenvios rapidos quando necessario.

**Arquivos:**
- `supabase/functions/send-otp/index.ts` - linha 205: alterar `RATE_LIMIT_MINUTES = 30` para `RATE_LIMIT_MINUTES = 3`
- `src/pages/DetalhesFicha.tsx` - linha 111: alterar `RATE_LIMIT_MINUTES = 30` para `RATE_LIMIT_MINUTES = 3`

### 2. Ignorar OTPs auto-enviados no rate limit do backend

No `send-otp`, antes de aplicar o rate limit, verificar se o OTP recente foi criado automaticamente (dentro de 30 segundos da criacao da ficha). Se sim, permitir o envio manual sem rate limit.

**Arquivo:** `supabase/functions/send-otp/index.ts`
- Apos buscar o `recentOtp`, buscar a data de criacao da ficha
- Se a diferenca entre `recentOtp.created_at` e `ficha.created_at` for menor que 30 segundos, ignorar o rate limit (foi auto-enviado)

### 3. Ignorar OTPs auto-enviados no rate limit do frontend

No `DetalhesFicha.tsx`, na funcao `calculateRemainingSeconds`, comparar o `created_at` do OTP com o `created_at` da ficha. Se a diferenca for menor que 30 segundos, nao mostrar o countdown de rate limit.

**Arquivo:** `src/pages/DetalhesFicha.tsx`
- Alterar o `useEffect` que calcula o rate limit para comparar com `ficha.created_at`

### 4. Deploy da funcao atualizada

Deployar `send-otp` com as alteracoes.

## Arquivos modificados

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/send-otp/index.ts` | Reduzir rate limit + ignorar auto-envios |
| `src/pages/DetalhesFicha.tsx` | Reduzir rate limit + ignorar auto-envios |

## Resultado esperado

- Corretor cria ficha COM auto-envio: pode reenviar manualmente imediatamente
- Corretor cria ficha SEM auto-envio: pode enviar imediatamente (sem mudanca)
- Apos envio manual: aguarda 3 minutos antes de poder reenviar (anti-spam)
- Apos segundo envio manual: aguarda 3 minutos novamente
