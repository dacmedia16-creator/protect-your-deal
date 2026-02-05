
# Plano: Corrigir Exclusão de Corretores pelo Admin da Imobiliária

## Problema Identificado

Quando o admin da imobiliária (REMAX) exclui um corretor pela página "Corretores", a exclusão está incompleta:

| O que deveria acontecer | O que acontece hoje |
|------------------------|---------------------|
| Excluir user_roles | ✅ Funciona |
| Excluir profiles | ❌ NÃO exclui |
| Excluir auth.users | ❌ NÃO exclui |
| Limpar telefone | ❌ NÃO limpa |
| Limpar equipes_membros | ❌ NÃO limpa |

**Resultado**: 10 usuários "órfãos" ocupando telefones e aparecendo em queries de pendentes.

---

## Solução Proposta

### 1. Criar Edge Function `empresa-delete-corretor`

Nova função que permite ao admin da imobiliária excluir completamente corretores da SUA imobiliária.

**Validações de segurança:**
- Verificar se quem chama é `imobiliaria_admin`
- Verificar se o corretor pertence à mesma imobiliária
- Não permitir auto-exclusão
- Não permitir excluir outro admin

**Lógica de exclusão (mesma da admin-delete-user):**
1. Limpar telefone (liberar para reuso)
2. Excluir de equipes_membros
3. Excluir de otp_queue
4. Excluir de afiliados
5. Excluir de templates_mensagem
6. Nullificar audit_logs
7. Transferir fichas_visita para o admin
8. Limpar corretor_parceiro_id
9. Excluir de auth.users (cascata para profiles e user_roles)

### 2. Atualizar `EmpresaCorretores.tsx`

Modificar a função `removeCorretor` para chamar a nova Edge Function em vez de apenas deletar user_roles.

```typescript
async function removeCorretor(userId: string) {
  // Chamar empresa-delete-corretor
  const { data, error } = await supabase.functions.invoke('empresa-delete-corretor', {
    body: { user_id: userId }
  });
}
```

### 3. Limpeza dos Órfãos Existentes

Criar migração SQL para limpar os 10 usuários órfãos atuais:

| Nome | Telefone | Status |
|------|----------|--------|
| Eder souza | - | Órfão |
| Denis Teste | - | Órfão |
| Lucas alba santo | 12455666667 | Órfão |
| Paulo rogerio | 12988777766 | Órfão |
| Lucas alba | 22456677888 | Órfão (inativo) |
| Marcos Eduardo | 12900000000 | Órfão (inativo) |
| Teste Vinculado | 11999998888 | Órfão (inativo) |
| Joao Carlos | 15997216772 | Órfão |
| Maria Antonia | 15996237299 | Órfão |
| eder souza | 15981788218 | Órfão (duplicado) |

---

## Arquivos a Modificar

1. **Criar**: `supabase/functions/empresa-delete-corretor/index.ts`
2. **Editar**: `src/pages/empresa/EmpresaCorretores.tsx`
3. **Criar**: Migração SQL para limpeza dos 10 órfãos

---

## Seção Técnica

### Edge Function: empresa-delete-corretor

```typescript
// Validação de permissão
const { data: roleData } = await supabaseAdmin
  .from('user_roles')
  .select('role, imobiliaria_id')
  .eq('user_id', currentUser.id)
  .eq('role', 'imobiliaria_admin')
  .single();

// Verificar se corretor pertence à mesma imobiliária
const { data: targetProfile } = await supabaseAdmin
  .from('profiles')
  .select('imobiliaria_id')
  .eq('user_id', target_user_id)
  .single();

if (targetProfile.imobiliaria_id !== roleData.imobiliaria_id) {
  throw new Error('Corretor não pertence à sua imobiliária');
}

// ... lógica de exclusão completa
```

### Migração SQL para limpeza

```sql
DO $$
DECLARE
  orphan_ids UUID[] := ARRAY[
    '953df447-de41-4db2-974c-f7b7a64f0b1d', -- Denis Teste
    '9164bb5f-4f3b-40d5-894b-df768ee9b93e', -- eder souza
    '49a47b05-2513-4005-a18c-3d7d278087a0', -- Eder souza
    'fd13d8a0-9f78-4a73-95d2-83027596b28e', -- Joao Carlos
    'b5bc59fb-5867-4150-afba-99862714429d', -- Lucas alba
    'b0b6b80b-e329-46c0-a4cc-9914cef22354', -- Lucas alba santo
    '1f4db4ba-7db3-464f-9826-22734572f0ec', -- Marcos Eduardo
    'fe6df2cc-35e2-43d2-959d-909842d21943', -- Maria Antonia
    '2a734251-9943-4688-930e-f9357031d125', -- Paulo rogerio
    '3e04d381-f984-4184-bcfb-8e2aa32728a0'  -- Teste Vinculado
  ];
  orphan_id UUID;
BEGIN
  FOREACH orphan_id IN ARRAY orphan_ids LOOP
    -- Limpar todas as referências
    DELETE FROM equipes_membros WHERE user_id = orphan_id;
    DELETE FROM otp_queue WHERE user_id = orphan_id;
    UPDATE audit_logs SET user_id = NULL WHERE user_id = orphan_id;
    UPDATE fichas_visita SET user_id = NULL WHERE user_id = orphan_id;
    UPDATE fichas_visita SET corretor_parceiro_id = NULL WHERE corretor_parceiro_id = orphan_id;
    DELETE FROM profiles WHERE user_id = orphan_id;
  END LOOP;
END $$;
```

---

## Resultado Esperado

Após implementação:
- ✅ Admin da imobiliária pode excluir corretores completamente
- ✅ Telefones liberados imediatamente
- ✅ Não haverá mais usuários órfãos
- ✅ Os 10 órfãos atuais serão limpos
- ✅ Fichas são preservadas (transferidas ou órfãs)
