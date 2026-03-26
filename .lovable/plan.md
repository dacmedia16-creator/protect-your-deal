

## Plano: Criar admin da construtora junto com a empresa

Adicionar uma seção opcional no formulário de `AdminNovaConstrutora.tsx` para criar o usuário administrador no mesmo passo, usando a edge function `admin-create-user` já existente.

### Alterações

**1. Atualizar `src/pages/admin/AdminNovaConstrutora.tsx`**

- Adicionar checkbox/switch "Criar usuário administrador" (default: ativado)
- Quando ativado, exibir campos: Nome do admin, Email do admin, Senha (com `PasswordInput` e gerador)
- Atualizar schema Zod com campos condicionais (`admin_nome`, `admin_email`, `admin_senha`)
- No `onSubmit`:
  1. Criar a construtora (como já faz)
  2. Criar assinatura se plano selecionado (como já faz)
  3. Se admin habilitado: invocar `admin-create-user` com `role: 'construtora_admin'` e `construtora_id`
  4. Exibir dialog de sucesso com credenciais (email + senha) para copiar
- Importar `PasswordInput`, `Switch`, `Dialog` e ícones necessários

### Detalhes técnicos
- A edge function `admin-create-user` já suporta `role: 'construtora_admin'` e `construtora_id`
- Se a criação do admin falhar, a construtora já foi criada — exibir toast de aviso (mesmo padrão do `AdminUsuarios`)
- Dialog de sucesso mostra credenciais com botão de copiar, igual ao fluxo existente em `AdminCorretoresAutonomos`

