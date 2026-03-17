

## Proteger Edge Function `send-whatsapp`

### Alterações

**1. `supabase/functions/send-whatsapp/index.ts`** — Adicionar verificação de autenticação e role após o CORS handler:
- Extrair JWT do header `Authorization`
- Verificar se o usuário é `super_admin` ou `imobiliaria_admin` via query na tabela `user_roles`
- Chamadas com `service_role` (internas) continuam passando normalmente pois o service_role key bypassa essa verificação
- Retornar 401/403 para chamadas não autorizadas

**2. `supabase/config.toml`** — Manter `verify_jwt = false` (conforme padrão do projeto com signing-keys) e validar JWT no código da função

**3. `src/pages/Integracoes.tsx`** — Adicionar gate de role no frontend:
- Importar `useUserRole`
- Bloquear acesso para corretores comuns (permitir apenas `super_admin` e `imobiliaria_admin`)

### Fluxo após a correção
- Chamadas externas sem JWT → **401 bloqueado**
- Corretor comum autenticado → **403 bloqueado**
- Admin/Super Admin autenticado → **permitido**
- Edge Functions internas (OTP, convites, registro) usando service_role → **permitido** (service_role é reconhecido como admin)

