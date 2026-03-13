

## Atualizar @capacitor/cli para corrigir vulnerabilidades

### Problema
O pacote `@capacitor/cli` (^8.0.1) depende de `node-tar` com vulnerabilidades de alta severidade (sobrescrita arbitrária de arquivos e race condition em macOS APFS).

### Correção
Atualizar `@capacitor/cli` para a versão mais recente (^8.0.2+) no `package.json`, que inclui a correção transitiva do `node-tar`.

**Arquivo:** `package.json`
- Atualizar `@capacitor/cli` de `^8.0.1` para `^8.0.2`
- Atualizar também `@capacitor/core`, `@capacitor/android`, `@capacitor/ios` para manter consistência

### Escopo
- 1 arquivo editado (`package.json`)
- Nenhuma mudança funcional

