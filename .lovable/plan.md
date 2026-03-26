

## Plano: Corrigir lentidão causada pelas RLS policies do módulo construtora

### Diagnóstico

As RLS policies criadas para o módulo construtora estão causando lentidão global no sistema por três razões:

1. **Sem índice adequado**: `user_roles` não tem índice em `(user_id, construtora_id)`. A função `get_user_construtora()` faz full scan na tabela.

2. **Chamadas duplas nas policies**: Policies como `construtora_id = get_user_construtora(auth.uid()) AND get_user_construtora(auth.uid()) IS NOT NULL` chamam a função **duas vezes** por avaliação de linha — em `fichas_visita`, `assinaturas` e `user_roles`.

3. **Avaliação em todas as queries**: Mesmo para usuários que NÃO são de construtora, o Postgres avalia essas policies (e chama `get_user_construtora`) em cada SELECT nessas tabelas.

### Correções (1 migração SQL)

**1. Criar índice em `user_roles`**
```sql
CREATE INDEX idx_user_roles_user_construtora 
  ON public.user_roles(user_id, construtora_id) 
  WHERE construtora_id IS NOT NULL;
```

**2. Reescrever policies para eliminar chamadas duplas**

Substituir o padrão `X = get_user_construtora(auth.uid()) AND get_user_construtora(auth.uid()) IS NOT NULL` por uma única chamada que já resolve ambas as condições:

- `assinaturas`: `construtora_id IS NOT NULL AND construtora_id = get_user_construtora(auth.uid())`
- `fichas_visita`: mesma correção
- `user_roles`: mesma correção

Colocar `construtora_id IS NOT NULL` primeiro faz o Postgres rejeitar linhas sem construtora antes de chamar a função.

**3. Adicionar índice geral em `user_roles(user_id)`**
```sql
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
```
Isso acelera todas as funções que consultam `user_roles` por `user_id` (`get_user_construtora`, `get_user_imobiliaria`, `has_role`, `is_imobiliaria_admin`, etc.).

### Impacto esperado
- Eliminação de ~50% das chamadas de função nas RLS policies
- Queries indexadas em vez de full scans
- Melhora perceptível em todas as telas do sistema

