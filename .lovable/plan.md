

## Atualizar dependências Capacitor para corrigir vulnerabilidades

### Análise
O `package.json` já declara `@capacitor/cli: ^8.0.2`, mas o lock file pode estar fixando uma versão anterior que ainda puxa o `node-tar` vulnerável. A correção é forçar a atualização do lock file para resolver as versões mais recentes.

### Correção
1. No `package.json`, bumpar as 4 dependências Capacitor de `^8.0.2` para `^8.0.3` (ou latest patch) para forçar regeneração do lock file com versões corrigidas do `node-tar` transitivo.

**Arquivo:** `package.json` — alterar versões de:
- `@capacitor/android`: `^8.0.2` → `^8.0.3`
- `@capacitor/cli`: `^8.0.2` → `^8.0.3`
- `@capacitor/core`: `^8.0.2` → `^8.0.3`
- `@capacitor/ios`: `^8.0.2` → `^8.0.3`

### Escopo
- 1 arquivo editado (`package.json`)
- Nenhuma mudança funcional

