import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { MobileNav } from '@/components/MobileNav';
import { DesktopNav } from '@/components/DesktopNav';
import { 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  FileText,
  Users,
  Home,
  Loader2
} from 'lucide-react';

interface Plano {
  id: string;
  nome: string;
  descricao: string | null;
  max_corretores: number;
  max_fichas_mes: number;
  max_clientes: number;
  max_imoveis: number;
  valor_mensal: number;
}

interface UsageStats {
  fichas_mes: number;
  clientes: number;
  imoveis: number;
}

export default function CorretorAssinatura() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { assinatura, role, imobiliariaId, refetch } = useUserRole();
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);

  // Redirecionar se não for corretor autônomo
  useEffect(() => {
    if (role && (role !== 'corretor' || imobiliariaId)) {
      navigate('/dashboard');
    }
  }, [role, imobiliariaId, navigate]);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      try {
        // Fetch planos ativos
        const { data: planosData } = await supabase
          .from('planos')
          .select('*')
          .eq('ativo', true)
          .order('valor_mensal');

        setPlanos(planosData || []);

        // Fetch usage stats
        const currentMonth = new Date();
        const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        
        const [fichasRes, clientesRes, imoveisRes] = await Promise.all([
          supabase
            .from('fichas_visita')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', firstDay.toISOString()),
          supabase
            .from('clientes')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
          supabase
            .from('imoveis')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
        ]);

        setUsage({
          fichas_mes: fichasRes.count || 0,
          clientes: clientesRes.count || 0,
          imoveis: imoveisRes.count || 0,
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  const handleChangePlan = async (planoId: string) => {
    if (!user) return;
    setChanging(true);

    try {
      if (assinatura) {
        // Atualizar assinatura existente
        const { error } = await supabase
          .from('assinaturas')
          .update({ plano_id: planoId })
          .eq('id', assinatura.id);

        if (error) throw error;
      } else {
        // Criar nova assinatura para corretor autônomo
        const { error } = await supabase
          .from('assinaturas')
          .insert({
            user_id: user.id,
            plano_id: planoId,
            status: 'ativa',
            data_inicio: new Date().toISOString().split('T')[0],
          });

        if (error) throw error;
      }

      toast.success('Plano atualizado com sucesso!');
      await refetch();
    } catch (error: any) {
      console.error('Error changing plan:', error);
      toast.error(error.message || 'Erro ao alterar plano');
    } finally {
      setChanging(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DesktopNav />
        <main className="container mx-auto px-4 py-6 pb-24 sm:pb-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-48 w-full" />
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          </div>
        </main>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DesktopNav />
      
      <main className="container mx-auto px-4 py-6 pb-24 sm:pb-6">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <h1 className="text-2xl font-display font-bold mb-6">Minha Assinatura</h1>

          {/* Status atual */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>
                      {assinatura?.plano?.nome || 'Sem Plano Ativo'}
                    </CardTitle>
                    <CardDescription>
                      {assinatura 
                        ? `Status: ${assinatura.status}` 
                        : 'Escolha um plano para começar'}
                    </CardDescription>
                  </div>
                </div>
                {assinatura && (
                  <Badge 
                    variant="outline" 
                    className={
                      assinatura.status === 'ativa' 
                        ? 'bg-success/10 text-success border-success/30' 
                        : 'bg-warning/10 text-warning border-warning/30'
                    }
                  >
                    {assinatura.status === 'ativa' ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertCircle className="h-3 w-3 mr-1" />
                    )}
                    {assinatura.status}
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            {assinatura?.plano && usage && (
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        Fichas/mês
                      </span>
                      <span className="font-medium">
                        {usage.fichas_mes} / {assinatura.plano.max_fichas_mes}
                      </span>
                    </div>
                    <Progress 
                      value={(usage.fichas_mes / assinatura.plano.max_fichas_mes) * 100} 
                      className="h-2"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        Clientes
                      </span>
                      <span className="font-medium">
                        {usage.clientes} / {assinatura.plano.max_clientes}
                      </span>
                    </div>
                    <Progress 
                      value={(usage.clientes / assinatura.plano.max_clientes) * 100} 
                      className="h-2"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Home className="h-4 w-4" />
                        Imóveis
                      </span>
                      <span className="font-medium">
                        {usage.imoveis} / {assinatura.plano.max_imoveis}
                      </span>
                    </div>
                    <Progress 
                      value={(usage.imoveis / assinatura.plano.max_imoveis) * 100} 
                      className="h-2"
                    />
                  </div>
                </div>

                {assinatura.proxima_cobranca && (
                  <p className="text-sm text-muted-foreground">
                    Próxima cobrança: {new Date(assinatura.proxima_cobranca).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </CardContent>
            )}
          </Card>

          {/* Planos disponíveis */}
          <h2 className="text-lg font-semibold mb-4">Planos Disponíveis</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {planos
              .filter(plano => plano.max_corretores === 1) // Mostrar apenas planos individuais
              .map((plano) => {
                const isCurrentPlan = assinatura?.plano?.id === plano.id;
                
                return (
                  <Card 
                    key={plano.id} 
                    className={isCurrentPlan ? 'ring-2 ring-primary' : ''}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{plano.nome}</CardTitle>
                        {isCurrentPlan && (
                          <Badge variant="default">Atual</Badge>
                        )}
                      </div>
                      <CardDescription>{plano.descricao}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-3xl font-bold">
                        {formatCurrency(plano.valor_mensal)}
                        <span className="text-sm font-normal text-muted-foreground">/mês</span>
                      </div>
                      
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-success" />
                          {plano.max_fichas_mes} fichas/mês
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-success" />
                          {plano.max_clientes} clientes
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-success" />
                          {plano.max_imoveis} imóveis
                        </li>
                      </ul>

                      <Button 
                        className="w-full"
                        variant={isCurrentPlan ? 'outline' : 'default'}
                        disabled={isCurrentPlan || changing}
                        onClick={() => handleChangePlan(plano.id)}
                      >
                        {changing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isCurrentPlan ? (
                          'Plano Atual'
                        ) : (
                          'Selecionar Plano'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
          </div>

          {planos.filter(p => p.max_corretores === 1).length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhum plano individual disponível no momento.
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <MobileNav />
    </div>
  );
}