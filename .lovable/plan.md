

# Otimização do Sistema de Atualização

## Problema identificado

O Service Worker está **cacheando as respostas da edge function `app-version`** por até 5 minutos (estratégia `NetworkFirst` com `maxAgeSeconds: 300`). Mesmo que a edge function retorne `Cache-Control: no-cache`, o SW intercepta e serve do cache local. Isso significa que após um deploy, o usuário pode demorar até **5 minutos** para detectar a nova versão.

## Solução

### 1. Excluir `app-version` do cache do SW (`vite.config.ts`)
Adicionar uma regra `NetworkOnly` específica para a rota `app-version` **antes** da regra genérica de edge functions. Isso garante que a verificação de versão sempre vai direto ao servidor.

```text
runtimeCaching order:
  1. chat endpoints → NetworkOnly  (já existe)
  2. app-version   → NetworkOnly  (NOVO)
  3. edge functions → NetworkFirst (já existe)
  4. supabase API  → NetworkFirst (já existe)
```

### 2. Reduzir intervalo de checagem (`VersionCheckWithOverlay.tsx`)
- `CHECK_INTERVAL_MS`: 2 min → **1 min**
- Sem impacto perceptível em performance (1 request leve por minuto)

### 3. Reduzir delay inicial
- `initialTimeout`: 3s → **1.5s** para detectar atualizações mais rápido ao abrir o app

## Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `vite.config.ts` | Adicionar regra `NetworkOnly` para `app-version` antes das outras regras |
| `src/components/VersionCheckWithOverlay.tsx` | Reduzir `CHECK_INTERVAL_MS` para 1 min e delay inicial para 1.5s |

## Impacto
- Detecção de versão cai de **até 5 min** para **até 1 min**
- Zero risco de cache stale na verificação de versão

