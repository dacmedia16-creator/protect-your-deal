

## Trocar Logo do App para Nova Imagem

### Resumo
Substituir o logo atual (`vp-logo.png`) pela nova imagem enviada (`logo_vida_prova2.png`) em todo o app.

### Mudanças

| Acao | Detalhes |
|------|----------|
| Copiar arquivo | `user-uploads://logo_vida_prova2.png` → `public/vp-logo.png` (sobrescreve o atual) |

Como todos os componentes e o `index.html` já referenciam `/vp-logo.png`, a troca do arquivo é suficiente. Nenhum código precisa ser alterado.

