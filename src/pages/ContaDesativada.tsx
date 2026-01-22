import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserX, LogOut, Mail, Loader2 } from 'lucide-react';

export default function ContaDesativada() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <UserX className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">Conta Desativada</CardTitle>
          <CardDescription>
            Sua conta foi desativada e você não pode acessar o sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            <p className="font-medium mb-2">Possíveis motivos:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Solicitação do administrador da imobiliária</li>
              <li>Violação dos termos de uso</li>
              <li>Conta inativa por período prolongado</li>
              <li>Questões administrativas pendentes</li>
            </ul>
          </div>

          <div className="rounded-lg border p-4 text-sm">
            <p className="font-medium mb-2">Precisa de ajuda?</p>
            <p className="text-muted-foreground mb-3">
              Entre em contato com o suporte para mais informações sobre sua conta.
            </p>
            <a 
              href="mailto:suporte@fichavisita.com.br?subject=Conta Desativada - Solicitação de Suporte"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <Mail className="h-4 w-4" />
              suporte@fichavisita.com.br
            </a>
          </div>

          <Button 
            onClick={handleLogout} 
            variant="outline" 
            className="w-full"
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
