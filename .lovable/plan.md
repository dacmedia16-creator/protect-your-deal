

# Lote 3 — Plano Operacional Final

## 1. Ordem final de execução

```text
Passo 1 → requireAnyRole em _shared/auth.ts
Passo 2 → Migrar admin-get-corretores-emails
Passo 3 → Migrar admin-reset-corretor-password
Passo 4 → Migrar admin-update-corretor
Passo 5 → Atualizar docs/edge-functions-security.md
Passo 6 → grep de validação final
```

## 2. Critério de pronto para requireAnyRole

O helper está pronto quando:
- Aceita `roles: string[]` e faz `.in("role", roles)` em `user_roles`
- Retorna `{ user, supabaseAdmin, role, roleData }` onde `roleData` é o registro completo (`role`, `imobiliaria_id`, `construtora_id`)
- Retorna `Response 403` se nenhuma role é encontrada
- Reutiliza `requireAuth` internamente (não duplica auth)
- `requireRole` existente continua funcionando (não é alterado)

## 3. O que o helper faz e NÃO faz

**Faz:**
- Autenticação via Bearer token
- Query em `user_roles` filtrando por `user_id` + `roles[]`
- Retorna o primeiro match encontrado com dados organizacionais
- Retorna `supabaseAdmin` pronto para uso

**NÃO faz:**
- Scoping organizacional (verificar se corretor X pertence à mesma imobiliária)
- Verificação de líder de equipe (RPC `is_membro_da_minha_equipe`)
- Lógica de negócio (transferência de fichas, limpeza de telefone)
- Fallback para roles alternativas (ex: se não é admin, tentar líder)

## 4. Checklist de validação por função

### admin-get-corretores-emails
- [ ] Zero `createClient` local
- [ ] Importa `requireAnyRole` e `corsHeaders` de `_shared/auth.ts`
- [ ] `requireAnyRole(req, ["imobiliaria_admin", "super_admin"])`
- [ ] Scoping por `imobiliaria_id` extraído de `roleData` (não de query extra)
- [ ] `isSuperAdmin` derivado de `role === "super_admin"` do retorno
- [ ] Resposta vazia para `user_ids = []` mantida
- [ ] Filtro de `allowedUserIds` por imobiliária mantido para não-super_admin

### admin-reset-corretor-password
- [ ] Zero `createClient` local
- [ ] `requireAnyRole(req, ["super_admin", "imobiliaria_admin", "construtora_admin"])`
- [ ] Scoping organizacional (imobiliária/construtora) mantido no corpo
- [ ] Validação de `new_password.length >= 6` mantida
- [ ] `updateUserById` usa `supabaseAdmin` do helper

### admin-update-corretor
- [ ] Zero `createClient` local
- [ ] `requireAnyRole(req, ["super_admin", "imobiliaria_admin", "construtora_admin"])`
- [ ] Fallback para `isLiderOfMembro` via RPC continua **fora do helper**, no corpo
- [ ] Restrição de campos para líder mantida
- [ ] Lógica de deativação (limpar telefone, transferir fichas, limpar parceiro) intacta
- [ ] Scoping organizacional mantido no corpo

## 5. Regressões mais prováveis

| Função | Risco | Causa |
|:---|:---|:---|
| `admin-get-corretores-emails` | Baixo | Função simples, somente leitura. Risco: `roleData` não incluir `imobiliaria_id` se o select do helper não tiver as colunas certas. |
| `admin-reset-corretor-password` | Médio | Hoje cria **dois** clients (`supabaseAuth` + `supabaseAdmin`). Se o helper só retornar `supabaseAdmin`, o fluxo de `getUser` muda. Risco: auth funcionar diferente com service-role client vs anon client. |
| `admin-update-corretor` | Médio-Alto | Tem fallback para líder de equipe que **não é uma role** — é um RPC. Se a migração tratar `requireAnyRole` como gate único e falhar para líderes (que são `corretor`), o líder perde acesso. |

## 6. Função que exige maior cuidado

**`admin-update-corretor`** — por três razões:

1. **Líder de equipe não é uma role admin.** O helper vai retornar 403 para líderes. A função precisa de um fallback explícito: se `requireAnyRole` retorna 403, verificar via RPC se é líder antes de rejeitar.
2. **261 linhas** com lógica de negócio densa (deativação, transferência de fichas, limpeza de parceiro).
3. **Mais caminhos de autorização** (super_admin, imobiliária_admin, construtora_admin, líder) do que qualquer outra função do lote.

**Decisão arquitetural:** Para `admin-update-corretor`, o padrão será:
```text
1. Tentar requireAnyRole(req, ["super_admin", "imobiliaria_admin", "construtora_admin"])
2. Se retornar Response (403), fazer fallback manual:
   a. Chamar requireAuth(req) para obter user + supabaseAdmin
   b. Verificar is_membro_da_minha_equipe via RPC
   c. Se não é líder, retornar o 403 original
```

## 7. Regra de rollout

1. **Deploy sequencial, não em batch.** Cada função é deployada e testada isoladamente antes de migrar a próxima.
2. **Passo 1 (helper) é aditivo.** `requireAnyRole` é adicionado sem alterar `requireRole` ou `requireAuth` — zero risco de regressão nas funções do Lote 2.
3. **Cada deploy é verificável em < 5 minutos** via grep no código + teste funcional no frontend (listar corretores, resetar senha, editar corretor).
4. **Se qualquer função falhar em produção:** reverter apenas aquela função ao código original (que é autossuficiente com `createClient` local) sem afetar as demais.
5. **Janela de observação:** 24h entre a migração da função 2 e da função 3. A função 3 (`admin-update-corretor`) só é migrada após confirmar estabilidade das duas anteriores.

