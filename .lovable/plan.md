

## Atualizar Favicon para o Novo Logo

### Resumo
Trocar o favicon do browser tab para usar a nova logo `vp-logo.png`.

### Mudanças

| Arquivo | O que fazer |
|---------|------------|
| `index.html` | Trocar `<link rel="icon">` de `/favicon.svg` para `/vp-logo.png` (tipo `image/png`). Atualizar também `apple-touch-icon` e `mask-icon` para o novo logo |

### Detalhes
- Linha 60: `href="/favicon.svg"` → `href="/vp-logo.png"`, type `image/png`
- Linha 61: manter fallback `.ico` ou remover
- Linha 62: `href="/apple-touch-icon.png"` → `href="/vp-logo.png"`
- Linha 63: `href="/favicon.svg"` → `href="/vp-logo.png"`

