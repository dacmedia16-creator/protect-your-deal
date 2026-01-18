import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ImobiliariaLayout } from '@/components/layouts/ImobiliariaLayout';
import { useUserRole } from '@/hooks/useUserRole';
import { useFichaNotification } from '@/hooks/useFichaNotification';
import { useAssinaturaNotification } from '@/hooks/useAssinaturaNotification';
import { useImobiliariaFeatureFlag } from '@/hooks/useImobiliariaFeatureFlag';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Users, FileText, Plus, ArrowRight, Loader2, AlertCircle, ClipboardCheck } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis } from 'recharts';

interface DashboardStats {
  totalCorretores: number;
  totalFichas: number;
  fichasMes: number;
  totalPesquisas: number;
  pesquisasRespondidas: number;
  pesquisasPendentes: number;
}

interface MonthlyData {
  month: string;
  fichas: number;
}

export default function EmpresaDashboard() {
  const { imobiliaria, assinatura, imobiliariaId } = useUserRole();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Hook para verificar se pesquisa pós-visita está habilitada
  const { enabled: surveyEnabled } = useImobiliariaFeatureFlag('post_visit_survey');

  // Hook de notificação para fichas confirmadas
  useFichaNotification();
  
  // Hook de notificação para mudanças de assinatura
  useAssinaturaNotification();

  useEffect(() => {
    async function fetchStats() {
      if (!imobiliariaId) return;

      try {
        // Count corretores
        const { count: totalCorretores } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .eq('imobiliaria_id', imobiliariaId);

        // Count fichas
        const { count: totalFichas } = await supabase
          .from('fichas_visita')
          .select('*', { count: 'exact', head: true })
          .eq('imobiliaria_id', imobiliariaId);

        // Count fichas this month
        const currentMonthStart = new Date();
        currentMonthStart.setDate(1);
        currentMonthStart.setHours(0, 0, 0, 0);
        
        const { count: fichasMes } = await supabase
          .from('fichas_visita')
          .select('*', { count: 'exact', head: true })
          .eq('imobiliaria_id', imobiliariaId)
          .gte('created_at', currentMonthStart.toISOString());

        // Fetch all fichas for monthly chart (last 6 months)
        const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
        const { data: fichasData } = await supabase
          .from('fichas_visita')
          .select('created_at')
          .eq('imobiliaria_id', imobiliariaId)
          .gte('created_at', sixMonthsAgo.toISOString());

        // Process monthly data
        const monthlyChartData = Array.from({ length: 6 }, (_, i) => {
          const date = subMonths(new Date(), 5 - i);
          const start = startOfMonth(date);
          const end = endOfMonth(date);
          
          const count = fichasData?.filter(f => {
            const createdAt = new Date(f.created_at);
            return createdAt >= start && createdAt <= end;
          }).length || 0;

          return {
            month: format(date, 'MMM', { locale: ptBR }),
            fichas: count,
          };
        });

        setMonthlyData(monthlyChartData);

        // Count surveys (only if feature is enabled)
        let totalPesquisas = 0;
        let pesquisasRespondidas = 0;
        let pesquisasPendentes = 0;

        if (surveyEnabled) {
          const { data: surveysData } = await supabase
            .from('surveys')
            .select('status')
            .eq('imobiliaria_id', imobiliariaId);

          totalPesquisas = surveysData?.length || 0;
          pesquisasRespondidas = surveysData?.filter(s => s.status === 'responded').length || 0;
          pesquisasPendentes = surveysData?.filter(s => s.status === 'pending').length || 0;
        }

        setStats({
          totalCorretores: totalCorretores || 0,
          totalFichas: totalFichas || 0,
          fichasMes: fichasMes || 0,
          totalPesquisas,
          pesquisasRespondidas,
          pesquisasPendentes,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [imobiliariaId, surveyEnabled]);

  if (loading) {
    return (
      <ImobiliariaLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ImobiliariaLayout>
    );
  }

  const plano = assinatura?.plano;
  
  // Calculate usage percentages
  const corretoresPercent = plano ? (stats?.totalCorretores || 0) / plano.max_corretores * 100 : 0;
  const fichasPercent = plano ? (stats?.fichasMes || 0) / plano.max_fichas_mes * 100 : 0;

  // Chart config
  const chartConfig = {
    fichas: {
      label: 'Registros',
      color: 'hsl(var(--primary))',
    },
  };

  return (
    <ImobiliariaLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Gerencie sua imobiliária e corretores
            </p>
          </div>
          <Link to="/empresa/corretores">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Corretor
            </Button>
          </Link>
        </div>

        {/* Subscription warning */}
        {assinatura?.status === 'trial' && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="flex items-center gap-4 p-4">
              <AlertCircle className="h-5 w-5 text-warning shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-warning">Período de teste ativo</p>
                <p className="text-sm text-muted-foreground">
                  Seu período de teste termina em breve. Assine um plano para continuar usando.
                </p>
              </div>
              <Link to="/empresa/assinatura">
                <Button variant="outline" size="sm">
                  Ver planos
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Stats grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Corretores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalCorretores}</div>
              {plano && (
                <>
                  <Progress value={corretoresPercent} className="h-1 mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    de {plano.max_corretores} disponíveis
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registros do Mês</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.fichasMes}</div>
              {plano && (
                <>
                  <Progress value={fichasPercent} className="h-1 mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    de {plano.max_fichas_mes} permitidos
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {surveyEnabled && (
            <Link to="/empresa/pesquisas">
              <Card className="cursor-pointer hover:border-primary transition-colors h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pesquisas Respondidas</CardTitle>
                  <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.pesquisasRespondidas || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    de {stats?.totalPesquisas || 0} enviadas
                  </p>
                  {stats?.totalPesquisas && stats.totalPesquisas > 0 && (
                    <Progress
                      value={(stats.pesquisasRespondidas / stats.totalPesquisas) * 100}
                      className="h-1 mt-2"
                    />
                  )}
                </CardContent>
              </Card>
            </Link>
          )}
        </div>

        {/* Monthly chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Registros por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.some(d => d.fichas > 0) ? (
              <ChartContainer config={chartConfig} className="h-[200px]">
                <BarChart data={monthlyData}>
                  <XAxis 
                    dataKey="month" 
                    tickLine={false} 
                    axisLine={false}
                    fontSize={12}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false}
                    fontSize={12}
                    allowDecimals={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="fichas" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                Nenhum registro ainda
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions and subscription info */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/empresa/corretores" className="block">
                <Button variant="outline" className="w-full justify-between">
                  Gerenciar corretores
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/empresa/fichas" className="block">
                <Button variant="outline" className="w-full justify-between">
                  Ver todos os registros
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/empresa/relatorios" className="block">
                <Button variant="outline" className="w-full justify-between">
                  Gerar relatório
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sua Assinatura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {assinatura && plano ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Plano</span>
                    <span className="font-medium">{plano.nome}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Valor</span>
                    <span className="font-medium">
                      R$ {plano.valor_mensal.toFixed(2).replace('.', ',')}/mês
                    </span>
                  </div>
                  {assinatura.proxima_cobranca && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Próxima cobrança</span>
                      <span className="font-medium">
                        {format(new Date(assinatura.proxima_cobranca), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </div>
                  )}

                  {/* Uso do Plano */}
                  <div className="border-t pt-4 mt-2 space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5" />
                          Registros/Mês
                        </span>
                        <span className="font-medium">
                          {stats?.fichasMes || 0} / {plano.max_fichas_mes >= 99999 ? '∞' : plano.max_fichas_mes}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(fichasPercent, 100)} 
                        className={`h-2 ${fichasPercent >= 100 ? '[&>div]:bg-destructive' : fichasPercent >= 80 ? '[&>div]:bg-warning' : ''}`} 
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          Corretores
                        </span>
                        <span className="font-medium">
                          {stats?.totalCorretores || 0} / {plano.max_corretores >= 99999 ? '∞' : plano.max_corretores}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(corretoresPercent, 100)} 
                        className={`h-2 ${corretoresPercent >= 100 ? '[&>div]:bg-destructive' : corretoresPercent >= 80 ? '[&>div]:bg-warning' : ''}`} 
                      />
                    </div>
                  </div>

                  <Link to="/empresa/assinatura">
                    <Button variant="outline" className="w-full mt-2">
                      Gerenciar assinatura
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">Nenhuma assinatura ativa</p>
                  <Link to="/empresa/assinatura">
                    <Button>Escolher um plano</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ImobiliariaLayout>
  );
}
