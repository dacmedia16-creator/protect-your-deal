import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole, AppRole } from '@/hooks/useUserRole';
import { useTermosAceitos } from '@/hooks/useTermosAceitos';
import { Loader2 } from 'lucide-react';
import { InactiveAccountOverlay } from '@/components/InactiveAccountOverlay';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
  requireSubscription?: boolean;
  skipTermsCheck?: boolean;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles,
  requireSubscription = false,
  skipTermsCheck = false 
}: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { role, assinatura, ativo, loading: roleLoading } = useUserRole();
  const { termosAceitos, loading: termosLoading } = useTermosAceitos();
  const location = useLocation();

  // Show loader while any critical data is loading
  if (authLoading || roleLoading || (!skipTermsCheck && termosLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // No role assigned - redirect to pending page or auth
  if (!role) {
    return <Navigate to="/auth" replace />;
  }

  // Check if user has accepted terms (skip for the terms acceptance page itself)
  // Only redirect if termosAceitos is explicitly false (not null/undefined while loading)
  if (!skipTermsCheck && termosAceitos === false && location.pathname !== '/aceitar-termos') {
    return <Navigate to="/aceitar-termos" replace />;
  }

  // Check if user has required role
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to appropriate dashboard based on role
    if (role === 'super_admin') {
      return <Navigate to="/admin" replace />;
    } else if (role === 'imobiliaria_admin') {
      return <Navigate to="/empresa" replace />;
    } else if (role === 'afiliado') {
      return <Navigate to="/afiliado" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Check subscription status (for non-super-admin users)
  if (requireSubscription && role !== 'super_admin') {
    if (!assinatura || assinatura.status === 'suspensa' || assinatura.status === 'cancelada' || assinatura.status === 'pendente') {
      return <Navigate to="/assinatura-suspensa" replace />;
    }
  }

  // Check if user account is inactive (super_admin never blocked to prevent lock-out)
  // Show overlay instead of redirecting - user can see dashboard but cannot interact
  if (role !== 'super_admin' && ativo === false) {
    return (
      <div className="relative min-h-screen">
        <InactiveAccountOverlay />
        <div className="pointer-events-none select-none opacity-50 blur-[1px]">
          {children}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Higher-order component for easy route protection
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles?: AppRole[],
  requireSubscription?: boolean
) {
  return function WrappedComponent(props: P) {
    return (
      <ProtectedRoute allowedRoles={allowedRoles} requireSubscription={requireSubscription}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
