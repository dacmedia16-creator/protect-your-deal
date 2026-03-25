

## Remover Arredondamento do Logo

### Causa
O componente `LogoIcon.tsx` aplica a classe `rounded-lg` na tag `<img>`, o que arredonda os cantos do logo.

### Mudança

| Arquivo | O que fazer |
|---------|------------|
| `src/components/LogoIcon.tsx` (linha 13) | Remover `rounded-lg` da className |

```tsx
// ANTES
className={`rounded-lg object-contain ${className || ''}`}

// DEPOIS
className={`object-contain ${className || ''}`}
```

