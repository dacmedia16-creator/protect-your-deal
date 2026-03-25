

## Aumentar Tamanho Padrão do Logo

### Mudança

| Arquivo | O que fazer |
|---------|------------|
| `src/components/LogoIcon.tsx` (linha 6) | Aumentar o `size` padrão de `44` para `56` |

```tsx
// ANTES
export const LogoIcon = ({ className, size = 44 }: LogoIconProps) => {

// DEPOIS
export const LogoIcon = ({ className, size = 56 }: LogoIconProps) => {
```

