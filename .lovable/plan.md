

## Plano: Corrigir envio de telefone formatado no Admin Usuários

### Problema
O campo telefone no modal "Editar Usuário" usa `formatPhone()` para exibição, mas envia o valor formatado (ex: `(15) 98178-8214`) ao backend. O backend salva esse valor diretamente, causando:
- Inconsistência com outros registros que usam apenas dígitos
- Possível conflito de unicidade se o mesmo número existe em formato diferente
- Erro 500 da Edge Function

### Correção

**`src/pages/admin/AdminUsuarios.tsx`** — 2 alterações:

1. **handleEditUser** (linha 389): Aplicar `unformatPhone()` antes de enviar:
   ```ts
   telefone: editForm.telefone ? unformatPhone(editForm.telefone) : undefined,
   ```

2. **handleCreateUser** (linha 435): Mesmo tratamento:
   ```ts
   telefone: createForm.telefone ? unformatPhone(createForm.telefone) : undefined,
   ```

3. **Import**: Adicionar `unformatPhone` ao import de `@/lib/phone`.

