import { AppRole } from '@/hooks/useUserRole';

export function getRedirectPathByRole(role: AppRole | null): string {
  switch (role) {
    case 'super_admin':
      return '/admin';
    case 'imobiliaria_admin':
      return '/empresa';
    case 'corretor':
    default:
      return '/dashboard';
  }
}
