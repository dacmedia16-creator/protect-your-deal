

## Corrigir política INSERT aberta na tabela `audit_logs`

### Problema
A política `"Sistema pode inserir logs"` usa `WITH CHECK (true)` para o role `public`, permitindo que qualquer requisição não autenticada insira registros arbitrários no log de auditoria.

### Correção
Restringir INSERT apenas ao `service_role`, igual à correção aplicada em `webhook_logs`.

```sql
DROP POLICY "Sistema pode inserir logs" ON public.audit_logs;

CREATE POLICY "Service role pode inserir logs"
ON public.audit_logs
FOR INSERT
TO service_role
WITH CHECK (true);
```

### Escopo
- 1 migration SQL (drop + recreate policy)
- Nenhuma mudança no frontend

