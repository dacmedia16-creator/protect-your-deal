

# Plano: Corrigir Erro ao Excluir Corretor Autônomo

## Problema Identificado

Ao tentar excluir o corretor autônomo (usuário `8d39a65b-2b59-4e51-abd5-aa8fa46f9e0e`), o sistema retorna erro:

```
AuthApiError: Database error deleting user
```

**Causa raiz**: A tabela `app_versions` tem uma foreign key `published_by` que referencia `auth.users`, mas **sem `ON DELETE CASCADE`**. Isso bloqueia a exclusão quando há registros associados ao usuário.

---

## Análise Técnica

| Tabela | Registros do Usuário | ON DELETE | Status |
|--------|---------------------|-----------|--------|
| `profiles` | 1 | CASCADE | OK |
| `user_roles` | 1 | CASCADE | OK |
| `assinaturas` | 1 | CASCADE | OK |
| `fichas_visita` | 0 | SET NULL | OK |
| `clientes` | 0 | CASCADE | OK |
| `imoveis` | 0 | CASCADE | OK |
| `app_versions` | **2** | **NO ACTION** | **BLOQUEANDO** |
| `user_sessions` | 3 | (sem FK) | Limpar |
| `convites.convidado_por` | 0 | NO ACTION | OK |

---

## Solução

Atualizar a função `admin-delete-user` para limpar as referências faltantes antes de deletar o usuário:

### Tabelas a Adicionar na Limpeza

1. **`app_versions.published_by`** → SET NULL
2. **`user_sessions`** → DELETE (não tem FK para auth.users, mas é bom limpar)
3. **`convites.convidado_por`** → SET NULL (prevenir problemas futuros)

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/admin-delete-user/index.ts` | Adicionar limpeza de `app_versions`, `user_sessions` e `convites` |
| `supabase/functions/empresa-delete-corretor/index.ts` | Adicionar mesmas limpezas |

---

## Seção Técnica

### Novo Código para `admin-delete-user/index.ts`

Adicionar antes do step final de exclusão (entre steps 8 e 9):

```typescript
// ====== STEP 9: Clear app_versions published_by ======
console.log('[9/12] Clearing app_versions published_by...');
const { count: appVersionsCount } = await supabaseAdmin
  .from('app_versions')
  .update({ published_by: null })
  .eq('published_by', user_id);

console.log(`[9/12] Cleared ${appVersionsCount ?? 0} app_versions references`);

// ====== STEP 10: Delete user_sessions ======
console.log('[10/12] Deleting user_sessions...');
const { count: sessionsCount } = await supabaseAdmin
  .from('user_sessions')
  .delete()
  .eq('user_id', user_id);

console.log(`[10/12] Deleted ${sessionsCount ?? 0} user_sessions`);

// ====== STEP 11: Clear convites.convidado_por ======
console.log('[11/12] Clearing convites.convidado_por...');
const { count: convitesCount } = await supabaseAdmin
  .from('convites')
  .update({ convidado_por: null })
  .eq('convidado_por', user_id);

console.log(`[11/12] Cleared ${convitesCount ?? 0} convites references`);

// ====== STEP 12: Delete user from auth.users ======
// (código existente renumerado)
```

### Mesma lógica para `empresa-delete-corretor/index.ts`

Aplicar as mesmas 3 novas etapas de limpeza.

---

## Resultado Esperado

Após implementação:
- A exclusão de corretores autônomos funcionará corretamente
- Registros em `app_versions` terão `published_by` definido como NULL
- Sessões do usuário serão removidas
- Referências em `convites` serão limpas
- Todos os dados relacionados serão tratados antes da exclusão do usuário

---

## Fluxo Completo de Exclusão (12 Steps)

```text
1. Limpar telefone do profile
2. Deletar equipes_membros
3. Deletar otp_queue
4. Deletar afiliados
5. Nullificar audit_logs
6. Deletar templates_mensagem
7. Transferir/orphanar fichas_visita
8. Limpar corretor_parceiro_id em fichas
9. Limpar app_versions.published_by (NOVO)
10. Deletar user_sessions (NOVO)
11. Limpar convites.convidado_por (NOVO)
12. Deletar usuário de auth.users
```

