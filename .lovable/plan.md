

# Corrigir erro CORS na edge function create-survey

## Problema

A edge function `create-survey` nao esta processando nenhuma requisicao. Os logs mostram que a funcao inicia (boot) mas nenhuma mensagem de log aparece (como "Criando survey para usuario:"), indicando que as requisicoes estao falhando no nivel do CORS antes de chegar ao codigo.

O header `Access-Control-Allow-Headers` esta incompleto:
```
authorization, x-client-info, apikey, content-type
```

Faltam os headers que o cliente Supabase envia automaticamente:
- `x-supabase-client-platform`
- `x-supabase-client-platform-version`
- `x-supabase-client-runtime`
- `x-supabase-client-runtime-version`

## Correcao

### Arquivo: `supabase/functions/create-survey/index.ts`

Atualizar os CORS headers (linhas 3-6) de:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

Para:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
```

## Impacto

Alteracao de 1 linha em 1 arquivo. A edge function sera redeployada automaticamente. Apos isso, o corretor conseguira criar pesquisas normalmente.
