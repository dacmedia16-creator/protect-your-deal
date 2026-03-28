

## Plano: Corrigir seletor de construtoras parceiras

### Problema
O seletor de construtoras não mostra as opções porque a tabela `construtoras` tem RLS que permite leitura **apenas** para `super_admin` e `construtora_admin` da própria construtora. Corretores de imobiliária não conseguem ler os dados da construtora no JOIN, então `p.construtoras` retorna `null`.

### Solução

Criar uma nova política RLS na tabela `construtoras` que permita imobiliárias parceiras verem as construtoras vinculadas:

```sql
CREATE POLICY "Imobiliaria parceira pode ver construtora"
ON public.construtoras
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.construtora_imobiliarias ci
    WHERE ci.construtora_id = construtoras.id
    AND ci.imobiliaria_id = get_user_imobiliaria(auth.uid())
    AND ci.status = 'ativa'
  )
);
```

Apenas uma migração. Nenhuma alteração de código frontend necessária — a query já funciona, só faltava a permissão de leitura.

