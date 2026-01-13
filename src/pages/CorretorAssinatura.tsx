import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import { useAssinaturaNotification } from '@/hooks/useAssinaturaNotification';
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
  Loader2,
  ExternalLink,
  QrCode,
  Receipt
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
  useAssinaturaNotification();
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

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

        // Reordenar: Enterprise vai para o final
        const planosOrdenados = (planosData || []).sort((a, b) => {
          const aIsEnterprise = a.nome.toLowerCase() === 'enterprise';
          const bIsEnterprise = b.nome.toLowerCase() === 'enterprise';
          if (aIsEnterprise && !bIsEnterprise) return 1;
          if (!aIsEnterprise && bIsEnterprise) return -1;
          return a.valor_mensal - b.valor_mensal;
        });
        setPlanos(planosOrdenados);

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

  const handleSubscribe = async (planoId: string) => {
    if (!user) return;
    setSubscribing(planoId);

    try {
      const { data, error } = await supabase.functions.invoke('asaas-payment-link', {
        body: { planoId },
      });

      if (error) throw error;

      if (data?.paymentLinkUrl) {
        window.open(data.paymentLinkUrl, '_blank');
        toast.success('Link de pagamento aberto!', {
          description: 'Complete o pagamento para ativar sua assinatura.',
          duration: 5000,
        });
      } else if (data?.error) {
        throw new Error(data.error);
      } else {
        throw new Error('Link de pagamento não gerado');
      }
    } catch (error: any) {
      console.error('Error subscribing:', error);
      
      const errorMessage = error.message || 'Erro desconhecido ao gerar link de pagamento';
      
      toast.error('Erro ao gerar link de pagamento', {
        description: errorMessage,
        duration: 10000,
        action: {
          label: 'Tentar novamente',
          onClick: () => handleSubscribe(planoId),
        },
      });
    } finally {
      setSubscribing(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const statusColors: Record<string, string> = {
    ativa: 'bg-success/10 text-success border-success/30',
    pendente: 'bg-warning/10 text-warning border-warning/30',
    suspensa: 'bg-destructive/10 text-destructive border-destructive/30',
    cancelada: 'bg-muted text-muted-foreground border-muted',
  };

  const statusLabels: Record<string, string> = {
    ativa: 'Ativa',
    pendente: 'Aguardando Pagamento',
    suspensa: 'Suspensa',
    cancelada: 'Cancelada',
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
                        ? `Status: ${statusLabels[assinatura.status] || assinatura.status}` 
                        : 'Escolha um plano para começar'}
                    </CardDescription>
                  </div>
                </div>
                {assinatura && (
                  <Badge variant="outline" className={statusColors[assinatura.status]}>
                    {assinatura.status === 'ativa' ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertCircle className="h-3 w-3 mr-1" />
                    )}
                    {statusLabels[assinatura.status] || assinatura.status}
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            {assinatura?.plano && usage && (
              <CardContent className="space-y-4">
                {assinatura.status === 'pendente' && (
                  <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-lg mb-4">
                    <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-warning">Aguardando Pagamento</p>
                      <p className="text-sm text-muted-foreground">
                        Seu pagamento está sendo processado. Assim que confirmado, sua assinatura será ativada automaticamente.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        Registros/mês
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
                const isSubscribing = subscribing === plano.id;
                
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
                          {plano.max_fichas_mes} registros/mês
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
                        disabled={isCurrentPlan || isSubscribing}
                        onClick={() => handleSubscribe(plano.id)}
                      >
                        {isSubscribing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Gerando link...
                          </>
                        ) : isCurrentPlan ? (
                          'Plano Atual'
                        ) : (
                          <>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Assinar Plano
                          </>
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

          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground mt-6">
            <p className="font-medium mb-3">Formas de pagamento aceitas:</p>
            <div className="flex flex-wrap gap-4">
              <span className="flex items-center gap-2 bg-background rounded-lg px-3 py-2 border">
                <QrCode className="h-5 w-5 text-primary" />
                <div>
                  <span className="font-medium text-foreground">PIX</span>
                  <p className="text-xs">Confirmação instantânea</p>
                </div>
              </span>
              <span className="flex items-center gap-2 bg-background rounded-lg px-3 py-2 border">
                <CreditCard className="h-5 w-5 text-primary" />
                <div>
                  <span className="font-medium text-foreground">Cartão</span>
                  <p className="text-xs">Recorrência automática</p>
                </div>
              </span>
              <span className="flex items-center gap-2 bg-background rounded-lg px-3 py-2 border">
                <Receipt className="h-5 w-5 text-primary" />
                <div>
                  <span className="font-medium text-foreground">Boleto</span>
                  <p className="text-xs">Até 3 dias úteis</p>
                </div>
              </span>
            </div>
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
