

## Problema

Na página "Registros de Visita" da construtora, o nome do corretor aparece como "Desconhecido" porque a tabela `profiles` tem RLS que bloqueia o acesso para `construtora_admin`. As políticas atuais de `profiles` só permitem leitura para: o próprio usuário, super_admin, e admin de imobiliária.

O código em `ConstutoraFichas.tsx` faz uma query separada `supabase.from('profiles').select(...)` que retorna vazio por causa do RLS.

## Solução

Criar uma função RPC `get_fichas_construtora` (similar à já existente `get_fichas_empresa`) que usa `SECURITY DEFINER` para fazer o JOIN com profiles internamente, contornando o RLS de forma segura.

### 1. Migração: criar função `get_fichas_construtora`

```sql
CREATE OR REPLACE FUNCTION public.get_fichas_construtora(p_construtora_id uuid)
RETURNS TABLE(
  id uuid, protocolo text, imovel_endereco text,
  proprietario_nome text, comprador_nome text,
  data_visita timestamptz, status text, user_id uuid,
  convertido_venda boolean, corretor_nome text,
  created_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT (
    public.is_construtora_admin(auth.uid(), p_construtora_id)
    OR public.is_super_admin(auth.uid())
  ) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  RETURN QUERY
  SELECT f.id, f.protocolo, f.imovel_endereco,
    f.proprietario_nome, f.comprador_nome, f.data_visita,
    f.status, f.user_id,
    COALESCE(f.convertido_venda, false),
    CASE WHEN f.user_id IS NULL THEN NULL
         ELSE COALESCE(p.nome, 'Desconhecido') END,
    f.created_at
  FROM fichas_visita f
  LEFT JOIN profiles p ON p.user_id = f.user_id
  WHERE f.construtora_id = p_construtora_id
  ORDER BY f.created_at DESC;
END; $$;
```

### 2. Atualizar `ConstutoraFichas.tsx`

Substituir as duas queries separadas (fichas + profiles) por uma única chamada RPC:

```typescript
const { data, error } = await supabase
  .rpc('get_fichas_construtora', { p_construtora_id: construtoraId });
```

Mapear o resultado diretamente (igual ao padrão usado em `EmpresaFichas.tsx`), sem necessidade de buscar profiles separadamente.

