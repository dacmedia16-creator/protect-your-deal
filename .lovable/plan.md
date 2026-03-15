

## Restringir audit_logs para admins da imobiliária

### Problema
A política SELECT `"Admin imobiliária pode ver logs da sua imobiliária"` usa apenas `imobiliaria_id = get_user_imobiliaria(auth.uid())`, permitindo que qualquer corretor da imobiliária leia logs de auditoria com dados sensíveis (old_data, new_data, ip_address, user_agent).

### Correção
Recriar a política adicionando verificação de admin:

```sql
DROP POLICY "Admin imobiliária pode ver logs da sua imobiliária" ON public.audit_logs;

CREATE POLICY "Admin imobiliária pode ver logs da sua imobiliária"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  (imobiliaria_id = get_user_imobiliaria(auth.uid()))
  AND is_imobiliaria_admin(auth.uid(), imobiliaria_id)
);
```

### Escopo
- 1 migration SQL
- 0 arquivos frontend alterados

