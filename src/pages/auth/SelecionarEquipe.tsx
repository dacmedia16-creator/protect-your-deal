import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Users, Check, ArrowRight } from 'lucide-react';
import { LogoIcon } from '@/components/LogoIcon';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Equipe {
  id: string;
  nome: string;
  cor: string;
  descricao: string | null;
}

export default function SelecionarEquipe() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  
  const imobiliariaId = searchParams.get('imobiliaria_id');
  const imobiliariaNome = searchParams.get('imobiliaria');
  
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEquipe, setSelectedEquipe] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch equipes da imobiliária
  useEffect(() => {
    async function fetchEquipes() {
      if (!imobiliariaId) {
        // Se não tiver imobiliaria_id, redirecionar para cadastro concluído
        navigate(`/cadastro-concluido?vinculado=true&imobiliaria=${encodeURIComponent(imobiliariaNome || '')}`);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('equipes')
          .select('id, nome, cor, descricao')
          .eq('imobiliaria_id', imobiliariaId)
          .eq('ativa', true)
          .order('nome');

        if (error) throw error;

        if (!data || data.length === 0) {
          // Se não houver equipes, pular para cadastro concluído
          navigate(`/cadastro-concluido?vinculado=true&imobiliaria=${encodeURIComponent(imobiliariaNome || '')}`);
          return;
        }

        setEquipes(data);
      } catch (error) {
        console.error('Error fetching equipes:', error);
        toast.error('Erro ao carregar equipes');
        navigate(`/cadastro-concluido?vinculado=true&imobiliaria=${encodeURIComponent(imobiliariaNome || '')}`);
      } finally {
        setLoading(false);
      }
    }

    fetchEquipes();
  }, [imobiliariaId, imobiliariaNome, navigate]);

  async function handleConfirmar() {
    if (!selectedEquipe || !user?.id) {
      toast.error('Selecione uma equipe');
      return;
    }

    setSubmitting(true);
    try {
      // Inserir na tabela equipes_membros
      const { error } = await supabase
        .from('equipes_membros')
        .insert({
          equipe_id: selectedEquipe,
          user_id: user.id,
          cargo: 'corretor',
        });

      if (error) {
        // Se já estiver na equipe, ignorar o erro
        if (error.code === '23505') {
          console.log('Usuário já está na equipe');
        } else {
          throw error;
        }
      }

      toast.success('Equipe selecionada com sucesso!');
      navigate(`/cadastro-concluido?vinculado=true&imobiliaria=${encodeURIComponent(imobiliariaNome || '')}`);
    } catch (error: any) {
      console.error('Error joining team:', error);
      toast.error('Erro ao entrar na equipe. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <LogoIcon size={32} />
          <span className="font-display font-bold text-2xl">VisitaProva</span>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Escolha sua equipe</span>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Selecione sua Equipe</CardTitle>
            <CardDescription>
              Escolha a equipe da qual você fará parte na imobiliária{' '}
              <span className="font-medium text-foreground">{imobiliariaNome}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Grid de equipes */}
            <div className="grid gap-3">
              {equipes.map((equipe) => (
                <button
                  key={equipe.id}
                  type="button"
                  onClick={() => setSelectedEquipe(equipe.id)}
                  className={cn(
                    "w-full p-4 rounded-lg border-2 text-left transition-all",
                    "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50",
                    selectedEquipe === equipe.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* Cor da equipe */}
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: equipe.cor }}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{equipe.nome}</span>
                        {selectedEquipe === equipe.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      {equipe.descricao && (
                        <p className="text-sm text-muted-foreground truncate">
                          {equipe.descricao}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Botão confirmar */}
            <Button
              onClick={handleConfirmar}
              disabled={!selectedEquipe || submitting}
              className="w-full mt-6"
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirmando...
                </>
              ) : (
                <>
                  Confirmar Equipe
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
