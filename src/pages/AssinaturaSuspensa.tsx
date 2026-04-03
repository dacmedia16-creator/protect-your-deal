import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CreditCard, ArrowLeft, Phone, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

export default function AssinaturaSuspensa() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { role, imobiliaria, assinatura, construtora } = useUserRole();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Detect if this is an expired trial
  const isExpiredTrial = assinatura?.data_fim && new Date(assinatura.data_fim + 'T23:59:59') < new Date();

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
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-heading">Assinatura Suspensa</CardTitle>
          <CardDescription className="text-base">
            {imobiliaria ? (
              <>A assinatura da imobiliária <strong>{imobiliaria.nome}</strong> está inativa.</>
            ) : (
              'Sua assinatura está inativa ou foi cancelada.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Para continuar utilizando o sistema, entre em contato com o administrador 
            da sua imobiliária ou regularize sua assinatura.
          </p>

          <div className="space-y-2">
            {role === 'imobiliaria_admin' && (
              <Button asChild className="w-full">
                <Link to="/empresa/assinatura">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Gerenciar Assinatura
                </Link>
              </Button>
            )}
            
            <Button variant="outline" className="w-full" asChild>
              <a href="mailto:suporte@visitaprova.com.br">
                <Phone className="h-4 w-4 mr-2" />
                Contatar Suporte
              </a>
            </Button>
            
            <Button variant="ghost" className="w-full" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowLeft className="h-4 w-4 mr-2" />}
              {isLoggingOut ? 'Saindo...' : 'Sair da Conta'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
