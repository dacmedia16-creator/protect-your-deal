import { AppRole } from '@/hooks/useUserRole';

export function getRedirectPathByRole(role: AppRole | null): string {
  switch (role) {
    case 'super_admin':
      return '/admin';
    case 'construtora_admin':
      return '/construtora';
    case 'imobiliaria_admin':
      return '/empresa';
    case 'afiliado':
      return '/afiliado';
    case 'corretor':
    default:
      return '/dashboard';
  }
}
