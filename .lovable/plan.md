

## Plano: Mover Perfil para o header e manter Sofia no canto inferior

O usuário quer:
1. **Remover o botão "Perfil" (com foto) da nav bar inferior**
2. **Colocar o avatar/perfil no header (parte de cima da tela)**
3. **Manter a Sofia na posição inferior atual** (sem conflito)

### Alterações

**1. `src/components/MobileNav.tsx`**
- Remover o `DropdownMenu` do Perfil da nav bar inferior (linhas 119-170)
- Remover imports não utilizados (Avatar, DropdownMenu, User, LogOut, etc.)
- Remover state/effect do profile e logout

**2. `src/components/MobileHeader.tsx`**
- Adicionar avatar do usuário no canto direito do header
- Ao clicar, abrir o mesmo DropdownMenu que existia na nav (Perfil, Registros como Parceiro, Assinatura, Instalar, Sair)
- Importar hooks necessários: `useAuth`, `useUserRole`, `usePWAInstall`, `useEquipeLider`

**3. `src/components/ChatAssistente.tsx`**
- Ajustar `bottom-20` para `bottom-16` já que a nav ficou menor sem o botão Perfil

### Resultado
- Header: logo/título + avatar com dropdown do perfil
- Nav inferior: apenas os itens de navegação (Início, Registros, Convites/Equipe, Pesquisas)
- Sofia: posicionada acima da nav bar

