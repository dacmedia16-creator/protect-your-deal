

## Visualizar Rede de Afiliados no Admin

### Contexto
A página Admin Afiliados já mostra "Indicado por" em cada linha, mas não permite expandir e ver **quem cada afiliado indicou** (a rede dele). O objetivo é adicionar um botão/ação por afiliado que abre um dialog mostrando a rede de indicados daquele afiliado.

### Solução
Adicionar um botão "Ver Rede" nas ações de cada afiliado na tabela. Ao clicar, abre um Dialog mostrando os afiliados indicados por aquele afiliado (usando `indicado_por = afiliado.id`), com nome, email, status e data de cadastro.

### Mudanças

| Arquivo | Mudança |
|---------|---------|
| `src/pages/admin/AdminAfiliados.tsx` | Adicionar botão "Ver Rede" nas ações + Dialog com lista de indicados |

### Detalhes técnicos

Como o super admin já tem acesso total à tabela `afiliados` via RLS (`is_super_admin`), não precisa de migration. A query será:

```tsx
supabase.from("afiliados")
  .select("id, nome, email, ativo, created_at")
  .eq("indicado_por", selectedAfiliado.id)
```

O dialog mostrará:
- Nome do afiliado selecionado como título
- Contagem de indicados
- Tabela com nome, email, status (ativo/inativo) e data de cadastro
- Estado vazio quando não há indicados

O botão usará o ícone `Network` ou `GitBranch` ao lado das outras ações existentes.

