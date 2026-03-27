

## Plano: Corrigir exclusão de corretores no módulo Construtora

### Problema
A edge function `empresa-delete-corretor` só aceita `imobiliaria_admin` na verificação de role (linha 52). Quando um `construtora_admin` tenta excluir, recebe 403.

### Alteração em `supabase/functions/empresa-delete-corretor/index.ts`

**1. Expandir verificação de role (linhas 48-61)**
- Buscar role do caller sem filtrar por role específico
- Aceitar `imobiliaria_admin` OU `construtora_admin`
- Extrair tanto `imobiliaria_id` quanto `construtora_id` do resultado

**2. Ajustar verificação de pertencimento (linhas 85-105)**
- Se caller é `construtora_admin`: verificar `construtora_id` do target via `user_roles` (não via `profiles.imobiliaria_id`)
- Se caller é `imobiliaria_admin`: manter lógica atual via `profiles.imobiliaria_id`

**3. Ajustar verificação de admin do target (linhas 107-120)**
- Se caller é `construtora_admin`: bloquear exclusão de outro `construtora_admin`
- Se caller é `imobiliaria_admin`: manter bloqueio de outro `imobiliaria_admin`

A lógica de deleção em si (steps 1-12) permanece inalterada.

