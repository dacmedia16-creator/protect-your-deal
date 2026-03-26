

## Plano: Exibir logo da construtora na tela de login

### Problema
A edge function `get-imobiliaria-by-email` só verifica `imobiliaria_id` no perfil do usuário. Quando o email pertence a um usuário de construtora (que tem `construtora_id` no profile, não `imobiliaria_id`), a função retorna `null` e o logo não aparece.

### Correção

**1. Atualizar `supabase/functions/get-imobiliaria-by-email/index.ts`**

Após verificar que `profile.imobiliaria_id` é null, verificar se o profile tem `construtora_id`. Se sim, buscar `nome` e `logo_url` na tabela `construtoras` e retornar no mesmo formato.

Alterações:
- No select do profile, adicionar `construtora_id` junto com `imobiliaria_id`
- Se `imobiliaria_id` é null mas `construtora_id` existe, buscar em `construtoras` em vez de `imobiliarias`
- Retornar `{ imobiliaria: { nome, logo_url } }` no mesmo formato (o frontend já consome esse shape)

Nenhuma alteração no frontend necessária — o Auth.tsx já renderiza o logo baseado no campo `logo_url` do objeto retornado.

