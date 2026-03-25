

## Atualizar Logo nos Arquivos PWA e OG Image

### Problema
O logo foi trocado apenas no `vp-logo.png`, mas os arquivos usados para preview de link (Open Graph) e PWA continuam com o logo antigo:
- `public/pwa-512x512.png` — usado no `og:image`, `twitter:image` e no manifest PWA
- `public/pwa-192x192.svg` — ícone PWA menor

### Mudanças

| Ação | Detalhes |
|------|----------|
| Copiar `public/vp-logo.png` → `public/pwa-512x512.png` | Atualiza o preview de links (WhatsApp, redes sociais) e ícone PWA 512px |
| Copiar `public/vp-logo.png` → `public/pwa-192x192.png` | Atualiza ícone PWA 192px |

**Nota:** O preview no WhatsApp pode demorar para atualizar por causa do cache. Mas após o deploy, links novos já mostrarão o logo correto.

