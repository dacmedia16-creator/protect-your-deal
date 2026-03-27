

## Plano: Adicionar política RLS para busca de imobiliárias pelo construtora_admin

### Problema
A tabela `imobiliarias` não possui nenhuma política RLS que permita usuários com role `construtora_admin` fazer SELECT. Quando o admin da construtora busca uma imobiliária para convidar como parceira, o RLS bloqueia a query e retorna zero resultados.

### Solução
Criar uma política RLS na tabela `imobiliarias` permitindo que `construtora_admin` possa ler imobiliárias com status `ativo`.

### Migração SQL
```sql
CREATE POLICY "Construtora admin pode buscar imobiliárias ativas"
  ON public.imobiliarias
  FOR SELECT
  TO authenticated
  USING (
    status = 'ativo'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'construtora_admin'
    )
  );
```

Nenhuma alteração de código necessária — apenas a política de segurança faltava.

