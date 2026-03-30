

## Diagnóstico: Erro ao excluir corretor Fernando

### Problema identificado
Não foi possível recuperar logs da edge function `empresa-delete-corretor`, o que pode indicar que:
1. A função falhou antes de logar qualquer coisa (erro de runtime)
2. A resposta de erro não foi extraída corretamente no front-end

### Análise do banco de dados
Todas as FKs para `auth.users` são `ON DELETE CASCADE` ou `ON DELETE SET NULL`, exceto:
- `app_versions.published_by` — a função já limpa
- `convites.convidado_por` — a função já limpa

Não há bloqueio de FK que impediria a exclusão.

### Correções propostas

**1. Melhorar extração de erro no front-end (`ConstutoraCorretores.tsx`)**
O código atual tenta extrair o erro com `error.context.json()` que pode falhar silenciosamente. Melhorar para também ler o body quando a resposta HTTP não é 2xx mas `supabase.functions.invoke` retorna `data` com erro.

**2. Adicionar limpeza de `user_feature_flags` na edge function**
A função não limpa `user_feature_flags` antes de deletar. Embora não tenha FK, é boa prática.

**3. Adicionar logging mais detalhado na edge function**
Incluir try/catch mais granular no Step 12 (deleteUser) para logar o erro exato.

### Alterações

**`src/pages/construtora/ConstutoraCorretores.tsx`**: Melhorar tratamento de erro na função `handleRemoveCorretor` para extrair a mensagem real do response.

**`supabase/functions/empresa-delete-corretor/index.ts`**: 
- Adicionar limpeza de `user_feature_flags`
- Adicionar log do erro completo com `JSON.stringify(deleteError)` no Step 12

