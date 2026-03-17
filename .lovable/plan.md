

## Problema Crítico: `generate-pdf` quebrado para chamadas internas

### O que encontrei

As funções `send-email`, `text-to-speech`, `elevenlabs-tts` e `chat-assistente` estão **OK** — sem conflitos de variáveis e os auth gates estão corretos.

Porém, a função **`generate-pdf`** tem um problema grave:

**As funções `verify-otp` e `regenerate-backup` chamam `generate-pdf` usando apenas `apikey` (anon key), SEM passar `Authorization: Bearer <service_role_key>`.**

```text
// verify-otp (linha 37-40) — SEM Authorization header!
headers: {
  'Content-Type': 'application/json',
  'apikey': supabaseAnonKey,
}

// regenerate-backup (linha 66-68) — SEM Authorization header!
headers: {
  'Content-Type': 'application/json',
  'apikey': supabaseAnonKey,
}
```

O auth gate do `generate-pdf` exige JWT ou service_role, então **essas chamadas internas estão retornando 401**. Isso significa que:
- Quando um visitante confirma a visita (OTP) → **o PDF de backup NÃO está sendo gerado**
- Quando um admin regenera o backup → **também falha**

Em contraste, `send-email` está OK porque `verify-otp` e `regenerate-backup` já passam `Authorization: Bearer ${serviceKey}`.

### Correção

Adicionar o header `Authorization: Bearer <SERVICE_ROLE_KEY>` nas chamadas internas ao `generate-pdf` em:

1. **`supabase/functions/verify-otp/index.ts`** (linha ~37): adicionar `'Authorization': \`Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}\``
2. **`supabase/functions/regenerate-backup/index.ts`** (linha ~66): adicionar `'Authorization': \`Bearer ${supabaseServiceKey}\``

### Resumo das funções protegidas

| Função | Status | Observação |
|--------|--------|------------|
| `send-whatsapp` | ✅ Corrigido | Variável renomeada, funcionando |
| `send-email` | ✅ OK | Chamadas internas já usam service_role |
| `generate-pdf` | ⚠️ QUEBRADO | Chamadas internas sem Authorization |
| `text-to-speech` | ✅ OK | Auth gate funcional |
| `elevenlabs-tts` | ✅ OK | Auth gate funcional |
| `chat-assistente` | ✅ OK | Rate limiter funcional |
| `seed-test-admin` | ✅ Bloqueado | Retorna 403 |

