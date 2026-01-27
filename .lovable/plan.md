
# Correção: Busca de Imobiliária e Redirecionamento para Equipe no Auth.tsx

## Problemas Identificados

### Problema 1: Busca da Imobiliária (RLS bloqueando)
Na página `/auth`, o código está usando uma query direta para a view `imobiliarias_publicas` que herda RLS da tabela base, bloqueando acesso para usuários não autenticados.

**Localização:** `src/pages/Auth.tsx`, linhas 155-159

```typescript
// Código atual (PROBLEMÁTICO)
const { data, error } = await supabase
  .from('imobiliarias_publicas')
  .select('id, nome')
  .eq('codigo', codigo)
  .maybeSingle();
```

### Problema 2: Sem Redirecionamento para Seleção de Equipe
Após cadastro vinculado bem-sucedido, o código não redireciona para a página de seleção de equipe como deveria. Apenas mostra um toast e limpa o formulário.

**Localização:** `src/pages/Auth.tsx`, linhas 371-380

### Problema 3: Edge Function não retorna `imobiliaria_id`
A edge function `registro-corretor-autonomo` não retorna o `imobiliaria_id` na resposta, necessário para o redirecionamento.

**Localização:** `supabase/functions/registro-corretor-autonomo/index.ts`, linhas 386-396

---

## Solução

### Mudança 1: Usar RPC ao invés de query direta (Auth.tsx)

Alterar o useEffect de validação do código (linhas 134-181) para usar `supabase.rpc('get_imobiliarias_publicas')` que é `SECURITY DEFINER` e bypassa RLS.

**De:**
```typescript
const { data, error } = await supabase
  .from('imobiliarias_publicas')
  .select('id, nome')
  .eq('codigo', codigo)
  .maybeSingle();
```

**Para:**
```typescript
const { data: imobiliarias, error } = await supabase.rpc('get_imobiliarias_publicas');

if (error) throw error;

const imobiliaria = imobiliarias?.find((i: { codigo: number }) => i.codigo === codigo);
```

### Mudança 2: Adicionar redirecionamento para seleção de equipe (Auth.tsx)

Após cadastro vinculado bem-sucedido, redirecionar para a página de seleção de equipe passando os parâmetros necessários.

**Adicionar após o toast de sucesso (linha 374):**
```typescript
// Redirecionar para seleção de equipe
const userId = data?.user_id;
const imobiliariaId = data?.imobiliaria_id;
if (userId && imobiliariaId) {
  navigate(`/selecionar-equipe?vinculado=true&user_id=${userId}&imobiliaria_id=${imobiliariaId}&imobiliaria=${encodeURIComponent(imobiliariaEncontrada.nome)}`);
} else {
  navigate(`/cadastro-concluido?vinculado=true&imobiliaria=${encodeURIComponent(imobiliariaEncontrada.nome)}`);
}
```

### Mudança 3: Retornar `imobiliaria_id` na edge function

Adicionar `imobiliaria_id` à resposta de sucesso da edge function.

**De:**
```typescript
return new Response(
  JSON.stringify({ 
    success: true,
    message: ...,
    user_id: userId,
    linked_to_imobiliaria: !!imobiliariaId,
    requires_activation: !!imobiliariaId,
  }),
```

**Para:**
```typescript
return new Response(
  JSON.stringify({ 
    success: true,
    message: ...,
    user_id: userId,
    imobiliaria_id: imobiliariaId, // ADICIONADO
    linked_to_imobiliaria: !!imobiliariaId,
    requires_activation: !!imobiliariaId,
  }),
```

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Auth.tsx` | Usar RPC para buscar imobiliária + adicionar redirecionamento para equipe |
| `supabase/functions/registro-corretor-autonomo/index.ts` | Retornar `imobiliaria_id` na resposta |

---

## Por que essa solução funciona

| Método | RLS | Usuário Anônimo |
|--------|-----|-----------------|
| View direta `imobiliarias_publicas` | Herda da tabela | Bloqueado |
| Função RPC `get_imobiliarias_publicas()` | SECURITY DEFINER | Funciona |

O fluxo completo ficará:
1. Usuário digita código da imobiliária → RPC busca e valida
2. Usuário preenche formulário e clica "Criar conta"
3. Edge function cria usuário e retorna `user_id` + `imobiliaria_id`
4. Frontend redireciona para `/selecionar-equipe` com os parâmetros
5. Página de seleção de equipe exibe equipes disponíveis (usando outra RPC `SECURITY DEFINER`)

---

## Impacto

- Corrige a busca de imobiliárias na página de login/cadastro
- Habilita a seleção de equipe após cadastro vinculado
- Mantém consistência com o fluxo do `RegistroVinculado.tsx`
- Não afeta outras funcionalidades
