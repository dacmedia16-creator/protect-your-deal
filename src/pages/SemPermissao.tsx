import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, LogOut, Mail } from 'lucide-react';

export default function SemPermissao() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
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
            Sua conta ainda não possui permissões de acesso. Isso pode acontecer se:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair e voltar ao login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
