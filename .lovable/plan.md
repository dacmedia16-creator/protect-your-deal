

## Scroll to top ao clicar "Seja um Afiliado"

### Problema
Ao clicar no link "Seja um Afiliado" no footer da landing principal, a página `/afiliados` abre mas não rola para o topo.

### Mudança

| Arquivo | O que fazer |
|---------|------------|
| `src/pages/Afiliados.tsx` | Adicionar `useEffect` com `window.scrollTo(0, 0)` no mount do componente |

