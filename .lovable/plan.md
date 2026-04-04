

# Sprint 5 — Plano Operacional de Execução

---

## SPRINT 5A — Prova e Autorização

### Ordem exata de execução

```text
5A.1  Corrigir RLS de audit_logs (VIEW log)
  │
  ├──► 5A.2  Verificar trigger trg_audit_fichas_visita
  │
  ├──► 5A.3  Adicionar trigger DELETE em fichas_visita
  │
  └──► 5A.4  Adicionar log de auditoria ao master-login
         │
         └──► 5A.5  Criar helper _shared/auth.ts
                │
                └──► 5A.6  Script de teste RLS multi-tenant
```

### Dependências

- **5A.2, 5A.3 e 5A.4** dependem de 5A.1 (a policy de INSERT precisa existir para que os triggers e o master-login possam inserir via service_role — e para validar que o INSERT do frontend funciona)
- **5A.5** depende de 5A.4 (master-login é o primeiro consumidor do helper)
- **5A.6** é independente tecnicamente, mas deve rodar por último para validar tudo junto

---

### 5A.1 — Corrigir RLS de `audit_logs` para VIEW log

**Problema**: `DetalhesFicha.tsx:199` insere via client SDK com role `authenticated`, mas a única policy INSERT é para `service_role`. O INSERT falha silenciosamente (o `console.warn` engole o erro). A trilha de visualização NÃO FUNCIONA.

**Solução**: Migration SQL — adicionar policy INSERT para `authenticated` restrita a:
- `action` = 'VIEW'
- `user_id` = `auth.uid()`
- `table_name` IN ('fichas_visita')

Isso impede que o frontend insira ações arbitrárias (UPDATE, DELETE, IMPERSONATE) — apenas VIEW.

**Risco de quebra**: Nenhum. Adiciona permissão que não existia. Não afeta policies existentes.

**Critério de pronto**: Logar como corretor → abrir uma ficha → query `SELECT * FROM audit_logs WHERE action = 'VIEW' ORDER BY created_at DESC LIMIT 1` retorna o registro.

**Validação manual**: Abrir ficha no preview, depois verificar no banco se o registro existe.

**Risco jurídico**: Sem essa correção, não há rastro de quem acessou dados sensíveis de clientes (CPF, telefone). Em disputas comerciais, impossível provar que um corretor acessou ou não determinada ficha.

---

### 5A.2 — Verificar trigger `trg_audit_fichas_visita`

**Problema**: A migration foi criada, mas `db-triggers` retorna vazio. Pode ser um problema de listagem da ferramenta ou o trigger pode não ter sido aplicado.

**Solução**: Executar query de verificação: `SELECT tgname FROM pg_trigger WHERE tgname = 'trg_audit_fichas_visita'`. Se não existir, recriar via migration.

**Risco de quebra**: Nenhum (leitura) ou baixo (recriação de trigger existente).

**Critério de pronto**: Query retorna exatamente 1 row com `trg_audit_fichas_visita`.

**Validação manual**: Atualizar um campo crítico de uma ficha (ex: `proprietario_nome`) e verificar que `audit_logs` contém o registro com old/new values.

---

### 5A.3 — Trigger DELETE em `fichas_visita`

**Problema**: Exclusões de fichas não são registradas. Um corretor pode deletar uma ficha pendente e a prova desaparece sem rastro.

**Solução**: Migration com trigger `AFTER DELETE` em `fichas_visita` que insere em `audit_logs`:
- action: 'DELETE'
- old_data: row completa (to_jsonb(OLD))
- user_id: auth.uid()
- imobiliaria_id: OLD.imobiliaria_id

Usar SECURITY DEFINER para bypassar RLS (o trigger precisa inserir em audit_logs).

**Risco de quebra**: Baixo. Se o trigger falhar, o DELETE também falha (dentro da mesma transação). Testar com ficha de status 'pendente' que o corretor pode deletar.

**Critério de pronto**: Deletar uma ficha pendente → registro em `audit_logs` com action='DELETE' e dados completos da ficha.

**Validação manual**: Criar ficha de teste, deletá-la, verificar audit_logs.

---

### 5A.4 — Log de auditoria no `master-login`

**Problema**: `master-login/index.ts` gera magic link sem registrar em `audit_logs`. Apenas `console.log` efêmero. Sem rastro persistente de quem acessou qual conta.

**Solução**: Após gerar o link com sucesso (linha 97), inserir em `audit_logs` via supabaseAdmin (service_role):
- action: 'IMPERSONATE'
- table_name: 'auth.users'
- record_id: targetUser.id
- new_data: { email, ip: clientIp, timestamp }
- user_id: null (não há sessão autenticada)

Também logar tentativas falhas (senha errada, usuário não encontrado) com action: 'IMPERSONATE_FAILED'.

**Risco de quebra**: Baixo. O INSERT em audit_logs é posterior ao fluxo principal. Se falhar, logar no console e continuar (não bloquear a impersonação).

**Critério de pronto**: Executar impersonação via painel admin → registro em `audit_logs` com action='IMPERSONATE' contendo IP e email alvo.

**Validação manual**: Usar a feature de impersonação no AdminImobiliarias, verificar audit_logs.

**Risco jurídico**: Sem log de impersonação, impossível auditar se um suporte acessou dados de cliente indevidamente. Em caso de incidente, não há prova de quem fez o quê.

---

### 5A.5 — Helper `_shared/auth.ts`

**Problema**: Cada Edge Function reimplementa validação de Bearer/role de formas ligeiramente diferentes. Sem padrão, risco de inconsistência ao criar novas funções.

**Solução**: Criar `supabase/functions/_shared/auth.ts` com:
- `requireAuth(req)` → retorna `{ user, supabaseAdmin }` ou Response 401
- `requireRole(req, role)` → retorna `{ user, supabaseAdmin }` ou Response 403
- `requireServiceRole(req)` → valida header de service_role

Adotar imediatamente em `master-login` (após 5A.4) como prova de conceito. Migração das demais funções é gradual e não bloqueante.

**Risco de quebra**: Médio. Ao refatorar `master-login` para usar o helper, qualquer erro de import ou path quebra a função. Testar no preview antes de considerar pronto.

**Critério de pronto**: `master-login` usa `requireAuth` ou helpers do `_shared/auth.ts`. Impersonação continua funcionando.

**Validação manual**: Testar impersonação após refatoração.

---

### 5A.6 — Script de teste RLS multi-tenant

**Problema**: Isolamento multi-tenant existe via RLS, mas nunca foi validado formalmente. Confia-se que as policies estão corretas sem verificação cruzada.

**Solução**: Script SQL que:
1. Simula `SET LOCAL ROLE authenticated` com `request.jwt.claims` de diferentes usuários
2. Verifica que SELECT em `fichas_visita`, `clientes`, `imoveis` retorna APENAS dados do tenant correto
3. Verifica que INSERT em `audit_logs` com action='VIEW' funciona (confirma 5A.1)
4. Reporta pass/fail

**Risco de quebra**: Nenhum (read-only + teste em transação com rollback).

**Critério de pronto**: Script executa sem erros e reporta isolamento correto entre tenants.

---

## SPRINT 5B — Endurecimento Operacional

### Ordem exata de execução

```text
5B.1  .env no .gitignore
  │
  ├──► 5B.2  Fix runtime error ChatAssistente.tsx
  │
  ├──► 5B.3  CORS restritivo em funções autenticadas
  │
  └──► 5B.4  Remover server.url do Capacitor
```

Todos são independentes entre si. Podem ser executados em qualquer ordem ou em paralelo.

---

### 5B.1 — `.env` no `.gitignore`

**Problema**: `.gitignore` não contém `.env` (verificado: 24 linhas, nenhuma menção). Qualquer secret futuro adicionado ao `.env` será versionado.

**Solução**: Adicionar `.env`, `.env.*`, `.env.local` ao `.gitignore`.

**Risco de quebra**: Nenhum.

**Critério de pronto**: `grep -c '.env' .gitignore` retorna resultado > 0.

---

### 5B.2 — Fix runtime error `ChatAssistente.tsx`

**Problema**: Runtime error ativo no componente. Impacta UX mas não segurança.

**Solução**: Verificar console logs, identificar o erro específico (provavelmente import dinâmico ou referência undefined), corrigir.

**Risco de quebra**: Baixo (componente isolado).

**Critério de pronto**: Console sem erro originado de ChatAssistente.

---

### 5B.3 — CORS restritivo

**Problema**: Todas Edge Functions usam `Access-Control-Allow-Origin: '*'`.

**Solução**: Nas funções com `verify_jwt = true`, restringir origin para domínios conhecidos. Funções públicas mantêm `*`.

**Risco de quebra**: Alto se domínio incorreto. Testar com o domínio publicado (`protect-your-deal.lovable.app`) e domínio de produção (`visitaprova.com.br`).

**Critério de pronto**: Funções admin rejeitam requests de origens desconhecidas. Funções públicas continuam acessíveis.

---

### 5B.4 — Remover `server.url` do Capacitor

**Problema**: `capacitor.config.ts:8` aponta para URL remota do Lovable. App nativo é wrapper de WebView sem autonomia.

**Solução**: Remover bloco `server` inteiro. O `webDir: 'dist'` já está configurado.

**Risco de quebra**: Alto para builds nativos. O app passará a exigir build local (`npm run build` + `npx cap sync`). Sem pipeline de CI/CD, builds manuais.

**Critério de pronto**: `capacitor.config.ts` sem campo `server.url`. Build web continua funcionando normalmente.

---

## Visão final — Pronto para release

### Bloqueantes (devem estar resolvidos)

| Item | Risco se não resolver |
|---|---|
| 5A.1 — audit_logs VIEW funcionando | Sem trilha de acesso a dados sensíveis |
| 5A.4 — master-login com log | Sem trilha de impersonação — risco jurídico |
| 5B.1 — .env no .gitignore | Exposição de secrets em repo público |

### Riscos aceitos temporariamente

| Item | Justificativa |
|---|---|
| 5A.5 — Helper _shared/auth.ts | Padronização gradual; funções existentes já têm auth individual |
| 5A.6 — Teste RLS automatizado | RLS já funciona; teste formaliza mas não corrige |
| 5B.3 — CORS restritivo | Defesa em profundidade; auth é a barreira real |
| 5B.4 — Capacitor sem URL remota | Requer pipeline de CI/CD; app web não é afetado |

### Próximos passos pós-release

1. Migrar Edge Functions existentes para `_shared/auth.ts` (gradual, por função)
2. Implementar pipeline de build nativo para Capacitor
3. Adicionar monitoramento de falhas em webhooks e OTPs não confirmados
4. Testes E2E para fluxo crítico: registro → ficha → OTP → PDF → verificação

