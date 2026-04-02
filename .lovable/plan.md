

## Plano: Mostrar valor mensal (12x) nos planos anuais

Nos 4 arquivos que exibem preço anual, adicionar uma linha mostrando o valor dividido em 12x abaixo do valor total anual.

### Alterações

Nos seguintes arquivos, onde aparece `R$ {plano.valor_anual.toFixed(2)}/ano`, adicionar logo abaixo uma linha com o parcelamento:

```
ou 12x de R$ {(plano.valor_anual / 12).toFixed(2).replace('.', ',')}/mês
```

**Arquivos:**

1. **`src/pages/Index.tsx`** (linha ~732) — Landing page pricing
2. **`src/pages/empresa/EmpresaAssinatura.tsx`** (linha ~340) — Assinatura imobiliária
3. **`src/pages/construtora/ConstutoraAssinatura.tsx`** (linha ~217) — Assinatura construtora
4. **`src/pages/admin/AdminPlanos.tsx`** (linha ~464) — Admin (informativo)

### Exemplo visual

```
R$ 1.188,00/ano
ou 12x de R$ 99,00/mês
Economia de 17%
```

A linha "12x de" terá estilo `text-sm text-muted-foreground` para não competir com o valor principal.

