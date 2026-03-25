

## Aumentar Tamanho do Logo

### Mudança

| Arquivo | O que fazer |
|---------|------------|
| `src/components/LogoIcon.tsx` | Aumentar o `size` padrão de `32` para `44` |

```tsx
// ANTES
export const LogoIcon = ({ className, size = 32 }: LogoIconProps) => {

// DEPOIS
export const LogoIcon = ({ className, size = 44 }: LogoIconProps) => {
```

Isso aumenta o logo em todos os locais que usam o tamanho padrão. Locais que passam `size` explicitamente não serão afetados.

