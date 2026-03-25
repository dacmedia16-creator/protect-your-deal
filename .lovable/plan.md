

## Trocar Logo por Nova Versão com Fundo Transparente

### Resumo
Substituir o logo atual (`public/vp-logo.png`) pela nova imagem enviada (que já possui fundo escuro/transparente adequado), atualizando em todo o app.

### Mudanças

| Ação | Detalhes |
|------|----------|
| Copiar arquivo | `user-uploads://logo_vida_prova2_-_Editado.png` → `public/vp-logo.png` (sobrescreve o atual) |

Todos os componentes (`LogoIcon`, `index.html`, etc.) já referenciam `/vp-logo.png`, então a troca do arquivo atualiza tudo automaticamente.

