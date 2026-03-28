

## Revisão Completa dos Edge Functions

Após analisar todos os 51 endpoints, identifiquei problemas em 4 categorias: segurança, bugs, performance e limpeza.

---

### 1. LIMPEZA: Funções Duplicadas

**3 funções de Survey OG são cópias idênticas** — `survey-og-page`, `survey-og`, e `serve-survey-meta` fazem exatamente a mesma coisa: servem meta tags OG para crawlers e redirecionam browsers normais. Apenas uma é necessária.

- **Ação**: Identificar qual está sendo usada externamente (links de WhatsApp) e remover as outras duas. Nenhuma é chamada pelo frontend — são acessadas diretamente por crawlers, então precisa verificar qual URL está configurada nos templates de envio.

**Legacy WhatsApp APIs no `send-otp`** — Funções `sendViaEvolutionAPI` e `sendViaZAPI` (linhas 174-245) são fallbacks para APIs que não estão configuradas (sem secrets `EVOLUTION_*` ou `ZAPI_*`). Código morto.

- **Ação**: Remover funções legacy de Evolution API e Z-API do `send-otp`.

---

### 2. SEGURANÇA

#### 2.1 `master-login` — Sem rate limiting
A função aceita tentativas ilimitadas de login com a master password. Um atacante pode fazer brute-force.

- **Ação**: Adicionar rate limiting por IP (ex: 5 tentativas por minuto) ou implementar delay exponencial.

#### 2.2 `admin-promote-corretor` — Não suporta construtora
Permite promover/rebaixar apenas entre `corretor` e `imobiliaria_admin`. Um `construtora_admin` não é verificado como caller autorizado e não pode promover seus próprios corretores.

- **Ação**: Adicionar `construtora_admin` como caller autorizado com verificação de `construtora_id`.

#### 2.3 `get-ficha-externa` — Retorna dados completos da ficha
Retorna `ficha: ficha` com `SELECT *`, expondo todos os campos (telefones, CPFs, nomes completos) para qualquer pessoa com um token de convite válido.

- **Ação**: Filtrar campos retornados para apenas os necessários (endereço, tipo, protocolo, dados da parte faltante).

#### 2.4 `admin-create-user` — Validação incompleta
Aceita `role: 'construtora_admin'` sem exigir `construtora_id`, e aceita `role: 'corretor'` ou `role: 'imobiliaria_admin'` sem exigir `imobiliaria_id`.

- **Ação**: Validar que o `_id` da organização correspondente está presente para cada role.

---

### 3. BUGS

#### 3.1 `admin-delete-user` — Numeração inconsistente de steps
Os logs mostram "[6/9]", "[7/9]", "[8/12]", "[9/12]", etc. É cosmético mas dificulta debugging.

- **Ação**: Corrigir para "[1/12]" até "[12/12]" consistentemente.

#### 3.2 `empresa-delete-corretor` — Mesma numeração inconsistente
"[8/12]", "[9/12]" nos logs quando deveria ser "[8/9]", "[9/9]".

#### 3.3 `admin-reset-corretor-password` — Usa `getUser()` ao invés de `getUser(token)`
Linha 40: `await supabaseAuth.auth.getUser()` sem passar token explicitamente. Funciona por causa do header passado ao createClient, mas é inconsistente com o padrão usado em todas as outras funções que passam o token diretamente.

---

### 4. PERFORMANCE

#### 4.1 `admin-fix-inconsistencies` — N+1 queries
As operações `backfill_orphan_fichas`, `sync_profiles` e `create_missing_profiles` fazem uma query individual para cada registro (loop com query dentro). Com muitos registros, isso pode causar timeout.

- **Ação**: Refatorar para usar batch queries ou JOINs no lugar de loops N+1.

#### 4.2 `admin-list-users` — Retorna todos os usuários
Carrega TODOS os usuários do sistema (paginação completa do auth) em uma única resposta. Conforme a base cresce, isso vai ficar lento e pesado.

- **Ação**: Adicionar paginação no request (page/perPage params) ou usar a tabela `profiles` ao invés de `auth.admin.listUsers()`.

---

### Resumo de Prioridades

```text
CRÍTICO (Segurança)
├── master-login: adicionar rate limiting
├── get-ficha-externa: filtrar campos sensíveis
└── admin-create-user: validar org_id obrigatório por role

ALTO (Limpeza)
├── Remover 2 de 3 funções survey-og duplicadas
└── Remover legacy Evolution/Z-API do send-otp

MÉDIO (Bugs + Performance)
├── Corrigir numeração de steps nos deletes
├── N+1 queries no admin-fix-inconsistencies
└── admin-list-users sem paginação
```

### Detalhes técnicos

- As 3 funções survey-og (`survey-og-page`, `survey-og`, `serve-survey-meta`) não são referenciadas no frontend — são acessadas diretamente via URL. Precisa verificar qual URL está nos templates de WhatsApp/email antes de remover.
- O `send-otp` tem ~530 linhas; remover Evolution/Z-API reduz ~70 linhas de código morto.
- O `admin-fix-inconsistencies` poderia usar queries bulk como `UPDATE profiles SET imobiliaria_id = ur.imobiliaria_id FROM user_roles ur WHERE ...` via RPC ao invés de loops.

