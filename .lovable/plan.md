

# Lote 4 — Plano Operacional Final

## 1. Ordem final de execução

```text
Passo 1 → Migrar admin-create-user (requireRole)
Passo 2 → Migrar admin-promote-corretor (requireAnyRole)
Passo 3 → Migrar admin-create-corretor (requireAnyRole)
Passo 4 → Atualizar docs/edge-functions-security.md
Passo 5 → grep de validação final
```

## 2. Critério de pronto por função

### admin-create-user
- Zero `createClient` local
- Usa `requireRole(req, "super_admin")` do helper existente
- `supabaseAdmin` do helper usado em todas as operações (createUser, profile update, role insert)
- Validações de campo inalteradas (email, password >= 6, role, org_id)
- Verificação de entidade (imobiliária/construtora existe) mantida no corpo

### admin-promote-corretor
- Zero `createClient` local
- Usa `requireAnyRole(req, ["super_admin", "imobiliaria_admin", "construtora_admin"])`
- `isSuperAdmin` derivado de `role === "super_admin"` do retorno do helper
- Scoping organizacional via `roleData.imobiliaria_id` / `roleData.construtora_id`
- Proteções mantidas: auto-promoção bloqueada, super_admin imutável, validação de `new_role`

### admin-create-corretor
- Zero `createClient` local
- Usa `requireAnyRole(req, ["imobiliaria_admin", "super_admin", "construtora_admin"])`
- `imobiliariaId` / `construtoraId` extraídos de `roleData` (elimina query redundante)
- Lógica de flags `autonomo` / `construtora` mantida no corpo
- Criação de auth user + role + profile usa `supabaseAdmin` do helper

## 3. Regressões mais prováveis

| Função | Risco | Causa provável |
|--------|:-----:|----------------|
| `admin-create-user` | Baixo | Mapeamento direto 1:1 para `requireRole`. Único risco: esquecer de remover import do `createClient` |
| `admin-promote-corretor` | Médio | Hoje busca **array** de roles do caller (`currentUserRoles`) e itera. Com `requireAnyRole`, recebe **um** registro. Se houver lógica que dependa de iterar múltiplas roles, quebrará. Verificação: cada usuário tem exatamente 1 role — seguro, mas requer atenção na derivação de `imobAdminRole` / `constAdminRole` |
| `admin-create-corretor` | Baixo | Padrão atual (`.in("role", [...]).maybeSingle()`) é idêntico ao `requireAnyRole`. Mapeia 1:1. Risco residual: `roleData` não retornar `construtora_id` se o usuário for `super_admin` sem vínculo — mas a lógica já trata esse caso |

## 4. Função que exige maior cuidado

**`admin-promote-corretor`** — por duas razões:

1. **Derivação de contexto organizacional.** Hoje extrai `imobAdminRole` e `constAdminRole` de um array de roles. Com o helper, precisa derivar tudo de um único objeto `roleData`. A lógica de scoping (`targetRole.imobiliaria_id !== imobAdminRole.imobiliaria_id`) deve ser reescrita para usar `roleData.imobiliaria_id` diretamente.

2. **Múltiplos guards de segurança.** Auto-promoção bloqueada, super_admin imutável, scoping por org — todos devem ser preservados exatamente. Qualquer falha aqui permite escalação de privilégio.

## 5. Checklist de validação por função

### Após admin-create-user
- [ ] Zero `createClient` local (grep)
- [ ] Importa `requireRole` e `corsHeaders` de `_shared/auth.ts`
- [ ] Super admin cria usuário com sucesso (corretor, imobiliaria_admin, construtora_admin)
- [ ] Não-super_admin recebe 403
- [ ] Email duplicado retorna erro adequado
- [ ] Senha < 6 chars retorna 400

### Após admin-promote-corretor
- [ ] Zero `createClient` local (grep)
- [ ] Importa `requireAnyRole` e `corsHeaders` de `_shared/auth.ts`
- [ ] Super admin promove/rebaixa qualquer usuário
- [ ] Admin de imobiliária promove/rebaixa apenas da sua org
- [ ] Admin de construtora promove/rebaixa apenas da sua org
- [ ] Auto-promoção bloqueada (400)
- [ ] Promoção de super_admin bloqueada (403)
- [ ] Corretor comum recebe 403

### Após admin-create-corretor
- [ ] Zero `createClient` local (grep)
- [ ] Importa `requireAnyRole` e `corsHeaders` de `_shared/auth.ts`
- [ ] Admin de imobiliária cria corretor vinculado à sua org
- [ ] Admin de construtora cria corretor vinculado à sua construtora
- [ ] Super admin cria corretor autônomo
- [ ] Email duplicado retorna erro adequado
- [ ] Profile atualizado com dados corretos (nome, telefone, creci, cpf)

## 6. Regra de rollout e rollback

- **Deploy sequencial.** Uma função por vez, nunca em batch.
- **admin-create-user primeiro** — mais simples, valida que o padrão `requireRole` continua estável após Lote 3.
- **Sem janela obrigatória** entre funções 1 e 2 (ambas baixo/médio risco).
- **Se falhar:** reverter apenas a função afetada ao código original (autossuficiente com `createClient` local). As demais funções e o helper não são afetados.
- **Verificação por deploy:** grep (zero `createClient`) + teste funcional (< 5 min por função).

## 7. Critério de encerramento do Lote 4

O lote está encerrado quando:
1. As 3 funções deployadas sem `createClient` local (grep confirmado)
2. 24h sem erros 500 nas 3 funções
3. Zero relatos de falha em criação de usuário, promoção ou criação de corretor
4. `docs/edge-functions-security.md` atualizado com as 3 funções
5. Nenhuma alteração feita em `_shared/auth.ts` durante o lote

