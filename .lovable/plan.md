
# Plano: Admin não contabilizar como Corretor

## Problema Identificado
Atualmente, as queries que contam o número de corretores vinculados a uma imobiliária estão buscando **TODOS** os registros em `user_roles` com o `imobiliaria_id`, incluindo usuários com role `imobiliaria_admin`. Isso causa:

- Admins serem contados no limite de corretores do plano
- Estatísticas incorretas no dashboard da empresa
- Card de uso do plano mostrando número inflado de corretores

## Locais Afetados

| Arquivo | Linha | Problema |
|---------|-------|----------|
| `src/pages/empresa/EmpresaDashboard.tsx` | 62-65 | Conta todos os roles da imobiliária |
| `src/pages/empresa/EmpresaAssinatura.tsx` | 69-72 | Conta todos os roles da imobiliária |
| `src/components/PlanUsageCard.tsx` | 51-54 | Conta todos os roles da imobiliária |
| `src/pages/admin/AdminImobiliarias.tsx` | 124-127 | Conta todos os roles da imobiliária |

---

## Solução

Adicionar o filtro `.eq('role', 'corretor')` em cada uma das queries de contagem para excluir usuários com role `imobiliaria_admin`.

### Mudanças Específicas

**1. `src/pages/empresa/EmpresaDashboard.tsx` (linhas 62-65)**

Antes:
```typescript
const { count: totalCorretores } = await supabase
  .from('user_roles')
  .select('*', { count: 'exact', head: true })
  .eq('imobiliaria_id', imobiliariaId);
```

Depois:
```typescript
const { count: totalCorretores } = await supabase
  .from('user_roles')
  .select('*', { count: 'exact', head: true })
  .eq('imobiliaria_id', imobiliariaId)
  .eq('role', 'corretor');
```

**2. `src/pages/empresa/EmpresaAssinatura.tsx` (linhas 69-72)**

Adicionar `.eq('role', 'corretor')` à query existente.

**3. `src/components/PlanUsageCard.tsx` (linhas 51-54)**

Adicionar `.eq('role', 'corretor')` à query existente.

**4. `src/pages/admin/AdminImobiliarias.tsx` (linhas 124-127)**

Adicionar `.eq('role', 'corretor')` à query existente.

---

## Comportamento Após a Mudança

- Dashboard da Empresa: Mostrará apenas corretores (sem admin)
- Card de Uso do Plano: Contagem correta de corretores vs limite
- Página de Assinatura: Estatísticas precisas
- Admin Imobiliárias: Contador de corretores por imobiliária correto

---

## Observação sobre `EmpresaCorretores.tsx`

A página de listagem de corretores continuará mostrando admins na lista (isso é intencional para gerenciamento), mas a **contagem para limite do plano** não incluirá admins.

---

## Arquivos a Modificar

1. `src/pages/empresa/EmpresaDashboard.tsx`
2. `src/pages/empresa/EmpresaAssinatura.tsx`
3. `src/components/PlanUsageCard.tsx`
4. `src/pages/admin/AdminImobiliarias.tsx`
