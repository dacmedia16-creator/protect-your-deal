

## Plano: Mostrar corretor e imobiliária na listagem de pesquisas da construtora

### Problema
A página de Pesquisas da construtora não mostra qual corretor/imobiliária parceira enviou a pesquisa. A construtora não consegue distinguir de quem veio cada pesquisa.

### Solução

#### 1. Migração: criar RPC `get_surveys_construtora`
Função SECURITY DEFINER que faz JOIN com `profiles` e `imobiliarias` (mesmo padrão de `get_fichas_construtora`):

```sql
CREATE OR REPLACE FUNCTION public.get_surveys_construtora(p_construtora_id uuid)
RETURNS TABLE(
  id uuid, token text, status text, sent_at timestamptz, responded_at timestamptz,
  client_name text, client_phone text, ficha_id uuid,
  imovel_endereco text, comprador_nome text, protocolo text,
  corretor_nome text, corretor_imobiliaria_nome text,
  created_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT (is_construtora_admin(auth.uid(), p_construtora_id) OR is_super_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;
  RETURN QUERY
  SELECT s.id, s.token, s.status, s.sent_at, s.responded_at,
    s.client_name, s.client_phone, s.ficha_id,
    fv.imovel_endereco, fv.comprador_nome, fv.protocolo,
    p.nome, i.nome,
    s.created_at
  FROM surveys s
  LEFT JOIN fichas_visita fv ON fv.id = s.ficha_id
  LEFT JOIN profiles p ON p.user_id = s.corretor_id
  LEFT JOIN user_roles ur ON ur.user_id = s.corretor_id AND ur.imobiliaria_id IS NOT NULL
  LEFT JOIN imobiliarias i ON i.id = ur.imobiliaria_id
  WHERE s.construtora_id = p_construtora_id
  ORDER BY s.created_at DESC;
END; $$;
```

#### 2. Atualizar `ConstutoraPesquisas.tsx`
- Substituir a query Supabase direta por chamada à RPC `get_surveys_construtora`
- Buscar `survey_responses` separadamente para as surveys retornadas
- Adicionar `corretor_nome` e `corretor_imobiliaria_nome` à interface `Survey`
- Usar `abreviarNome()` para exibir o nome do corretor abreviado
- Adicionar coluna "Corretor" na tabela desktop e info no card mobile
- Mostrar nome abreviado + imobiliária em texto muted abaixo

Exemplo visual na coluna Corretor:
```text
Denis S.
Imob. ABC
```

### Detalhes técnicos
- RPC SECURITY DEFINER contorna a limitação de RLS que impede construtora_admin de ler profiles/imobiliarias
- A query de `survey_responses` será feita em paralelo usando os IDs retornados pela RPC (RLS já permite via política existente)
- O filtro de status será aplicado no frontend (a RPC retorna todas)
- Função `abreviarNome`: primeiro nome + inicial do segundo + "."

