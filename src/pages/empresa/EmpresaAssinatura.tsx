import { useEffect, useState } from 'react';
import { ImobiliariaLayout } from '@/components/layouts/ImobiliariaLayout';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { 
  CreditCard, 
  Check, 
  Loader2, 
  Users, 
  FileText, 
  Building2, 
  Home,
  AlertCircle,
  Calendar,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  corretores: number;
  fichasMes: number;
  clientes: number;
  imoveis: number;
}

export default function EmpresaAssinatura() {
  const { imobiliariaId, assinatura, imobiliaria, refetch } = useUserRole();
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!imobiliariaId) return;

      try {
        // Fetch all plans
        const { data: planosData } = await supabase
          .from('planos')
          .select('*')
          .eq('ativo', true)
          .order('valor_mensal', { ascending: true });

        setPlanos(planosData || []);

        // Fetch usage stats
        const { count: corretores } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .eq('imobiliaria_id', imobiliariaId);

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count: fichasMes } = await supabase
          .from('fichas_visita')
          .select('*', { count: 'exact', head: true })
          .eq('imobiliaria_id', imobiliariaId)
          .gte('created_at', startOfMonth.toISOString());

        const { count: clientes } = await supabase
          .from('clientes')
          .select('*', { count: 'exact', head: true })
          .eq('imobiliaria_id', imobiliariaId);

        const { count: imoveis } = await supabase
          .from('imoveis')
          .select('*', { count: 'exact', head: true })
          .eq('imobiliaria_id', imobiliariaId);

        setUsage({
          corretores: corretores || 0,
          fichasMes: fichasMes || 0,
          clientes: clientes || 0,
          imoveis: imoveis || 0,
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [imobiliariaId]);

  async function handleSubscribe(planoId: string) {
    if (!imobiliariaId) return;
    
    setSubscribing(planoId);

    try {
      const { data, error } = await supabase.functions.invoke('asaas-payment-link', {
        body: { planoId, imobiliariaId },
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
  }

  const currentPlano = assinatura?.plano;

  const statusColors: Record<string, string> = {
    ativa: 'bg-success text-success-foreground',
    trial: 'bg-warning text-warning-foreground',
    pendente: 'bg-warning text-warning-foreground',
    suspensa: 'bg-destructive text-destructive-foreground',
    cancelada: 'bg-muted text-muted-foreground',
  };

  const statusLabels: Record<string, string> = {
    ativa: 'Ativa',
    trial: 'Período de Teste',
    pendente: 'Aguardando Pagamento',
    suspensa: 'Suspensa',
    cancelada: 'Cancelada',
  };

  if (loading) {
    return (
      <ImobiliariaLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ImobiliariaLayout>
    );
  }

  return (
    <ImobiliariaLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Assinatura</h1>
          <p className="text-muted-foreground">Gerencie seu plano e acompanhe o uso</p>
        </div>

        {/* Current subscription status */}
        {assinatura && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Sua Assinatura
                </CardTitle>
                <Badge className={statusColors[assinatura.status]}>
                  {statusLabels[assinatura.status] || assinatura.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {assinatura.status === 'suspensa' && (
                <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">Assinatura Suspensa</p>
                    <p className="text-sm text-muted-foreground">
                      Sua assinatura está suspensa por inadimplência. Regularize o pagamento para continuar usando todos os recursos.
                    </p>
                  </div>
                </div>
              )}

              {assinatura.status === 'pendente' && (
                <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-lg">
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
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Plano atual</p>
                  <p className="font-medium text-lg">{currentPlano?.nome}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Valor mensal</p>
                  <p className="font-medium text-lg">
                    R$ {currentPlano?.valor_mensal.toFixed(2).replace('.', ',')}
                  </p>
                </div>
                {assinatura.proxima_cobranca && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Próxima cobrança</p>
                    <p className="font-medium text-lg flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(assinatura.proxima_cobranca), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}
              </div>

              {/* Usage stats */}
              {currentPlano && usage && (
                <div className="pt-4 border-t border-border space-y-4">
                  <h4 className="font-medium">Uso do Plano</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          Corretores
                        </span>
                        <span>{usage.corretores} / {currentPlano.max_corretores}</span>
                      </div>
                      <Progress value={(usage.corretores / currentPlano.max_corretores) * 100} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          Fichas/Mês
                        </span>
                        <span>{usage.fichasMes} / {currentPlano.max_fichas_mes}</span>
                      </div>
                      <Progress value={(usage.fichasMes / currentPlano.max_fichas_mes) * 100} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          Clientes
                        </span>
                        <span>{usage.clientes} / {currentPlano.max_clientes}</span>
                      </div>
                      <Progress value={(usage.clientes / currentPlano.max_clientes) * 100} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-muted-foreground" />
                          Imóveis
                        </span>
                        <span>{usage.imoveis} / {currentPlano.max_imoveis}</span>
                      </div>
                      <Progress value={(usage.imoveis / currentPlano.max_imoveis) * 100} className="h-2" />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Available plans */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            {assinatura ? 'Alterar Plano' : 'Escolha um Plano'}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {planos.map((plano) => {
              const isCurrentPlan = currentPlano?.id === plano.id;
              const isSubscribing = subscribing === plano.id;
              const isFreePlan = plano.nome.toLowerCase() === 'gratuito' || (plano.valor_mensal === 0 && plano.nome.toLowerCase() !== 'enterprise');
              
              return (
                <Card 
                  key={plano.id} 
                  className={`relative overflow-hidden ${
                    isCurrentPlan 
                      ? 'border-primary ring-2 ring-primary/20' 
                      : isFreePlan 
                        ? 'border-emerald-500/50 bg-gradient-to-b from-emerald-50/50 to-transparent dark:from-emerald-950/20 dark:to-transparent' 
                        : ''
                  }`}
                >
                  {isFreePlan && !isCurrentPlan && (
                    <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500 text-white text-xs font-medium rounded-bl-lg flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Comece Grátis
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className={isFreePlan ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                        {plano.nome}
                      </CardTitle>
                      {isCurrentPlan && (
                        <Badge variant="outline" className="border-primary text-primary">
                          Atual
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{plano.descricao}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className={`text-3xl font-bold ${isFreePlan ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary'}`}>
                      {isFreePlan ? (
                        <>
                          Grátis
                          <span className="text-sm font-normal text-muted-foreground ml-1">para sempre</span>
                        </>
                      ) : plano.valor_mensal === 0 ? (
                        'Sob consulta'
                      ) : (
                        <>
                          R$ {plano.valor_mensal.toFixed(2).replace('.', ',')}
                          <span className="text-sm font-normal text-muted-foreground">/mês</span>
                        </>
                      )}
                    </div>

                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className={`h-4 w-4 ${isFreePlan ? 'text-emerald-500' : 'text-success'}`} />
                        {plano.max_corretores === 999 ? 'Corretores ilimitados' : `Até ${plano.max_corretores} corretores`}
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className={`h-4 w-4 ${isFreePlan ? 'text-emerald-500' : 'text-success'}`} />
                        {plano.max_fichas_mes >= 99999 ? 'Fichas ilimitadas' : `${plano.max_fichas_mes} fichas/mês`}
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className={`h-4 w-4 ${isFreePlan ? 'text-emerald-500' : 'text-success'}`} />
                        {plano.max_clientes >= 99999 ? 'Clientes ilimitados' : `${plano.max_clientes} clientes`}
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className={`h-4 w-4 ${isFreePlan ? 'text-emerald-500' : 'text-success'}`} />
                        {plano.max_imoveis >= 99999 ? 'Imóveis ilimitados' : `${plano.max_imoveis} imóveis`}
                      </li>
                    </ul>

                    {isFreePlan ? (
                      <Button 
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white" 
                        disabled={isCurrentPlan}
                        onClick={() => !isCurrentPlan && handleSubscribe(plano.id)}
                      >
                        {isCurrentPlan ? 'Plano Atual' : 'Começar Grátis'}
                      </Button>
                    ) : plano.valor_mensal > 0 ? (
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
                    ) : (
                      <Button 
                        className="w-full" 
                        variant="outline"
                        asChild
                      >
                        <a href="mailto:contato@visitasegura.com">
                          Entrar em Contato
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
          <p className="font-medium mb-2">Formas de pagamento aceitas:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Pix (confirmação instantânea)</li>
            <li>Boleto bancário (até 3 dias úteis)</li>
            <li>Cartão de crédito (recorrência automática)</li>
          </ul>
        </div>

        <p className="text-sm text-center text-muted-foreground">
          Precisa de um plano personalizado?{' '}
          <a href="mailto:contato@visitasegura.com" className="text-primary hover:underline">
            Entre em contato
          </a>
        </p>
      </div>
    </ImobiliariaLayout>
  );
}
