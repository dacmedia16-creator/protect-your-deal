

## Plano: Corrigir erro "email_exists" ao criar acesso de afiliado

### Problema
Os logs mostram que a edge function `admin-criar-acesso-afiliado` falha com `AuthApiError: A user with this email address has already been registered`. Isso acontece quando o email do afiliado já existe na tabela `auth.users` (ex: já foi cadastrado em outro contexto).

### Solução

**`supabase/functions/admin-criar-acesso-afiliado/index.ts`**

Quando `createUser` retornar erro `email_exists`, buscar o usuário existente por email via `supabaseAdmin.auth.admin.listUsers()` e usar esse `user.id` para vincular ao afiliado. Gerar link de recuperação de senha em vez de enviar senha temporária.

Fluxo atualizado:
1. Tentar criar usuário normalmente
2. Se erro `email_exists`:
   - Buscar usuário existente pelo email
   - Usar o `id` desse usuário para vincular ao afiliado
   - Enviar email de recuperação de senha (em vez de senha temporária)
3. Se criou com sucesso: fluxo atual (envia email com senha temporária)

Trecho a alterar (linhas 88-104):

```typescript
// Tentar criar usuário
const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
  email: afiliado.email,
  password: tempPassword,
  email_confirm: true,
  user_metadata: { nome: afiliado.nome },
});

let userId: string;
let isExistingUser = false;

if (createError) {
  // Se email já existe, buscar usuário existente
  if (createError.message?.includes("already been registered")) {
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = listData?.users?.find(u => u.email === afiliado.email);
    if (!existingUser) {
      return new Response(JSON.stringify({ error: "Usuário não encontrado" }), { status: 400, ... });
    }
    userId = existingUser.id;
    isExistingUser = true;
  } else {
    return new Response(JSON.stringify({ error: createError.message }), { status: 400, ... });
  }
} else {
  userId = newUser.user.id;
}
```

No envio de email: se `isExistingUser`, enviar mensagem informando que o acesso ao painel de afiliados foi ativado (sem senha temporária, pois já tem conta).

