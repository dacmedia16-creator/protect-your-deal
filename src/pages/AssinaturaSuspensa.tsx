import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CreditCard, ArrowLeft, Phone } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

export default function AssinaturaSuspensa() {
  const { signOut } = useAuth();
  const { role, imobiliaria } = useUserRole();

  const handleLogout = async () => {
    await signOut();
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
            
            <Button variant="ghost" className="w-full" onClick={handleLogout}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Sair da Conta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
