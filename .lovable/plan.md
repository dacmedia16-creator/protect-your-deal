

## Plano: Corrigir warnings de forwardRef

### Alterações

**1. `src/components/LogoIcon.tsx`**
- Envolver com `React.forwardRef<HTMLImageElement, LogoIconProps>`
- Adicionar `displayName`

**2. `src/components/LogoFull.tsx`**
- Envolver com `React.forwardRef<HTMLImageElement, LogoFullProps>`
- Adicionar `displayName`

### Resultado
Elimina os warnings "Function components cannot be given refs" no console sem nenhuma mudança visual.

