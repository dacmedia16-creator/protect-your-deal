import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { getRedirectPathByRole } from '@/lib/roleRedirect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, LogOut, Mail, Loader2, RefreshCw } from 'lucide-react';

export default function SemPermissao() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { role, loading: roleLoading, error: roleError, refetch } = useUserRole();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Auto-redirect if role is found after refetch
  useEffect(() => {
    if (!roleLoading && !roleError && role) {
      navigate(getRedirectPathByRole(role), { replace: true });
    }
  }, [role, roleLoading, roleError, navigate]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await refetch();
    } finally {
      setIsRetrying(false);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await signOut();
      navigate('/auth');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-0 shadow-soft">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto p-4 rounded-full bg-muted">
            <Shield className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle className="font-display text-2xl">Conta Pendente</CardTitle>
          <CardDescription className="text-base">
            {roleError 
              ? 'Houve um erro ao verificar suas permissões. Tente novamente.'
              : 'Sua conta ainda não possui permissões de acesso. Isso pode acontecer se:'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!roleError && (
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                Você criou a conta recentemente e ainda não foi vinculado a uma imobiliária
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                O administrador da sua imobiliária ainda não aprovou seu acesso
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                Houve um problema durante o registro
              </li>
            </ul>
          )}

          <Button 
            variant="default" 
            className="w-full" 
            onClick={handleRetry}
            disabled={isRetrying || roleLoading}
          >
            {isRetrying || roleLoading 
              ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
              : <RefreshCw className="h-4 w-4 mr-2" />}
            {isRetrying || roleLoading ? 'Verificando...' : 'Tentar novamente'}
          </Button>

          <div className="space-y-3 pt-4 border-t">
            <p className="text-sm text-center text-muted-foreground">
              Entre em contato com o suporte para resolver:
            </p>
            <Button variant="outline" className="w-full" asChild>
              <a href="mailto:suporte@visitaprova.com.br">
                <Mail className="h-4 w-4 mr-2" />
                suporte@visitaprova.com.br
              </a>
            </Button>
          </div>

          <Button 
            variant="ghost" 
            className="w-full text-muted-foreground" 
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LogOut className="h-4 w-4 mr-2" />}
            {isLoggingOut ? 'Saindo...' : 'Sair e voltar ao login'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
