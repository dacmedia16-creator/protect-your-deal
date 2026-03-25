

## Trocar o Logo do Header por Imagem PNG

### Resumo
Substituir o ícone SVG atual (`LogoIcon`) no header da landing page pela nova logo PNG enviada pelo usuário (vp-logo.png).

### Mudanças

| Arquivo | O que fazer |
|---------|------------|
| `public/vp-logo.png` | Copiar a imagem enviada para o diretório público |
| `src/components/LogoIcon.tsx` | Alterar de SVG (`/logo-icon.svg`) para a nova imagem PNG (`/vp-logo.png`), mantendo a mesma API (`size`, `className`) |

### Detalhes
- Copiar `user-uploads://vp-logo.png` → `public/vp-logo.png`
- Em `LogoIcon.tsx`, trocar o `src` de `/logo-icon.svg` para `/vp-logo.png`
- Como `LogoIcon` é usado em vários lugares (header da landing, outras páginas institucionais, layouts), a troca centralizada atualiza tudo de uma vez
- Adicionar `rounded-lg` ao componente para manter o arredondamento da logo original

