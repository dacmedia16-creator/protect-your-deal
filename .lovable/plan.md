

# Plano de Validação Pós-Hardening — VisitaProva

---

## Estado confirmado no código e banco

| Item | Status |
|---|---|
| `trg_audit_fichas_visita` (UPDATE) | Ativo no banco |
| `trg_audit_fichas_visita_delete` (DELETE) | Ativo no banco |
| RLS policy "Authenticated users can log VIEW actions" | Ativa em `audit_logs` |
| `master-login` com `logAudit` (IMPERSONATE/IMPERSONATE_FAILED) | Implementado |
| `_shared/auth.ts` com `requireAuth`, `requireRole`, `requireServiceRole` | Criado |
| Capacitor sem `server.url` | Confirmado — apenas `webDir: 'dist'` |
| SW com guard de iframe/preview | Confirmado em `main.tsx` |
| `.env` no `.gitignore` | **AINDA FALTANDO** — bloqueante |

---

## 1. Checklist de validação manual — Fluxos críticos

- [ ] **Criar ficha**: Logado como corretor → criar ficha → verificar que `ficha_usage_log` registra a criação
- [ ] **Visualizar ficha**: Abrir `DetalhesFicha` → verificar que `audit_logs` contém registro com `action='VIEW'` (confirma que a policy RLS funciona)
- [ ] **Editar campo crítico**: Alterar `proprietario_nome` ou `imovel_endereco` → verificar `audit_logs` com `action='UPDATE'` e old/new values
- [ ] **Deletar ficha pendente**: Excluir ficha com status `pendente` → verificar `audit_logs` com `action='DELETE'` e dados completos em `old_data`
- [ ] **Enviar OTP**: Disparar OTP → verificar que o fluxo completo funciona (send → verify → status update)
- [ ] **Impersonação**: Usar master-login via admin → verificar `audit_logs` com `action='IMPERSONATE'`, IP e email alvo
- [ ] **Impersonação falha**: Tentar master-login com senha errada → verificar `audit_logs` com `action='IMPERSONATE_FAILED'`
- [ ] **Login normal**: Login/logout padrão continua funcionando sem regressão

---

## 2. Checklist de validação técnica — Banco, RLS, triggers, Edge Functions

### Banco e triggers
- [ ] Query `SELECT tgname FROM pg_trigger WHERE tgrelid = 'fichas_visita'::regclass` retorna `trg_audit_fichas_visita` e `trg_audit_fichas_visita_delete`
- [ ] Ambos triggers usam `SECURITY DEFINER` (bypassam RLS para inserir em `audit_logs`)
- [ ] `audit_logs` não tem policies de UPDATE ou DELETE (imutabilidade confirmada)

### RLS
- [ ] Policy de INSERT em `audit_logs` restringe `action='VIEW'` + `user_id=auth.uid()` + `table_name='fichas_visita'` — nenhuma outra action pode ser inserida pelo frontend
- [ ] Corretor só vê suas fichas (SELECT em `fichas_visita` filtrado por `user_id`)
- [ ] Admin imobiliária vê fichas da sua imobiliária apenas
- [ ] Super admin vê tudo

### Edge Functions
- [ ] `master-login` responde 429 após 5 requests rápidos do mesmo IP
- [ ] `master-login` retorna 401 com senha incorreta e registra `IMPERSONATE_FAILED`
- [ ] `chat-assistente` respeita rate limit de 5 req/min para anônimos
- [ ] `_shared/auth.ts` não é chamado por nenhuma função existente ainda (não há regressão por refatoração)

---

## 3. Regressões possíveis introduzidas

| Mudança | Risco de regressão | O que testar |
|---|---|---|
| Policy INSERT em `audit_logs` para VIEW | Baixo — adição, não modificação | Confirmar que triggers (UPDATE/DELETE) ainda funcionam via `SECURITY DEFINER` |
| Trigger DELETE em `fichas_visita` | Médio — se trigger falhar, DELETE da ficha também falha | Testar exclusão de ficha pendente por corretor |
| `master-login` com logAudit | Baixo — log é posterior ao fluxo | Testar que impersonação completa funciona e retorna magic link |
| Remoção de `server.url` do Capacitor | **Alto para builds nativos** — app mobile deixa de carregar se não houver build local | Testar build web (não afetado); builds nativos exigem `npm run build && npx cap sync` |
| SW guard de iframe | Baixo | Testar que PWA continua instalável fora de iframe |

---

## 4. O que testar no app web

- [ ] Login/logout funciona normalmente
- [ ] Navegação entre todas as áreas (corretor, empresa, admin, construtora, afiliado)
- [ ] Criação de ficha → OTP → confirmação → PDF
- [ ] Abrir ficha existente (confirma VIEW log)
- [ ] Deletar ficha pendente (confirma DELETE log)
- [ ] Chat Sofia responde corretamente para usuários logados
- [ ] PWA install banner aparece fora de iframe
- [ ] ConfiguracoesEmail renderiza preview de template sem XSS (DOMPurify ativo)

---

## 5. O que testar no app mobile/Capacitor

- [ ] **Build nativo exige processo manual agora**: `npm run build` → `npx cap sync` → build Android/iOS
- [ ] Sem `server.url`, o app carrega do `dist` local — verificar se assets e rotas funcionam
- [ ] `allowMixedContent` e `cleartext` removidos — confirmar que o app só aceita HTTPS
- [ ] Se não houver pipeline de CI/CD, documentar processo de build manual para a equipe

---

## 6. Pré-requisitos para considerar release seguro

| Item | Status | Bloqueante? |
|---|---|---|
| `.env` adicionado ao `.gitignore` | **PENDENTE** | **Sim** |
| VIEW log funcional (RLS corrigida) | Implementado | Verificar manualmente |
| Trigger UPDATE em fichas_visita | Ativo | Verificar manualmente |
| Trigger DELETE em fichas_visita | Ativo | Verificar manualmente |
| master-login com audit trail | Implementado | Verificar manualmente |
| Build web sem erros TypeScript | Verificar | Sim |
| Nenhum secret hardcoded | OK | — |

---

## 7. Riscos médios/futuros que permanecem

| Risco | Severidade | Justificativa para aceitar temporariamente |
|---|---|---|
| CORS `*` em todas Edge Functions | Médio | Auth é a barreira real; CORS é defesa em profundidade |
| `_shared/auth.ts` não adotado em funções existentes | Médio | Cada função já tem auth individual; padronização é gradual |
| Sem teste automatizado de RLS multi-tenant | Médio | RLS funciona via policies; teste formaliza mas não corrige |
| Ofuscação de `master:` é trivial | Baixo | O risco real (impersonação) está protegido por secret server-side + audit log |
| Capacitor sem pipeline de CI/CD | Médio | App web não é afetado; builds nativos são manuais |
| `chat-assistente` rate limit por IP é contornável via proxy | Baixo | Token budget por hora limita custo real |
| WhatsApp sends sem log persistente | Médio | Logs existem apenas em console efêmero das Edge Functions |
| Sem monitoramento de falhas em webhooks/OTPs | Médio | `webhook_logs` e `confirmacoes_otp` registram dados, mas sem alertas |

---

## Ação imediata recomendada

1. **Adicionar `.env` ao `.gitignore`** — único bloqueante técnico restante
2. **Executar checklist de validação manual** (seção 1) no preview
3. **Confirmar build web limpo** (`tsc --noEmit`)
4. Após essas 3 etapas, o release pode ser considerado seguro para os padrões atuais

