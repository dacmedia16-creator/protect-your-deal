

# Plano: Ocultar fichas de parceiro (em vez de descartar)

## Contexto
O descarte (UPDATE em `fichas_visita`) continua falhando por RLS. A solução alternativa é criar uma tabela de ocultação por usuário, sem tocar na `fichas_visita`.

## Etapa 1 — Criar tabela `fichas_ocultas`

```sql
CREATE TABLE public.fichas_ocultas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ficha_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, ficha_id)
);

ALTER TABLE public.fichas_ocultas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário pode ver suas ocultações"
  ON public.fichas_ocultas FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Usuário pode ocultar fichas"
  ON public.fichas_ocultas FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuário pode desfazer ocultação"
  ON public.fichas_ocultas FOR DELETE TO authenticated
  USING (user_id = auth.uid());
```

Sem UPDATE (não há campo editável). Sem foreign key para `fichas_visita` (evita dependência de cascade).

## Etapa 2 — Alterar `DescartarFichaDialog`

Trocar a lógica de UPDATE por INSERT em `fichas_ocultas`:

```ts
// Antes: supabase.from('fichas_visita').update({...})
// Depois:
await supabase.from('fichas_ocultas').insert({
  user_id: (await supabase.auth.getUser()).data.user!.id,
  ficha_id: fichaId,
});
```

Renomear o label do botão para "Ocultar" e ajustar textos do dialog.

## Etapa 3 — Filtrar fichas ocultas em todos os pontos

### ListaFichas.tsx
- Após carregar fichas via `useInfiniteList`, buscar `fichas_ocultas` do usuário e filtrar no `useMemo` de `filteredFichas`.
- Atualizar contadores (`parceiroCount`, `pendingCount`, etc.) para excluir ocultas.

### FichasParceiro.tsx
- Buscar `fichas_ocultas` do usuário e filtrar a lista antes de renderizar.

### Dashboard.tsx
- Na query de `dashboard-stats`, buscar IDs ocultos e excluir do cálculo de `fichasComoParceiro`.

## Etapa 4 — Invalidar queries após ocultar

No `onDiscarded` / callback do dialog, invalidar:
- `['fichas', user.id]`
- `['fichas-parceiro', user.id]`
- `['dashboard-stats', user.id]`

## Arquivos modificados

| Arquivo | Alteração |
|---------|-----------|
| Migration SQL | Criar `fichas_ocultas` + RLS |
| `src/components/DescartarFichaDialog.tsx` | INSERT em `fichas_ocultas` em vez de UPDATE em `fichas_visita` |
| `src/pages/ListaFichas.tsx` | Query de ocultas + filtro |
| `src/pages/FichasParceiro.tsx` | Query de ocultas + filtro |
| `src/pages/Dashboard.tsx` | Query de ocultas + filtro nos stats |

## Riscos

- Nenhum: não toca em `fichas_visita`, não altera policies existentes, não modifica `_shared/auth.ts`.
- A ficha continua existindo normalmente para o corretor proprietário.
- Se o parceiro quiser ver novamente, basta deletar a row de `fichas_ocultas` (funcionalidade futura, se necessário).

