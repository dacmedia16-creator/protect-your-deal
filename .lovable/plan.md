
## Plano: Corrigir bug no envio de WhatsApp de boas-vindas (corretor autônomo)

### Problema
Os logs mostram o erro: `ReferenceError: supabaseUrl is not defined` na edge function `registro-corretor-autonomo`. A variável `supabaseUrl` é usada na linha 394 mas nunca foi declarada nessa function (diferente da `registro-imobiliaria` que declara corretamente).

### Correção
**`supabase/functions/registro-corretor-autonomo/index.ts`** (linha ~390):
Adicionar `const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";` dentro do bloco `if (corretor.telefone)`, antes do fetch, igual ao padrão usado em `registro-imobiliaria`.
