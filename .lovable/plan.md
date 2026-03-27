

## Plano: Adicionar link "Nossa História" na navegação da landing page

### Alteração em `src/pages/Index.tsx`

Adicionar um link para `/nossa-historia` na navegação da página principal, entre "Sobre Nós" e "Baixar App", em 3 locais:

**1. Menu desktop (linha ~234)** — Após "Sobre Nós", inserir:
```tsx
<Link to="/nossa-historia" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
  Nossa História
</Link>
```

**2. Menu mobile (linha ~310)** — Após "Sobre Nós", inserir:
```tsx
<Link to="/nossa-historia" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-foreground hover:text-primary transition-colors">
  Nossa História
</Link>
```

**3. Footer (~linha 979)** — Verificar e adicionar link no rodapé se não existir.

