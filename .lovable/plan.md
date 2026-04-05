
# Plano revisado — erro persiste após o ajuste da policy

## Situação já confirmada no banco
- A policy `Corretor parceiro pode atualizar fichas` já está ativa com `WITH CHECK` explícito permitindo `corretor_parceiro_id = null`.
- O descarte no app faz apenas este `UPDATE`:
  - `corretor_parceiro_id = null`
  - `parte_preenchida_parceiro = null`
- Não há trigger em `fichas_visita` regravando esses dois campos.
- Os registros atuais com parceiro apontam para perfis ativos.

## Diagnóstico atualizado
A causa já não parece ser “faltou aplicar a migration”. O erro persistente indica uma destas hipóteses, em ordem de prioridade:

1. O request que falha não está satisfazendo a policy do parceiro em runtime  
   (`auth.uid()` no momento do update não bate com o `corretor_parceiro_id` atual da linha)

2. Ainda existe ambiguidade nas policies de `UPDATE` de `fichas_visita`  
   porque só a policy do parceiro tem `WITH CHECK` explícito; as demais ainda dependem de comportamento implícito

3. O novo estado da linha perde visibilidade logo após o descarte  
   porque ao zerar `corretor_parceiro_id`, a linha deixa de atender a policy `Corretor parceiro pode ver fichas`

## Policies que precisam ser inspecionadas primeiro
1. `Corretor parceiro pode atualizar fichas`
2. `Corretor pode atualizar suas fichas`
3. `Líder pode atualizar fichas da equipe`
4. `Super admin pode atualizar fichas`
5. `Corretor parceiro pode ver fichas`

## Plano de correção com menor risco

### Etapa 1 — validar uma ficha real que falha
Para a ficha que reproduz o erro, conferir no banco:
- `id`
- `user_id`
- `corretor_parceiro_id`
- `parte_preenchida_parceiro`
- `status`
- parceiro ativo em `profiles`
- se o usuário autenticado no momento do clique é exatamente o UUID de `corretor_parceiro_id`

Sem isso, qualquer nova mudança de policy vira tentativa cega.

### Etapa 2 — eliminar ambiguidades de pós-update
Padronizar **todas** as policies de `UPDATE` de `fichas_visita` com `WITH CHECK` explícito, sem ampliar escopo:
- corretor próprio
- parceiro
- líder
- super admin

Objetivo: garantir que nenhum caminho de update dependa de `USING` implícito para validar o novo estado.

### Etapa 3 — revisar visibilidade do novo estado
No descarte, a linha deixa de ser “do parceiro”. Então a revisão deve confirmar se o fluxo do update exige ou não leitura da linha já atualizada. Se exigir, a visibilidade pós-update também precisa ser tratada na modelagem de RLS.

## Critério para confirmar que a causa é policy
O problema é realmente de policy se, na ficha que falha:
- `corretor_parceiro_id` antes do update = usuário logado
- usuário está ativo
- update continua falhando com erro de RLS

Se isso não fechar, a falha passa a ser mismatch entre ator e linha, não ausência do `WITH CHECK` já aplicado.

## Resultado esperado após a correção final
- parceiro consegue descartar a própria parceria
- parceiro não consegue atribuir outro UUID como parceiro
- corretor proprietário não é afetado
- líder e super admin continuam com o comportamento atual
- `fichas_visita` fica sem policies de `UPDATE` com regra implícita

## Diretriz final
Não vale ampliar mais a policy do parceiro no escuro. O próximo passo certo é validar uma ficha real que falha e, em seguida, fechar explicitamente o `WITH CHECK` de todas as policies de `UPDATE` de `fichas_visita`.
