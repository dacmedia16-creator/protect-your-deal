

# Avaliação Estratégica Pós-Lote 4

## 1. Status da arquitetura de auth

Todas as funções administrativas de alto risco (CRUD de usuários, promoção de roles, reset de senha, exclusão) estão padronizadas via `_shared/auth.ts`; as 5 funções restantes com `createClient` local são operacionais ou de baixa superfície de ataque.

## 2. O que observar nas próximas 24–48h

- Erros 500 em `admin-create-user`, `admin-promote-corretor`, `admin-create-corretor`
- Erros 403 inesperados em criação de corretor por admin de construtora (novo caminho exercitado pelo helper)
- Operação normal de promoção/demoção de roles por admins organizacionais
- Nenhum relato de falha ao criar usuários via painel super admin

## 3. Critério de encerramento do Lote 4

O lote pode ser encerrado quando completar 24h com:
- Zero erros 500 nas 3 funções migradas
- Zero relatos de falha em criação, promoção ou vinculação de usuários
- Grep confirmado (já feito): zero `createClient` nas 3 funções

## 4. Necessidade real de novo lote de hardening

**Não há necessidade de um lote obrigatório.** As funções admin restantes com `createClient` local são:

| Função | Risco | Justificativa |
|--------|-------|---------------|
| `admin-update-user` | Baixo | Já restrita a super_admin, auth manual funcional |
| `admin-vincular-usuario` | Baixo | Já restrita a super_admin, operação rara |
| `admin-criar-acesso-afiliado` | Baixo | Já restrita a super_admin, operação rara |
| `admin-fix-inconsistencies` | Muito baixo | Manutenção interna, super_admin only |
| `empresa-delete-corretor` | Médio | Auth local funcional, mas função longa com cleanup |

Nenhuma dessas representa vetor de escalação de privilégio não coberto. A auth local nelas é funcional — apenas não padronizada.

## 5. Próximo lote: opcional

Um eventual **Lote 5** seria de **padronização cosmética**, não de hardening crítico. Recomendação:

- **Opcional e de baixa prioridade** — pode ser feito quando houver janela livre, sem urgência
- Foco: migrar `admin-update-user`, `admin-vincular-usuario` e `empresa-delete-corretor` para o helper
- `admin-criar-acesso-afiliado` e `admin-fix-inconsistencies` podem ficar como estão indefinidamente

## 6. O que é governança contínua (não refatoração)

Estes itens não justificam um lote de hardening — são práticas operacionais permanentes:

- Monitorar logs de Edge Functions para erros 403/500 anômalos
- Manter `docs/edge-functions-security.md` atualizado quando novas funções forem criadas
- Usar `_shared/auth.ts` como padrão para qualquer nova Edge Function
- Revisar RLS quando novas tabelas forem adicionadas
- Auditar `verify_jwt = false` sempre que uma nova função pública for criada

---

**Conclusão**: A fase crítica de hardening de auth pode ser considerada **concluída** após a janela de observação do Lote 4. Todas as funções de alto risco estão padronizadas. O que resta é padronização incremental e governança contínua.

