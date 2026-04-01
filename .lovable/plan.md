

## Plano: Remover FloatingActionButton de todas as telas

Remover o botão flutuante "+" (FAB) de todas as 4 páginas onde é usado.

### Alterações

**1. `src/pages/Dashboard.tsx`**
- Remover import do `FloatingActionButton`
- Remover bloco JSX do `<FloatingActionButton>` (~linhas 702-706)

**2. `src/pages/ListaFichas.tsx`**
- Remover import do `FloatingActionButton`
- Remover bloco JSX do `<FloatingActionButton>` (~linhas 398-402)

**3. `src/pages/ListaImoveis.tsx`**
- Remover import do `FloatingActionButton`
- Remover bloco JSX do `<FloatingActionButton>` (~linhas 280-284)

**4. `src/pages/ListaClientes.tsx`**
- Remover import do `FloatingActionButton`
- Remover bloco JSX do `<FloatingActionButton>` (~linhas 317-321)

O componente `src/components/FloatingActionButton.tsx` pode ser mantido no projeto (caso volte a ser usado) ou removido — sem impacto funcional.

