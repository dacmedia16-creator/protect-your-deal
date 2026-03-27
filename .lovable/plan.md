

## Plano: Adicionar header com botão "Voltar" na página Nossa História

### Problema
A página `/nossa-historia` não possui header com botão de voltar. Todas as outras páginas institucionais (Como Funciona, Termos de Uso, Política de Privacidade, Sobre Nós) têm um header sticky com logo e botão "Voltar".

### Solução
Adicionar um header sticky no topo da página `NossaHistoria.tsx`, seguindo o padrão de `ComoFunciona.tsx`:

```tsx
<header className="border-b border-border/40 bg-background/95 backdrop-blur sticky top-0 z-50">
  <div className="container mx-auto px-4 h-16 flex items-center justify-between">
    <Button variant="ghost" asChild>
      <Link to="/" className="flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>
    </Button>
    <div className="flex items-center gap-2">
      <LogoIcon size={24} />
      <span className="font-heading text-lg font-bold">VisitaProva</span>
    </div>
    <div className="w-20" />
  </div>
</header>
```

### Alteração
- **Arquivo:** `src/pages/NossaHistoria.tsx`
- Importar `ArrowLeft` (já tem outros ícones do lucide)
- Inserir o header logo após o `<WhatsAppFAB />`, antes da seção hero

