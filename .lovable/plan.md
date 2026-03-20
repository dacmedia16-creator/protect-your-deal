

## Reduzir destaque e espaço do card "Registros como Parceiro"

### Mudança

| Arquivo | O que fazer |
|---------|------------|
| `src/pages/Dashboard.tsx` (linhas 410-432) | Transformar em uma linha compacta e neutra, sem fundo colorido, borda sutil, ícone e texto menores |

### De → Para

- **Card**: `border-primary/20 bg-primary/5 mb-6` → `border-border mb-4`
- **Padding**: `p-4 gap-4` → `px-3 py-2 gap-3`
- **Ícone container**: `h-12 w-12 rounded-xl bg-primary/20` → removido, ícone inline
- **Ícone**: `h-6 w-6 text-primary` → `h-4 w-4 text-muted-foreground`
- **Texto título**: `font-semibold text-primary` → `text-sm font-medium text-foreground`
- **Subtítulo**: mantém `text-sm text-muted-foreground` mas em `text-xs`

Resultado: linha discreta similar a um link com badge, ocupando ~50% menos altura vertical.

