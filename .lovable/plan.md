

## Plano: Mostrar nome abreviado do corretor + imobiliária na listagem de fichas da construtora

### Problema
Na página de Registros de Visita da construtora, a coluna "Corretor" mostra apenas o nome completo. O usuário quer ver o nome abreviado e a imobiliária a que o corretor pertence.

### Solução

#### 1. Migração: atualizar a função `get_fichas_construtora`

Adicionar `corretor_imobiliaria_nome` ao retorno da RPC, fazendo JOIN com `user_roles` e `imobiliarias`. Também abreviar o nome (primeiro nome + inicial do sobrenome):

```sql
CREATE OR REPLACE FUNCTION public.get_fichas_construtora(p_construtora_id uuid)
RETURNS TABLE(
  id uuid, protocolo text, imovel_endereco text,
  proprietario_nome text, comprador_nome text,
  data_visita timestamptz, status text, user_id uuid,
  convertido_venda boolean, corretor_nome text,
  corretor_imobiliaria_nome text,
  created_at timestamptz
)
...
  SELECT f.id, f.protocolo, f.imovel_endereco,
    f.proprietario_nome, f.comprador_nome, f.data_visita,
    f.status, f.user_id,
    COALESCE(f.convertido_venda, false),
    CASE WHEN f.user_id IS NULL THEN NULL
         ELSE COALESCE(p.nome, 'Desconhecido') END,
    i.nome,  -- imobiliaria nome (null se corretor da construtora)
    f.created_at
  FROM fichas_visita f
  LEFT JOIN profiles p ON p.user_id = f.user_id
  LEFT JOIN user_roles ur ON ur.user_id = f.user_id AND ur.imobiliaria_id IS NOT NULL
  LEFT JOIN imobiliarias i ON i.id = ur.imobiliaria_id
  WHERE f.construtora_id = p_construtora_id
  ORDER BY f.created_at DESC;
```

#### 2. Atualizar `ConstutoraFichas.tsx`

- Adicionar `corretor_imobiliaria?: string` na interface `Ficha`.
- Mapear `corretor_imobiliaria_nome` do RPC.
- Abreviar o nome no frontend: `"Denis F."` em vez de `"Denis Fábio de Souza"`.
- Exibir abaixo do nome abreviado (ou ao lado), em texto menor e cor muted, o nome da imobiliária quando presente.

Exemplo visual na coluna Corretor:
```
Denis F.
Imob. XYZ
```

### Detalhes técnicos
- A abreviação será feita no frontend com uma função helper: pega o primeiro nome + inicial do segundo nome + "."
- Se o corretor não pertence a uma imobiliária (é da própria construtora), não mostra nome de imobiliária.
- Aplica tanto na view mobile (cards) quanto desktop (tabela).

