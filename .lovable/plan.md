
# Adicionar botao de verificar atualizacao e dados dinamicos no card "Informacoes do Sistema"

## Objetivo

Substituir os valores estaticos (versao "1.0.0", data "26/12/2024") por dados reais do sistema e adicionar um botao para buscar a versao mais recente do servidor.

## Alteracoes em `src/pages/admin/AdminConfiguracoes.tsx`

### 1. Importar dependencias
- Importar `Button` de `@/components/ui/button`
- Importar `RefreshCw` de `lucide-react`
- Importar `useState` (ja importado)

### 2. Adicionar estado e funcao de verificacao
- Criar estado `serverVersion` e `lastPublished` para armazenar a versao do servidor
- Criar estado `isCheckingVersion` para loading do botao
- Criar funcao `checkLatestVersion` que chama `supabase.functions.invoke('app-version')` e atualiza os estados com `version` e `published_at`

### 3. Atualizar o card "Informacoes do Sistema"
- **Versao**: mostrar `VITE_BUILD_ID` (versao local do build) em vez de "1.0.0"
- **Ambiente**: manter "Producao"
- **Ultima Atualizacao**: mostrar `published_at` retornado pelo servidor (formatado) ou a data atual do build
- Adicionar uma linha abaixo com:
  - **Versao no Servidor**: mostra a versao disponivel no servidor (apos consulta)
  - **Botao "Verificar Atualizacao"** com icone RefreshCw que chama `checkLatestVersion`
  - Se a versao do servidor for diferente da local, exibir um Badge "Nova versao disponivel" e um botao "Atualizar Agora" que chama `forceAppRefresh()`

### 4. Importar utilitario existente
- Importar `forceAppRefresh` de `@/lib/forceAppRefresh` para o botao de atualizar
- Importar `format` de `date-fns` para formatar a data

## Resumo visual

O card ficara assim:

```text
Informacoes do Sistema
-----------------------------------------
Versao Local    | Ambiente   | Ultima Atualizacao
2026-02-15 ...  | Producao   | 15/02/2026

Versao no Servidor: 2026-02-15 ...  [Verificar Atualizacao]
                                    [Atualizar Agora] (se diferente)
```

## Arquivos modificados

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/admin/AdminConfiguracoes.tsx` | Dados dinamicos no card + botao verificar/atualizar |
