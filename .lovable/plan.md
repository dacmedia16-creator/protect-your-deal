

## Análise da Vulnerabilidade

O `package.json` já especifica `@capacitor/cli: "^8.0.3"`, que é a versão corrigida. O alerta de segurança está referenciando a versão `^8.0.1` do lockfile, que pode estar desatualizado.

## Plano

1. **Atualizar o lockfile** — Reinstalar as dependências para que o `package-lock.json` / `bun.lock` resolva para a versão mais recente (≥8.0.3), eliminando o alerta.

Isso é uma única operação: forçar a reinstalação dos pacotes Capacitor para atualizar o lockfile.

