import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { getRedirectPathByRole } from '@/lib/roleRedirect';
import { Loader2 } from 'lucide-react';

export function SmartRedirect() {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();

  // Enquanto carrega, mostra loading
  if (authLoading || (user && roleLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Não logado -> vai para login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Logado -> vai para dashboard do role
  const redirectPath = getRedirectPathByRole(role);
  return <Navigate to={redirectPath} replace />;
}
