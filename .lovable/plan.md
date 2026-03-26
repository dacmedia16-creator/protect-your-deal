

## Plano: Corrigir criação de corretor pela construtora

### Problema identificado
Os logs mostram que a edge function `admin-create-corretor` foi chamada corretamente (`Creating corretor: Fernando@gmail.com construtora: true`), mas não há log de sucesso ou erro após isso. O frontend mostra apenas "Erro ao criar corretor" sem detalhes, porque o tratamento de erro não extrai a mensagem real do backend.

Dois problemas:

1. **Frontend não extrai mensagem de erro do backend** — Quando a edge function retorna status não-2xx (403, 400, 500), o SDK Supabase coloca o erro em `error` mas a mensagem real está em `error.context`. O frontend ignora isso e mostra mensagem genérica.

2. **Possível email duplicado** — `Fernando@gmail.com` pode já existir no sistema, causando erro que é engolido.

### Correções

**Arquivo:** `src/pages/construtora/ConstutoraCorretores.tsx`

Melhorar tratamento de erro em `handleCreate`, `handleEdit`, `handleToggleAtivo` e `handleResetPassword` para extrair a mensagem real do backend, seguindo o padrão documentado em `admin-api-error-handling-pattern`:

```typescript
// Extrair mensagem real do erro
if (error) {
  let msg = 'Erro ao criar corretor';
  try {
    const ctx = (error as any)?.context;
    if (ctx instanceof Response) {
      const body = await ctx.json();
      msg = body.error || msg;
    }
  } catch {}
  toast.error(msg);
  return;
}
```

**Arquivo:** `supabase/functions/admin-create-corretor/index.ts`

Adicionar logs de diagnóstico após cada ponto de decisão para facilitar debug futuro:
- Log após role check: `console.log("Role found:", roleData.role, "construtora_id:", roleData.construtora_id)`
- Log após criação do usuário: `console.log("User created:", userId)`
- Log em caso de erro: `console.error("Create error:", createError.message)`

### Arquivos alterados
1. `src/pages/construtora/ConstutoraCorretores.tsx` — Melhorar extração de mensagens de erro
2. `supabase/functions/admin-create-corretor/index.ts` — Adicionar logs de diagnóstico

