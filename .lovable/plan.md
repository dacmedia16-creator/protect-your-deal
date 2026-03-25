

## Corrigir Logo na Página de Login

### Problema
Na página `/auth`, o logo no painel azul esquerdo não aparece. A classe `brightness-0 invert` aplicada ao PNG não está funcionando corretamente para torná-lo branco sobre o fundo azul.

### Correção

| Arquivo | O que fazer |
|---------|------------|
| `src/pages/Auth.tsx` (linha 466) | Remover `brightness-0 invert` e usar `filter: drop-shadow(...)` ou simplesmente remover o filtro e deixar o logo com suas cores originais. Como o logo PNG tem fundo transparente com cores escuras, a solução é manter o logo original (sem filtro) já que ele deve ser visível sobre o fundo azul, ou aplicar `invert` + `brightness-200` para garantir contraste |

### Abordagem recomendada
Trocar `className="brightness-0 invert"` por `className="brightness-0 invert"` não funciona bem com PNGs coloridos. A melhor solução: remover os filtros e deixar o logo com suas cores naturais, já que o novo logo PNG provavelmente já tem boa visibilidade. Se o logo for escuro, usar apenas `className="invert"`.

