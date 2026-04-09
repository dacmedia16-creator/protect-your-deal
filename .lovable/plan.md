

# Plano de Correção — Auditoria de Regressão

## Arquivos alterados

| # | Arquivo | Mudança |
|---|---------|---------|
| 1 | `src/pages/construtora/ConstrutoraDashboard.tsx` | Adicionar `.limit(10000)` nas 3 queries de `fichas_visita` que retornam dados (não `head: true`) |
| 2 | `src/pages/construtora/ConstutoraRelatorios.tsx` | Adicionar `.limit(10000)` nas 2 queries de fichas (atual e período anterior) |
| 3 | `src/lib/statusColors.ts` | Adicionar `no_show` ao mapa `fichaStatusColors` |
| 4 | `src/pages/construtora/ConstutoraEquipes.tsx` | Avaliar — sem `DialogTrigger` ou `forwardRef` encontrado no código, e sem warnings no console atual. **Não será alterado** pois o warning não foi reproduzido. |

## Detalhes por prioridade

### Prioridade 1 — Truncamento silencioso

As queries diretas a `fichas_visita` nos arquivos de Dashboard e Relatórios não possuem `.limit()`, ficando sujeitas ao default de 1000 rows do Supabase. A correção é adicionar `.limit(10000)` em cada query que retorna dados reais (não as que usam `{ count: 'exact', head: true }`).

**Dashboard** (3 queries):
- Fichas do mês atual (linha ~150-153)
- Fichas do mês anterior (linha ~154-158)
- Fichas do gráfico 6 meses (linha ~184-188)

**Relatórios** (2 queries):
- Fichas do período selecionado (linha ~113-124)
- Fichas do período anterior (linha ~139-144)

### Prioridade 2 — Status `no_show` sem cor

Adicionar uma entrada ao objeto `fichaStatusColors`:
```
no_show: 'bg-destructive/20 text-destructive border border-destructive/30'
```
Cor vermelha/destrutiva pois no-show é um evento negativo.

### Prioridade 3 — Warning de ref

O warning mencionado na auditoria não é reproduzível no estado atual (sem `DialogTrigger` nem `forwardRef` no arquivo, e console limpo). **Será ignorado** — nenhuma alteração necessária.

