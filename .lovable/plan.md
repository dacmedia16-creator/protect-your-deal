
# Corrigir erro na criacao de pesquisa (create-survey)

## Problema

A edge function `create-survey` usa o metodo `auth.getClaims(token)` que nao existe no SDK do Supabase JS v2. Isso causa um erro na autenticacao do usuario, impedindo a criacao da pesquisa. Todas as outras 24+ edge functions do projeto usam `auth.getUser()` corretamente.

## Correcao

### Arquivo: `supabase/functions/create-survey/index.ts`

Substituir o bloco de autenticacao (linhas 31-42) de:

```typescript
const token = authHeader.replace('Bearer ', '');
const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);

if (claimsError || !claimsData?.claims) {
  return new Response(
    JSON.stringify({ error: 'Token invalido' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

const userId = claimsData.claims.sub;
```

Para (seguindo o padrao das outras functions):

```typescript
const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

if (authError || !user) {
  return new Response(
    JSON.stringify({ error: 'Token invalido' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

const userId = user.id;
```

## Impacto

Alteracao em 1 arquivo, apenas no bloco de autenticacao. Nenhuma mudanca de logica de negocio. A edge function sera redeployada automaticamente.
