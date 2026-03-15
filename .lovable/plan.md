

## Corrigir `search_path` mutável em `get_imobiliarias_publicas`

### Problema
A função `public.get_imobiliarias_publicas()` é a única função do schema `public` sem `search_path` definido. As demais funções do projeto já estão corretamente configuradas com `SET search_path TO 'public'`.

### Correção
Recriar a função adicionando `SET search_path TO 'public'`:

```sql
CREATE OR REPLACE FUNCTION public.get_imobiliarias_publicas()
 RETURNS TABLE(id uuid, nome text, codigo integer, logo_url text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id, nome, codigo, logo_url
  FROM imobiliarias
  WHERE status = 'ativo';
$function$;
```

### Escopo
- 1 migration SQL (recriar função com search_path fixo)
- Nenhuma mudança no frontend

