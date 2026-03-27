

## Plano: Adicionar edição e exclusão de empreendimentos

### Alterações em `src/pages/construtora/ConstutoraEmpreendimentos.tsx`

**1. Adicionar estado para edição e exclusão**
- `editingEmp` (empreendimento sendo editado, ou null para criação)
- `deleteId` + `deleteDialogOpen` para confirmação de exclusão

**2. Reutilizar o Dialog para edição**
- Ao abrir dialog, se `editingEmp` existe, preencher campos com dados existentes
- Título muda para "Editar Empreendimento" / "Novo Empreendimento"
- Botão de submit muda texto conforme modo

**3. Adicionar mutation de update**
- `updateMutation`: faz `.update({...}).eq('id', editingEmp.id)` no Supabase
- O botão de submit chama `createMutation` ou `updateMutation` conforme o modo

**4. Adicionar mutation de delete**
- `deleteMutation`: faz `.delete().eq('id', deleteId)` no Supabase
- Toast de sucesso e invalidação da query

**5. Adicionar botões de ação nos cards**
- `DropdownMenu` com `MoreVertical` no header de cada card
- Opções: "Editar" (abre dialog preenchido) e "Excluir" (abre AlertDialog de confirmação)

**6. AlertDialog para confirmação de exclusão**
- Texto: "Tem certeza que deseja excluir o empreendimento X?"
- Botões: Cancelar / Excluir (destructive, com loading)

**Imports adicionais**: `DropdownMenu*`, `AlertDialog*`, `MoreVertical`, `Pencil`, `Trash2`

