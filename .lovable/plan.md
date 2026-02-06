

# Corrigir Erro de Conexao na Confirmacao OTP

## Resumo

O problema principal e que as funcoes de backend do fluxo OTP (`get-otp-info`, `verify-otp`, `send-otp`) nao estao deployadas no servidor, retornando erro 404 quando o comprador/proprietario tenta acessar o link de confirmacao. Alem disso, os headers CORS dessas funcoes estao incompletos.

## Acoes

### 1. Corrigir headers CORS nas 3 funcoes OTP

Atualizar o header `Access-Control-Allow-Headers` para incluir os headers enviados pelo Supabase JS client v2.88+:

| Arquivo | Linha | Alteracao |
|---------|-------|-----------|
| `supabase/functions/get-otp-info/index.ts` | 6 | Adicionar headers CORS completos |
| `supabase/functions/verify-otp/index.ts` | 6 | Adicionar headers CORS completos |
| `supabase/functions/send-otp/index.ts` | 6 | Adicionar headers CORS completos |

Headers atualizados:
```text
authorization, x-client-info, apikey, content-type,
x-supabase-client-platform, x-supabase-client-platform-version,
x-supabase-client-runtime, x-supabase-client-runtime-version
```

### 2. Adicionar logs de diagnostico no get-otp-info

Incluir `console.log` no inicio da funcao para registrar quando uma requisicao chega e qual token foi recebido. Isso facilita debug futuro.

### 3. Melhorar mensagem de erro no frontend

No arquivo `src/pages/ConfirmarVisita.tsx`, melhorar a mensagem de erro de conexao para incluir informacoes mais uteis ao usuario, como orientacao para tentar novamente em alguns instantes.

### 4. Deployar as 3 funcoes OTP

Apos as correcoes de codigo, deployar:
- `get-otp-info`
- `verify-otp`
- `send-otp`

### 5. Testar o fluxo

Chamar `get-otp-info` via HTTP para confirmar que retorna 200 em vez de 404.

## Arquivos modificados

| Arquivo | Tipo de alteracao |
|---------|-------------------|
| `supabase/functions/get-otp-info/index.ts` | CORS + logs |
| `supabase/functions/verify-otp/index.ts` | CORS |
| `supabase/functions/send-otp/index.ts` | CORS |
| `src/pages/ConfirmarVisita.tsx` | Mensagem de erro melhorada |

## Impacto

- Os links de confirmacao enviados para compradores e proprietarios voltarao a funcionar
- Headers CORS completos evitam falhas intermitentes em diferentes navegadores
- Logs de diagnostico facilitam debug de problemas futuros

