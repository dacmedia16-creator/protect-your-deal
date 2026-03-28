

## Plano: Adicionar coluna "Corretores Parceiros" no Admin de Construtoras

### Problema
A listagem de construtoras no painel Super Admin não mostra a quantidade de corretores parceiros (corretores de imobiliárias parceiras que criaram fichas para a construtora), apenas corretores internos.

### Solução

Adicionar uma coluna "Corr. Parceiros" na tabela e nos cards mobile, contando os corretores distintos (por `user_id`) que criaram fichas para cada construtora mas pertencem a imobiliárias parceiras (não à construtora diretamente).

#### Alterações em `AdminConstrutoras.tsx`

1. **Interface**: Adicionar `corretores_parceiros_count` ao tipo `Construtora`

2. **fetchConstrutoras**: Adicionar query para contar corretores parceiros distintos:
   - Buscar `fichas_visita` com `construtora_id = c.id` e `imobiliaria_id IS NOT NULL`
   - Contar `user_id` distintos (corretores que vieram de imobiliárias, não da construtora)
   - Usar `select('user_id')` e contar únicos no JS

3. **Desktop table**: Adicionar coluna "Corr. Parceiros" após "Parceiras"

4. **Mobile cards**: Adicionar "corr. parceiros" na linha de stats junto com empreendimentos/parceiras/corretores

### Detalhes técnicos
- A query usa `fichas_visita` filtrada por `construtora_id` e `imobiliaria_id IS NOT NULL` para identificar fichas de parceiros
- Contagem de `user_id` distintos via Set no JS (a query Supabase não suporta COUNT DISTINCT facilmente)
- Como super_admin tem RLS de SELECT em fichas_visita, a query funciona diretamente
- Sem migração necessária

