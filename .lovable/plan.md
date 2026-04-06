
# Corretor Nome no PDF — Fix

## Problema
O campo `corretor_nome` existe na interface `Survey` mas nunca é preenchido. O select do Supabase busca `user_id` de `fichas_visita` mas não faz join com `profiles` para obter o nome.

## Solução

### `src/pages/Pesquisas.tsx`
Após buscar os surveys, fazer uma query separada em `profiles` usando os `user_id`s das fichas, e mapear `corretor_nome` em cada survey antes de retornar.

Lógica:
1. Coletar todos os `user_id` únicos dos surveys
2. Query `profiles` com `.in('id', userIds)` para buscar `nome_completo`
3. No `.map()` final, adicionar `corretor_nome: profilesMap[survey.fichas_visita.user_id]`

### `src/pages/empresa/EmpresaPesquisas.tsx`
Mesmo padrão: após buscar surveys, buscar profiles pelos `user_id`s e popular `corretor_nome`.

Precisa adicionar `user_id` ao select de `fichas_visita` (atualmente não inclui).

### `src/pages/construtora/ConstutoraPesquisas.tsx`
Já recebe `corretor_nome` via RPC — não precisa de mudança.

## Arquivos alterados

| Arquivo | Mudança |
|---------|------|
| `src/pages/Pesquisas.tsx` | Buscar profiles e popular `corretor_nome` |
| `src/pages/empresa/EmpresaPesquisas.tsx` | Adicionar `user_id` ao select + buscar profiles e popular `corretor_nome` |
