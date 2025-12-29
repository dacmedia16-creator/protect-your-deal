import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const AceitarTermos = () => {
  const [aceito, setAceito] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
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

      // Redirect to dashboard
      navigate('/dashboard', { replace: true });
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
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-heading">Termos de Uso</CardTitle>
          <CardDescription>
            Antes de continuar, você precisa ler e aceitar nossos Termos de Uso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary of Terms */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
            <h3 className="font-semibold text-foreground">Resumo dos principais pontos:</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-2">
                <span>•</span>
                <span>O VisitaSegura é uma ferramenta tecnológica para registro de visitas imobiliárias</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Os documentos gerados constituem meio de prova</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>O usuário é responsável pelas informações inseridas</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>A plataforma não substitui advogados ou corretores</span>
              </li>
              <li className="flex gap-2">
                <span>•</span>
                <span>Foro: Comarca de Sorocaba/SP</span>
              </li>
            </ul>
          </div>

          {/* Link to full terms */}
          <div className="text-center">
            <Button variant="link" asChild className="text-primary">
              <Link to="/termos-de-uso" target="_blank">
                <FileText className="h-4 w-4 mr-2" />
                Ler os Termos de Uso completos
              </Link>
            </Button>
          </div>

          {/* Checkbox */}
          <div className="flex items-start space-x-3 border border-border rounded-lg p-4">
            <Checkbox 
              id="aceito" 
              checked={aceito} 
              onCheckedChange={(checked) => setAceito(checked === true)}
            />
            <Label htmlFor="aceito" className="text-sm leading-relaxed cursor-pointer">
              Li e concordo com os{' '}
              <Link 
                to="/termos-de-uso" 
                target="_blank" 
                className="text-primary hover:underline"
              >
                Termos de Uso
              </Link>{' '}
              da plataforma VisitaSegura
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
