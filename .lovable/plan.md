Diagnóstico rápido (com base nos logs atuais):
- O erro principal de exclusão **não é mais 403**; agora é **500** na função de backend `empresa-delete-corretor`.
- Causa exata já confirmada nos logs: `ReferenceError: targetProfile is not defined` em `supabase/functions/empresa-delete-corretor/index.ts` (linha do log ~164).
- No código, `targetProfile` só existe no branch de `imobiliaria_admin`, mas está sendo usado depois do `if/else` também para `construtora_admin`.
- Em paralelo, continuam warnings de `forwardRef` ligados ao `AlertDialog` na tela de corretores.

Plano de correção (implementação):
1) Corrigir crash da função `empresa-delete-corretor` (prioridade máxima)
- Ajustar escopo das variáveis no backend:
  - criar variável comum (ex.: `targetNome`) antes do `if/else`;
  - preencher no branch de imobiliária com `targetProfile?.nome`;
  - no branch de construtora, buscar nome do perfil (ou usar fallback com `targetUserId`);
- Trocar o log que hoje usa `targetProfile.nome` por versão segura (`targetNome ?? targetUserId`);
- Garantir que nenhum acesso a variável de branch ocorra fora do escopo.

2) Blindar fluxo de autorização/pertencimento para construtora (sem alterar regra de negócio)
- Manter verificação de mesma `construtora_id`;
- Manter bloqueio para excluir outro `construtora_admin`;
- Adicionar guard clauses explícitas para IDs nulos/inválidos antes da deleção (evita novos 500 silenciosos).

3) Melhorar feedback de erro no front (`ConstutoraCorretores.tsx`)
- No `handleRemoveCorretor`, extrair mensagem real da resposta da função (via `error.context` quando disponível), em vez de exibir só “Edge Function returned non-2xx”;
- Mostrar toast com erro amigável retornado pelo backend, para facilitar diagnóstico futuro.

4) Corrigir warnings de `forwardRef` no `AlertDialog` (mesma rodada)
- Ajustar wrapper de `src/components/ui/alert-dialog.tsx` para evitar passagem de `ref` em componentes que não aceitam;
- Validar especificamente a renderização de `ConstutoraCorretores` com o modal de desativação aberto/fechado.

Validação após correção:
- Teste E2E em `/construtora/corretores`:
  1. excluir corretor comum da mesma construtora => sucesso (200);
  2. tentar excluir admin da mesma construtora => bloqueio (403 com mensagem correta);
  3. confirmar que não há `ReferenceError` nos logs da função;
  4. confirmar ausência dos warnings de `forwardRef` no console dessa tela.
- Nenhuma migração de banco é necessária para este ajuste.