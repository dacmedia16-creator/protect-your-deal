

## Plano: Corrigir criação e listagem de corretores da construtora

### Causa raiz
Dois problemas interligados:

1. **RLS bloqueia leitura de profiles**: A tabela `profiles` não tem política SELECT para `construtora_admin`. O frontend consulta `profiles` com o client normal (não service role), então retorna vazio — os corretores existem mas não aparecem na lista.

2. **Erro de email duplicado não é exibido**: O primeiro teste com `Fernando@gmail.com` falhou porque o email já existia. O backend retornou corretamente `{ error: "Este email já está cadastrado" }` com status 400, mas o frontend mostrou mensagem genérica.

Os logs confirmam que o segundo teste (`Fernando1@gmail.com`) **foi criado com sucesso** no backend. O corretor existe, mas a listagem não o mostra por causa do RLS.

### Correções

**1. Migration: Adicionar política SELECT em `profiles` para construtora_admin**

```sql
CREATE POLICY "Construtora admin pode ver perfis dos seus corretores"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = profiles.user_id
      AND ur.role = 'corretor'
      AND ur.construtora_id = get_user_construtora(auth.uid())
      AND get_user_construtora(auth.uid()) IS NOT NULL
  )
);
```

Isso permite que o `construtora_admin` veja profiles de corretores vinculados à sua construtora (via `user_roles.construtora_id`).

**2. Frontend: melhorar feedback de erro no `handleCreate`**

O padrão de extração de erro via `(error as any)?.context` pode falhar se o SDK retornar o erro de forma diferente. Adicionar fallback para `data?.error` quando `data.success` é falso, e logar o erro no console para debug.

### Arquivos alterados
1. **Migration SQL** — Nova política RLS em `profiles`
2. `src/pages/construtora/ConstutoraCorretores.tsx` — Melhorar log de debug nos handlers de erro

### Sem alterações nas edge functions
O backend está funcionando corretamente (logs confirmam criação bem-sucedida).

