

## Plano: Corrigir logo da construtora no login para corretores

### Problema
Quando um corretor de construtora é criado via `admin-create-corretor`, o campo `construtora_id` nunca é preenchido na tabela `profiles` (linha 177 — só seta `imobiliaria_id`). A edge function `get-imobiliaria-by-email` busca `profiles.construtora_id`, que está sempre `null` para esses corretores, e por isso o logo não aparece.

### Correções

**1. `supabase/functions/admin-create-corretor/index.ts` (linha 174-185)**
Adicionar `construtora_id: construtoraId` no update do profile, ao lado de `imobiliaria_id`:
```typescript
.update({
  imobiliaria_id: imobiliariaId,
  construtora_id: construtoraId,  // ← ADICIONAR
  nome,
  telefone: telefone || null,
  creci: creci || null,
  cpf: cpf || null,
  email: email || null,
  ativo: true,
})
```

**2. `supabase/functions/get-imobiliaria-by-email/index.ts` (linha 65)**
Adicionar fallback: se `profiles.construtora_id` é null, verificar `user_roles.construtora_id` antes de desistir:
```typescript
// Após verificar profile, se não tem construtora_id nem imobiliaria_id, 
// tentar buscar via user_roles
if (!profile?.imobiliaria_id && !profile?.construtora_id) {
  // Buscar user_id do profile ou auth
  // Consultar user_roles para encontrar construtora_id
  // Se encontrar, buscar construtora e retornar
}
```

Isso resolve tanto corretores futuros (fix 1) quanto os já existentes (fix 2).

### Impacto
- Nenhuma migração de banco necessária
- Duas edge functions editadas
- Corretores existentes de construtoras passarão a ver o logo imediatamente (via fallback no user_roles)

