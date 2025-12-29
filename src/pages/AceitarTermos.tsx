import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { getRedirectPathByRole } from '@/lib/roleRedirect';
import { supabase } from '@/integrations/supabase/client';

const AceitarTermos = () => {
  const [aceito, setAceito] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { role } = useUserRole();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAceitar = async () => {
    if (!aceito) {
      toast({
        title: "Aceite obrigatório",
        description: "Você precisa aceitar os Termos de Uso para continuar.",
        variant: "destructive",
      });
      return;
    }

    if (!user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ termos_aceitos_em: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Termos aceitos",
        description: "Obrigado por aceitar os Termos de Uso.",
      });

      // Redirect based on user role
      const redirectPath = getRedirectPathByRole(role);
      navigate(redirectPath, { replace: true });
    } catch (error) {
      console.error('Erro ao aceitar termos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar o aceite. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center pb-4 sm:pb-6">
          <div className="flex justify-center mb-3 sm:mb-4">
            <Shield className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-heading">Termos de Uso</CardTitle>
          <CardDescription className="text-sm">
            <span className="hidden sm:inline">Antes de continuar, você precisa ler e aceitar nossos Termos de Uso</span>
            <span className="sm:hidden">Aceite os Termos para continuar</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Summary of Terms */}
          <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3 text-xs sm:text-sm">
            <h3 className="font-semibold text-foreground text-sm sm:text-base">
              <span className="hidden sm:inline">Resumo dos principais pontos:</span>
              <span className="sm:hidden">Resumo:</span>
            </h3>
            <ul className="space-y-1.5 sm:space-y-2 text-muted-foreground">
              <li className="flex gap-2">
                <span>•</span>
                <span>
                  <span className="hidden sm:inline">O VisitaSegura é uma ferramenta tecnológica para registro de visitas imobiliárias</span>
                  <span className="sm:hidden">Ferramenta para registro de visitas</span>
                </span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>
                  <span className="hidden sm:inline">Os documentos gerados constituem meio de prova</span>
                  <span className="sm:hidden">Documentos como prova</span>
                </span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>
                  <span className="hidden sm:inline">O usuário é responsável pelas informações inseridas</span>
                  <span className="sm:hidden">Você é responsável pelos dados</span>
                </span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>
                  <span className="hidden sm:inline">A plataforma não substitui advogados ou corretores</span>
                  <span className="sm:hidden">Não substitui advogados</span>
                </span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Foro: Sorocaba/SP</span>
              </li>
            </ul>
          </div>

          {/* Links to full terms */}
          <div className="flex flex-row items-center justify-center gap-1 sm:gap-2">
            <Button variant="link" asChild className="text-primary text-xs sm:text-sm px-2 sm:px-4">
              <Link to="/termos-de-uso" target="_blank">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Termos de Uso</span>
                <span className="sm:hidden">Termos</span>
              </Link>
            </Button>
            <span className="text-muted-foreground text-xs">•</span>
            <Button variant="link" asChild className="text-primary text-xs sm:text-sm px-2 sm:px-4">
              <Link to="/politica-privacidade" target="_blank">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Política de Responsabilidade</span>
                <span className="sm:hidden">Política</span>
              </Link>
            </Button>
          </div>

          {/* Checkbox */}
          <div className="flex items-start space-x-2 sm:space-x-3 border border-border rounded-lg p-3 sm:p-4">
            <Checkbox 
              id="aceito" 
              checked={aceito} 
              onCheckedChange={(checked) => setAceito(checked === true)}
              className="mt-0.5"
            />
            <Label htmlFor="aceito" className="text-xs sm:text-sm leading-relaxed cursor-pointer">
              <span className="hidden sm:inline">
                Li e concordo com os{' '}
                <Link 
                  to="/termos-de-uso" 
                  target="_blank" 
                  className="text-primary hover:underline"
                >
                  Termos de Uso
                </Link>{' '}
                e a{' '}
                <Link 
                  to="/politica-privacidade" 
                  target="_blank" 
                  className="text-primary hover:underline"
                >
                  Política de Responsabilidade
                </Link>{' '}
                da plataforma VisitaSegura
              </span>
              <span className="sm:hidden">
                Aceito os{' '}
                <Link 
                  to="/termos-de-uso" 
                  target="_blank" 
                  className="text-primary hover:underline"
                >
                  Termos
                </Link>{' '}
                e{' '}
                <Link 
                  to="/politica-privacidade" 
                  target="_blank" 
                  className="text-primary hover:underline"
                >
                  Política
                </Link>
              </span>
            </Label>
          </div>

          {/* Submit Button */}
          <Button 
            className="w-full" 
            onClick={handleAceitar} 
            disabled={!aceito || submitting}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Aceitar e Continuar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AceitarTermos;
