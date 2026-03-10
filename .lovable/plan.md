

## Corrigir: super_admin não consegue finalizar fichas parcialmente

### Causa raiz

A tabela `fichas_visita` tem políticas RLS de SELECT e DELETE para super_admin, mas **não tem política de UPDATE**. Quando o super_admin tenta mudar o status para `finalizado_parcial`, o Supabase ignora silenciosamente (retorna sem erro, mas 0 rows afetadas). O código segue para o `regenerate-backup`, que encontra a ficha ainda no status antigo e rejeita.

### Solução

**1. Criar migração SQL** — adicionar política RLS de UPDATE para super_admin:

```sql
CREATE POLICY "Super admin pode atualizar fichas"
ON public.fichas_visita
FOR UPDATE
TO authenticated
USING (is_super_admin(auth.uid()));
```

### Escopo
- Uma migração SQL (nova política RLS)
- Nenhuma mudança de código no frontend

