

## Corrigir visibilidade da rede de indicados do afiliado

### Problema
A política RLS da tabela `afiliados` só permite que o afiliado veja **seu próprio registro** (`user_id = auth.uid()`). Quando Fernanda tenta listar os afiliados que ela indicou (query com `.eq("indicado_por", afiliado.id)`), o RLS bloqueia porque os registros retornados pertencem a outros usuários.

### Solução
Atualizar a política RLS de SELECT na tabela `afiliados` para também permitir que um afiliado veja registros de quem ele indicou (`indicado_por = id do afiliado logado`).

### Mudança

**Migration SQL** — alterar a policy existente:

```sql
DROP POLICY IF EXISTS "Afiliado pode ver seus dados" ON public.afiliados;

CREATE POLICY "Afiliado pode ver seus dados" 
ON public.afiliados 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR indicado_por IN (SELECT id FROM public.afiliados WHERE user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'super_admin'
  )
);
```

Isso adiciona a condição: "ou o registro foi indicado por mim" — permitindo que Fernanda veja Francisco na sua rede, sem expor dados de afiliados não relacionados.

| Arquivo | Mudança |
|---------|---------|
| Nova migration SQL | Recriar policy `Afiliado pode ver seus dados` com condição `indicado_por` |

Nenhum arquivo de código precisa ser alterado — a query já existe no dashboard.

