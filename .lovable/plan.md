

## Plano: Trocar ícone de Pesquisas para FileText

Mudar o ícone de "Pesquisas" de `ClipboardCheck` para `FileText` (mesmo ícone de "Registros") nos menus de navegação.

### Arquivos a editar

1. **`src/components/DesktopNav.tsx`** — trocar `ClipboardCheck` por `FileText` no item Pesquisas
2. **`src/components/MobileNav.tsx`** — trocar `ClipboardCheck` por `FileText` no item Pesquisas (remover import de `ClipboardCheck`)
3. **`src/components/layouts/ImobiliariaLayout.tsx`** — trocar `ClipboardCheck` por `FileText` no navItem Pesquisas (remover import de `ClipboardCheck`)
4. **`src/components/layouts/ConstutoraLayout.tsx`** — trocar `ClipboardCheck` por `FileText` no navItem Pesquisas (remover import de `ClipboardCheck`)

