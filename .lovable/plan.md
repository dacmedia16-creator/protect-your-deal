

## Plano: Adicionar avatar do Perfil no header do Dashboard

O Dashboard usa um header customizado (não usa `MobileHeader`), por isso o avatar do perfil não aparece.

### Alteração

**`src/pages/Dashboard.tsx`**
- No header mobile customizado (linhas 298-317), adicionar o avatar do usuário com o mesmo `DropdownMenu` do `MobileHeader` (Perfil, Registros como Parceiro, Assinatura, Equipe, Instalar, Sair)
- Importar componentes necessários: `Avatar`, `DropdownMenu`, `useAuth`, `usePWAInstall`, `useEquipeLider`, `RoleBadge`
- Buscar `profile` (foto_url, nome) via Supabase query já existente no Dashboard
- Posicionar o avatar no lado direito do header, ao lado do nome da imobiliária

### Resultado
O avatar com dropdown do perfil aparecerá no canto superior direito do Dashboard, igual às outras telas.

