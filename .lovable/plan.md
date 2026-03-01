

## Diagnóstico

O erro **não é de formatação** (o `unformatPhone` já está aplicado). O problema real:

1. O número `15981788214` **já existe em outro perfil** no banco de dados
2. O backend retorna status 400 com mensagem amigável: "Este telefone já está em uso por outro usuário"
3. **Porém**, o `supabase.functions.invoke()` para respostas não-2xx coloca o erro em `response.error` com mensagem genérica "Edge Function returned a non-2xx status code", e o body real com a mensagem amigável não é acessível via `response.data`

## Solução

Duas opções para resolver:

### Opção A: Melhorar tratamento de erro no frontend
**`src/pages/admin/AdminUsuarios.tsx`** -- Extrair a mensagem real do erro da Edge Function:

```ts
// No handleEditUser, após o invoke:
if (response.error) {
  // Tentar extrair mensagem do body da resposta
  const errorBody = response.error?.context;
  let errorMsg = "Erro ao atualizar usuário";
  try {
    if (errorBody instanceof Response) {
      const parsed = await errorBody.json();
      errorMsg = parsed.error || errorMsg;
    }
  } catch {}
  throw new Error(response.data?.error || errorMsg);
}
```

### Opção B (mais simples): Verificar quem usa o número
Primeiro descobrir qual usuário já tem esse telefone cadastrado, para que você possa liberar ou trocar. Posso consultar o banco para verificar.

---

**Resumo**: O número `15981788214` está duplicado no banco. Você quer que eu (A) melhore o tratamento de erro para mostrar a mensagem correta, (B) consulte qual usuário já tem esse número, ou ambos?

