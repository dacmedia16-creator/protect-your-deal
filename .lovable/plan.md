

## Diagnóstico

A Edge Function `send-whatsapp` está crashando ao iniciar com o erro:

```
SyntaxError: Identifier 'authHeader' has already been declared (line 121)
```

**Causa**: Quando adicionamos o auth gate, usamos `const authHeader` (linha 69) para o header JWT. Porém, já existia outra `const authHeader` (linha 142) para a autenticação Basic da API ZionTalk. Como ambas estão no mesmo escopo `try`, o Deno rejeita a redeclaração.

## Correção

Renomear a variável na linha 142 de `authHeader` para `ziontalkAuthHeader` (e atualizar as referências nas linhas 155 e 267 que usam essa variável para o Basic auth da ZionTalk).

Arquivos alterados:
- `supabase/functions/send-whatsapp/index.ts` — renomear `const authHeader = btoa(...)` → `const ziontalkAuthHeader = btoa(...)` e atualizar as 2 referências nos headers de `fetch()`

