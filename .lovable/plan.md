

## Corrigir Foto do CEO que Não Carrega

### Problema
A imagem `src/assets/ceo-photo.png` está referenciada como URL direta (`/src/assets/ceo-photo.png`), mas arquivos em `src/assets/` precisam ser importados como módulo ES para o Vite processá-los corretamente.

### Correção

| Arquivo | O que fazer |
|---------|------------|
| `src/pages/SobreNos.tsx` | Adicionar `import ceoPhoto from "@/assets/ceo-photo.png"` no topo e trocar o `src` da tag `<img>` de string literal para a variável `ceoPhoto` |

Mudança de 2 linhas apenas.

