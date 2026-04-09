import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useFichaNotification } from '@/hooks/useFichaNotification';
import { useAssinaturaNotification } from '@/hooks/useAssinaturaNotification';
import { isFichaConfirmada } from '@/lib/fichaStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import {
  Users, FileText, Plus, ArrowRight, Loader2, AlertCircle,
  TrendingUp, TrendingDown, Building, CheckCircle2, Clock,
  DollarSign, BarChart3, ChevronRight
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, subHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, Legend } from 'recharts';

interface FichaRow {
  status: string;
  convertido_venda: boolean | null;
  valor_venda: number | null;
  created_at: string;
}

interface DashboardStats {
  totalCorretores: number;
  empreendimentos: number;
  parcerias: number;
  // Current month
  fichasMes: number;
  fichasConfirmadas: number;
  fichasPendentes: number;
  taxaConfirmacao: number;
  vendasMes: number;
  valorVendidoMes: number;
  // Previous month
  fichasMesAnterior: number;
  fichasConfirmadasAnterior: number;
  vendasMesAnterior: number;
  valorVendidoAnterior: number;
  // Alerts
  fichasPendentes48h: number;
}

interface MonthlyData {
  month: string;
  total: number;
  confirmados: number;
  vendas: number;
}

function calcVariation(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

function VariationBadge({ current, previous }: { current: number; previous: number }) {
  const variation = calcVariation(current, previous);
  if (variation === null) return null;
  const isPositive = variation >= 0;
  return (
    <span className={`text-xs font-medium flex items-center gap-0.5 ${isPositive ? 'text-success' : 'text-destructive'}`}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isPositive ? '+' : ''}{variation}%
    </span>
  );
}

function KPICard({
  title, value, subtitle, icon: Icon, iconBg, current, previous, href, formatAsCurrency
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  iconBg: string;
  current?: number;
  previous?: number;
  href?: string;
  formatAsCurrency?: boolean;
}) {
  const content = (
    <Card className={`hover:border-primary/50 transition-all duration-200 hover:shadow-soft h-full ${href ? 'cursor-pointer' : ''}`}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">{title}</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground truncate">
              {formatAsCurrency ? `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}` : value}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {current !== undefined && previous !== undefined && (
                <VariationBadge current={current} previous={previous} />
              )}
              {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
            </div>
          </div>
          <div className={`rounded-full p-2 sm:p-2.5 shrink-0 ${iconBg}`}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
        </div>
        {href && (
          <div className="flex justify-end mt-1">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </CardContent>
    </Card>
  );
  if (href) return <Link to={href}>{content}</Link>;
  return content;
}

export default function ConstrutoraDashboard() {
  useDocumentTitle('Dashboard | Construtora');
  const { construtora, assinatura, construtoraId, trialDaysLeft } = useUserRole();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useFichaNotification();
  useAssinaturaNotification();

  useEffect(() => {
    async function fetchStats() {
      if (!construtoraId) return;
      try {
        const now = new Date();
        const currentMonthStart = startOfMonth(now);
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(subMonths(now, 1));
        const threshold48h = subHours(now, 48);

        const [
          corretores,
          empreendimentos,
          parcerias,
          fichasMesResult,
          fichasMesAnteriorResult,
          fichasPendentes48hResult,
        ] = await Promise.all([
          supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('construtora_id', construtoraId).eq('role', 'corretor'),
          supabase.from('empreendimentos').select('id', { count: 'exact', head: true }).eq('construtora_id', construtoraId),
          supabase.from('construtora_imobiliarias').select('id', { count: 'exact', head: true }).eq('construtora_id', construtoraId).eq('status', 'ativa'),
          supabase.from('fichas_visita')
            .select('status, convertido_venda, valor_venda, created_at')
            .eq('construtora_id', construtoraId)
            .gte('created_at', currentMonthStart.toISOString()),
          supabase.from('fichas_visita')
            .select('status, convertido_venda, valor_venda, created_at')
            .eq('construtora_id', construtoraId)
            .gte('created_at', lastMonthStart.toISOString())
            .lte('created_at', lastMonthEnd.toISOString()),
          supabase.from('fichas_visita')
            .select('id', { count: 'exact', head: true })
            .eq('construtora_id', construtoraId)
            .eq('status', 'pendente')
            .lte('created_at', threshold48h.toISOString()),
        ]);

        const currentFichas: FichaRow[] = (fichasMesResult.data || []) as FichaRow[];
        const previousFichas: FichaRow[] = (fichasMesAnteriorResult.data || []) as FichaRow[];

        const fichasMes = currentFichas.length;
        const fichasConfirmadas = currentFichas.filter(f => isFichaConfirmada(f.status)).length;
        const fichasPendentes = currentFichas.filter(f => f.status === 'pendente').length;
        const vendasMes = currentFichas.filter(f => f.convertido_venda).length;
        const valorVendidoMes = currentFichas.filter(f => f.convertido_venda && f.valor_venda).reduce((sum, f) => sum + (f.valor_venda || 0), 0);

        const fichasMesAnterior = previousFichas.length;
        const fichasConfirmadasAnterior = previousFichas.filter(f => isFichaConfirmada(f.status)).length;
        const vendasMesAnterior = previousFichas.filter(f => f.convertido_venda).length;
        const valorVendidoAnterior = previousFichas.filter(f => f.convertido_venda && f.valor_venda).reduce((sum, f) => sum + (f.valor_venda || 0), 0);

        const taxaConfirmacao = fichasMes > 0 ? Math.round((fichasConfirmadas / fichasMes) * 100) : 0;

        // Monthly chart (6 months) with stacked data
        const sixMonthsAgo = startOfMonth(subMonths(now, 5));
        const { data: fichasChart } = await supabase
          .from('fichas_visita')
          .select('status, convertido_venda, created_at')
          .eq('construtora_id', construtoraId)
          .gte('created_at', sixMonthsAgo.toISOString());

        const chartRows = (fichasChart || []) as FichaRow[];
        const monthlyChartData: MonthlyData[] = Array.from({ length: 6 }, (_, i) => {
          const date = subMonths(now, 5 - i);
          const start = startOfMonth(date);
          const end = endOfMonth(date);
          const inRange = chartRows.filter(f => {
            const c = new Date(f.created_at);
            return c >= start && c <= end;
          });
          return {
            month: format(date, 'MMM', { locale: ptBR }),
            total: inRange.length,
            confirmados: inRange.filter(f => isFichaConfirmada(f.status)).length,
            vendas: inRange.filter(f => f.convertido_venda).length,
          };
        });

        setMonthlyData(monthlyChartData);
        setStats({
          totalCorretores: corretores.count || 0,
          empreendimentos: empreendimentos.count || 0,
          parcerias: parcerias.count || 0,
          fichasMes,
          fichasConfirmadas,
          fichasPendentes,
          taxaConfirmacao,
          vendasMes,
          valorVendidoMes,
          fichasMesAnterior,
          fichasConfirmadasAnterior,
          vendasMesAnterior,
          valorVendidoAnterior,
          fichasPendentes48h: fichasPendentes48hResult.count || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [construtoraId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const plano = assinatura?.plano;
  const corretoresPercent = plano ? (stats?.totalCorretores || 0) / plano.max_corretores * 100 : 0;
  const fichasPercent = plano ? (stats?.fichasMes || 0) / plano.max_fichas_mes * 100 : 0;

  const crescimentoMoM = calcVariation(stats?.fichasMes || 0, stats?.fichasMesAnterior || 0);
  const hasPerformanceDrop = crescimentoMoM !== null && crescimentoMoM <= -20;
  const hasAlerts = (stats?.fichasPendentes48h || 0) > 0 || hasPerformanceDrop;

  const chartConfig = {
    total: { label: 'Total', color: 'hsl(var(--muted-foreground))' },
    confirmados: { label: 'Confirmados', color: 'hsl(var(--primary))' },
    vendas: { label: 'Vendas', color: 'hsl(142 76% 36%)' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Bem-vindo ao painel da {construtora?.nome || 'Construtora'}</p>
        </div>
        <Link to="/construtora/corretores">
          <Button><Plus className="h-4 w-4 mr-2" />Novo Corretor</Button>
        </Link>
      </div>

      {/* Trial warning */}
      {assinatura?.status === 'trial' && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="flex items-center gap-4 p-4">
            <AlertCircle className="h-5 w-5 text-warning shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-warning">Período de teste ativo</p>
              <p className="text-sm text-muted-foreground">
                {trialDaysLeft !== null
                  ? `Seu período de teste termina em ${trialDaysLeft} dia${trialDaysLeft !== 1 ? 's' : ''}. Assine um plano para continuar.`
                  : 'Seu período de teste termina em breve. Assine um plano para continuar.'}
              </p>
            </div>
            <Link to="/construtora/assinatura">
              <Button variant="outline" size="sm">Ver planos <ArrowRight className="h-4 w-4 ml-2" /></Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Management Alerts */}
      {hasAlerts && (
        <div className="space-y-2">
          {(stats?.fichasPendentes48h || 0) > 0 && (
            <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Fichas pendentes</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>{stats!.fichasPendentes48h} ficha{stats!.fichasPendentes48h !== 1 ? 's' : ''} pendente{stats!.fichasPendentes48h !== 1 ? 's' : ''} há mais de 48h</span>
                <Link to="/construtora/fichas">
                  <Button variant="outline" size="sm" className="ml-2 shrink-0">Ver fichas <ArrowRight className="h-3 w-3 ml-1" /></Button>
                </Link>
              </AlertDescription>
            </Alert>
          )}
          {hasPerformanceDrop && (
            <Alert className="border-warning/30 bg-warning/5">
              <TrendingDown className="h-4 w-4 text-warning" />
              <AlertTitle className="text-warning">Queda de performance</AlertTitle>
              <AlertDescription>
                Volume de fichas caiu {Math.abs(crescimentoMoM!)}% em relação ao mês anterior
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Executive KPI Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3">
        <KPICard
          title="Fichas Criadas"
          value={stats?.fichasMes || 0}
          icon={FileText}
          iconBg="bg-primary/10"
          current={stats?.fichasMes}
          previous={stats?.fichasMesAnterior}
          subtitle="no mês"
          href="/construtora/fichas"
        />
        <KPICard
          title="Confirmadas"
          value={stats?.fichasConfirmadas || 0}
          icon={CheckCircle2}
          iconBg="bg-success/10"
          current={stats?.fichasConfirmadas}
          previous={stats?.fichasConfirmadasAnterior}
          subtitle="no mês"
        />
        <KPICard
          title="Pendentes"
          value={stats?.fichasPendentes || 0}
          icon={Clock}
          iconBg="bg-warning/10"
          subtitle="aguardando confirmação"
        />
        <KPICard
          title="Taxa de Confirmação"
          value={`${stats?.taxaConfirmacao || 0}%`}
          icon={BarChart3}
          iconBg="bg-accent/50"
          subtitle={stats?.fichasMesAnterior ? `${stats.fichasConfirmadasAnterior && stats.fichasMesAnterior > 0 ? Math.round((stats.fichasConfirmadasAnterior / stats.fichasMesAnterior) * 100) : 0}% mês anterior` : undefined}
        />
        <KPICard
          title="Vendas"
          value={stats?.vendasMes || 0}
          icon={TrendingUp}
          iconBg="bg-success/10"
          current={stats?.vendasMes}
          previous={stats?.vendasMesAnterior}
          subtitle="no mês"
        />
        <KPICard
          title="Valor Vendido"
          value={stats?.valorVendidoMes || 0}
          icon={DollarSign}
          iconBg="bg-primary/10"
          current={stats?.valorVendidoMes}
          previous={stats?.valorVendidoAnterior}
          formatAsCurrency
        />
      </div>

      {/* Stacked Monthly Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base font-medium">Evolução Mensal</CardTitle>
            {crescimentoMoM !== null && crescimentoMoM !== 0 && (
              <span className={`text-xs font-medium flex items-center gap-1 ${crescimentoMoM > 0 ? 'text-success' : 'text-destructive'}`}>
                {crescimentoMoM > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {crescimentoMoM > 0 ? '+' : ''}{crescimentoMoM}% fichas
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {monthlyData.some(d => d.total > 0) ? (
            <ChartContainer config={chartConfig} className="h-[220px]">
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="total" fill="hsl(var(--muted-foreground))" radius={[0, 0, 0, 0]} opacity={0.3} />
                <Bar dataKey="confirmados" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
                <Bar dataKey="vendas" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
              Nenhum registro ainda
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions + Subscription */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Ações Rápidas</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Link to="/construtora/corretores" className="block">
              <Button variant="outline" className="w-full justify-between">Gerenciar corretores <ArrowRight className="h-4 w-4" /></Button>
            </Link>
            <Link to="/construtora/fichas" className="block">
              <Button variant="outline" className="w-full justify-between">Ver todos os registros <ArrowRight className="h-4 w-4" /></Button>
            </Link>
            <Link to="/construtora/relatorios" className="block">
              <Button variant="outline" className="w-full justify-between">Gerar relatório <ArrowRight className="h-4 w-4" /></Button>
            </Link>
            <Link to="/construtora/empreendimentos" className="block">
              <Button variant="outline" className="w-full justify-between">Empreendimentos <ArrowRight className="h-4 w-4" /></Button>
            </Link>
            <Link to="/construtora/equipes" className="block">
              <Button variant="outline" className="w-full justify-between">Gerenciar equipes <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Sua Assinatura</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {assinatura && plano ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Plano</span>
                  <span className="font-medium">{plano.nome}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Valor</span>
                  <span className="font-medium">R$ {plano.valor_mensal.toFixed(2).replace('.', ',')}/mês</span>
                </div>

                <div className="border-t pt-4 mt-2 space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />Registros/Mês</span>
                      <span className="font-medium">{stats?.fichasMes || 0} / {plano.max_fichas_mes >= 99999 ? '∞' : plano.max_fichas_mes}</span>
                    </div>
                    <Progress value={Math.min(fichasPercent, 100)} className={`h-2 ${fichasPercent >= 100 ? '[&>div]:bg-destructive' : fichasPercent >= 80 ? '[&>div]:bg-warning' : ''}`} />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />Corretores</span>
                      <span className="font-medium">{stats?.totalCorretores || 0} / {plano.max_corretores >= 99999 ? '∞' : plano.max_corretores}</span>
                    </div>
                    <Progress value={Math.min(corretoresPercent, 100)} className={`h-2 ${corretoresPercent >= 100 ? '[&>div]:bg-destructive' : corretoresPercent >= 80 ? '[&>div]:bg-warning' : ''}`} />
                  </div>
                </div>

                <Link to="/construtora/assinatura">
                  <Button variant="outline" className="w-full mt-2">Gerenciar assinatura</Button>
                </Link>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">Nenhuma assinatura ativa</p>
                <Link to="/construtora/assinatura"><Button>Escolher um plano</Button></Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
