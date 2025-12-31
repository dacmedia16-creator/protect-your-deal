import { useState, useEffect } from 'react';
import { ImobiliariaLayout } from '@/components/layouts/ImobiliariaLayout';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { useModuloAvancado } from '@/hooks/useModuloAvancado';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Sparkles,
  Calendar,
  Copy,
  BarChart3,
  History,
  Search,
  Bell,
  Share2,
  Check,
  Loader2,
  CreditCard,
  Zap,
  Shield,
  ArrowRight,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface Modulo {
  id: string;
  nome: string;
  codigo: string;
  descricao: string | null;
  valor_mensal: number;
  recursos: string[];
}

interface Contratacao {
  id: string;
  status: string;
  data_inicio: string;
  data_fim: string | null;
}

const recursosDetalhados = [
  {
    codigo: 'agenda_pro',
    icon: Calendar,
    titulo: 'Agenda Pro',
    descricao: 'Calendário visual com todas suas visitas agendadas. Visualize por dia, semana ou mês.',
  },
  {
    codigo: 'duplicar_ficha',
    icon: Copy,
    titulo: 'Duplicação de Fichas',
    descricao: 'Clone fichas existentes para novas visitas no mesmo imóvel ou com o mesmo cliente.',
  },
  {
    codigo: 'dashboard_insights',
    icon: BarChart3,
    titulo: 'Dashboard com Insights',
    descricao: 'Estatísticas avançadas, tendências e análises de desempenho da sua equipe.',
  },
  {
    codigo: 'historico_imovel',
    icon: History,
    titulo: 'Histórico por Imóvel',
    descricao: 'Veja todas as visitas anteriores de cada imóvel em uma timeline organizada.',
  },
  {
    codigo: 'busca_avancada',
    icon: Search,
    titulo: 'Busca Avançada',
    descricao: 'Encontre fichas, clientes e imóveis rapidamente com filtros inteligentes.',
  },
  {
    codigo: 'followup_auto',
    icon: Bell,
    titulo: 'Follow-up Automático',
    descricao: 'Lembretes automáticos para acompanhar clientes após as visitas.',
  },
  {
    codigo: 'compartilhamento_rapido',
    icon: Share2,
    titulo: 'Compartilhamento Rápido',
    descricao: 'Envie comprovantes por WhatsApp e email com um clique.',
  },
];

export default function EmpresaModuloAvancado() {
  const { toast } = useToast();
  const { imobiliariaId } = useUserRole();
  const { temModuloAvancado, modulo: moduloAtivo, contratacao, loading: loadingModulo } = useModuloAvancado();
  
  const [modulo, setModulo] = useState<Modulo | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    async function fetchModulo() {
      const { data, error } = await supabase
        .from('modulos')
        .select('*')
        .eq('codigo', 'avancado')
        .eq('ativo', true)
        .single();

      if (!error && data) {
        setModulo({
          ...data,
          valor_mensal: Number(data.valor_mensal),
          recursos: Array.isArray(data.recursos) ? data.recursos as string[] : []
        });
      }
      setLoading(false);
    }

    fetchModulo();
  }, []);

  const handleSubscribe = async () => {
    if (!modulo || !imobiliariaId) return;

    setSubscribing(true);
    try {
      const { data, error } = await supabase.functions.invoke('asaas-modulo-subscription', {
        body: {
          moduloId: modulo.id,
          imobiliariaId: imobiliariaId,
        },
      });

      if (error) throw error;

      if (data?.paymentLinkUrl) {
        toast({
          title: 'Redirecionando para pagamento',
          description: 'Você será redirecionado para a página de pagamento.',
        });
        window.open(data.paymentLinkUrl, '_blank');
      }
    } catch (error) {
      console.error('Erro ao contratar módulo:', error);
      toast({
        title: 'Erro ao contratar',
        description: 'Não foi possível gerar o link de pagamento. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSubscribing(false);
    }
  };

  const handleCancel = async () => {
    if (!contratacao) return;

    setCanceling(true);
    try {
      const { error } = await supabase
        .from('modulos_contratados')
        .update({ status: 'cancelado', data_fim: new Date().toISOString().split('T')[0] })
        .eq('id', contratacao.id);

      if (error) throw error;

      toast({
        title: 'Módulo cancelado',
        description: 'O Módulo Avançado foi cancelado com sucesso.',
      });

      window.location.reload();
    } catch (error) {
      console.error('Erro ao cancelar módulo:', error);
      toast({
        title: 'Erro ao cancelar',
        description: 'Não foi possível cancelar o módulo. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setCanceling(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading || loadingModulo) {
    return (
      <ImobiliariaLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ImobiliariaLayout>
    );
  }

  if (!modulo) {
    return (
      <ImobiliariaLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Módulo não disponível no momento.</p>
        </div>
      </ImobiliariaLayout>
    );
  }

  return (
    <ImobiliariaLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold font-display">Módulo Avançado</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {modulo.descricao}
          </p>
        </div>

        {/* Status atual */}
        {temModuloAvancado && contratacao && (
          <Card className="border-success/50 bg-success/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-full bg-success/20">
                    <CheckCircle2 className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Módulo Ativo</h3>
                    <p className="text-sm text-muted-foreground">
                      Ativo desde {new Date(contratacao.data_inicio).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <Badge variant="default" className="bg-success text-success-foreground">
                  Ativo
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preço e CTA */}
        {!temModuloAvancado && (
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-8 text-center space-y-6">
              <div>
                <div className="text-4xl font-bold text-primary">
                  {formatCurrency(modulo.valor_mensal)}
                  <span className="text-lg font-normal text-muted-foreground">/mês</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Cobrado mensalmente • Cancele quando quiser
                </p>
              </div>

              <Button 
                size="lg" 
                className="w-full max-w-xs text-lg py-6"
                onClick={handleSubscribe}
                disabled={subscribing}
              >
                {subscribing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5 mr-2" />
                    Contratar Agora
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Pagamento seguro
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  PIX, Cartão ou Boleto
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de recursos */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">O que está incluso</h2>
          
          <div className="grid gap-4">
            {recursosDetalhados.map((recurso) => {
              const Icon = recurso.icon;
              const isIncluded = modulo.recursos.includes(recurso.codigo);
              
              return (
                <Card key={recurso.codigo} className={!isIncluded ? 'opacity-50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{recurso.titulo}</h3>
                          {isIncluded && (
                            <Check className="h-4 w-4 text-success" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {recurso.descricao}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Formas de pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Formas de Pagamento</CardTitle>
            <CardDescription>
              Aceite variado para sua conveniência
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-2xl mb-2">💳</div>
                <p className="font-medium text-sm">Cartão</p>
                <p className="text-xs text-muted-foreground">Crédito em até 12x</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-2xl mb-2">📱</div>
                <p className="font-medium text-sm">PIX</p>
                <p className="text-xs text-muted-foreground">Aprovação imediata</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-2xl mb-2">📄</div>
                <p className="font-medium text-sm">Boleto</p>
                <p className="text-xs text-muted-foreground">Vence em 3 dias</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cancelar módulo */}
        {temModuloAvancado && contratacao && (
          <Card className="border-destructive/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Cancelar Módulo</h3>
                  <p className="text-sm text-muted-foreground">
                    Você pode cancelar a qualquer momento
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={handleCancel}
                  disabled={canceling}
                >
                  {canceling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancelar
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ImobiliariaLayout>
  );
}
