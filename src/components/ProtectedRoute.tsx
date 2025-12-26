import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole, AppRole } from '@/hooks/useUserRole';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
  requireSubscription?: boolean;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles,
  requireSubscription = false 
}: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { role, assinatura, loading: roleLoading } = useUserRole();
  const location = useLocation();

  if (authLoading || roleLoading) {
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

  // Check if user has required role
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to appropriate dashboard based on role
    if (role === 'super_admin') {
      return <Navigate to="/admin" replace />;
    } else if (role === 'imobiliaria_admin') {
      return <Navigate to="/empresa" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Check subscription status (for non-super-admin users)
  if (requireSubscription && role !== 'super_admin') {
    if (!assinatura || assinatura.status === 'suspensa' || assinatura.status === 'cancelada') {
      return <Navigate to="/assinatura-suspensa" replace />;
    }
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
