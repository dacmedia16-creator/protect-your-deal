import { useEffect, useState } from 'react';
import { SuperAdminLayout } from '@/components/layouts/SuperAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, ArrowLeft, CalendarIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface MonthlyRevenue {
  month: string;
  monthLabel: string;
  revenue: number;
}

interface FinancialStats {
  receitaPeriodo: number;
  assinaturasAtivas: number;
  assinaturasSuspensas: number;
  assinaturasCanceladas: number;
  ticketMedio: number;
  crescimentoMensal: number;
}

const chartConfig = {
  revenue: {
    label: 'Receita',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export default function AdminRelatoriosFinanceiros() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Date range filter - default to last 12 months
  const [startDate, setStartDate] = useState<Date>(startOfMonth(subMonths(new Date(), 11)));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch all subscriptions with plan info
        const { data: allSubscriptions } = await supabase
          .from('assinaturas')
          .select('status, created_at, plano:planos(valor_mensal)');

        // Calculate stats
        const activeSubscriptions = allSubscriptions?.filter(s => s.status === 'ativa') || [];
        const suspendedSubscriptions = allSubscriptions?.filter(s => s.status === 'suspensa') || [];
        const cancelledSubscriptions = allSubscriptions?.filter(s => s.status === 'cancelada') || [];

        const receitaMensalAtual = activeSubscriptions.reduce((total, sub) => {
          const plano = Array.isArray(sub.plano) ? sub.plano[0] : sub.plano;
          return total + (plano?.valor_mensal || 0);
        }, 0);

        const ticketMedio = activeSubscriptions.length > 0 
          ? receitaMensalAtual / activeSubscriptions.length 
          : 0;

        // Generate months in selected range
        const months: MonthlyRevenue[] = [];
        const monthsInRange = eachMonthOfInterval({ start: startDate, end: endDate });
        
        for (const date of monthsInRange) {
          const monthKey = format(date, 'yyyy-MM');
          const monthLabel = format(date, 'MMM/yy', { locale: ptBR });
          
          const monthEnd = endOfMonth(date);
          
          const subscriptionsAtMonth = allSubscriptions?.filter(sub => {
            const createdAt = new Date(sub.created_at);
            return createdAt <= monthEnd && (sub.status === 'ativa' || sub.status === 'suspensa');
          }) || [];

          const revenue = subscriptionsAtMonth.reduce((total, sub) => {
            const plano = Array.isArray(sub.plano) ? sub.plano[0] : sub.plano;
            return total + (plano?.valor_mensal || 0);
          }, 0);

          months.push({
            month: monthKey,
            monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
            revenue,
          });
        }

        // Calculate total revenue in period
        const receitaPeriodo = months.reduce((total, m) => total + m.revenue, 0);

        // Calculate growth (comparing last month in range to previous month)
        const currentMonthRevenue = months[months.length - 1]?.revenue || 0;
        const previousMonthRevenue = months[months.length - 2]?.revenue || 0;
        const crescimentoMensal = previousMonthRevenue > 0 
          ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
          : 0;

        setStats({
          receitaPeriodo,
          assinaturasAtivas: activeSubscriptions.length,
          assinaturasSuspensas: suspendedSubscriptions.length,
          assinaturasCanceladas: cancelledSubscriptions.length,
          ticketMedio,
          crescimentoMensal,
        });

        setMonthlyData(months);
      } catch (error) {
        console.error('Error fetching financial data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [startDate, endDate]);

  const handleQuickFilter = (months: number) => {
    const now = new Date();
    setStartDate(startOfMonth(subMonths(now, months - 1)));
    setEndDate(endOfMonth(now));
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Relatórios Financeiros</h1>
            <p className="text-muted-foreground">Análise detalhada da receita e assinaturas</p>
          </div>
        </div>

        {/* Date Range Filter */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Filtrar por Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleQuickFilter(3)}
                >
                  3 meses
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleQuickFilter(6)}
                >
                  6 meses
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleQuickFilter(12)}
                >
                  12 meses
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[160px] justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "MMM/yyyy", { locale: ptBR }) : "Início"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(startOfMonth(date))}
                      initialFocus
                      className="p-3 pointer-events-auto"
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                
                <span className="text-muted-foreground">até</span>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[160px] justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "MMM/yyyy", { locale: ptBR }) : "Fim"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => date && setEndDate(endOfMonth(date))}
                      initialFocus
                      className="p-3 pointer-events-auto"
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita do Período</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                R$ {stats?.receitaPeriodo?.toFixed(2).replace('.', ',')}
              </div>
              <p className="text-xs text-muted-foreground">
                Soma total no período selecionado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Crescimento</CardTitle>
              {(stats?.crescimentoMensal || 0) >= 0 ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(stats?.crescimentoMensal || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                {(stats?.crescimentoMensal || 0) >= 0 ? '+' : ''}{stats?.crescimentoMensal?.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                vs. mês anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {stats?.ticketMedio?.toFixed(2).replace('.', ',')}
              </div>
              <p className="text-xs text-muted-foreground">
                por assinatura
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assinaturas</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.assinaturasAtivas}</div>
              <p className="text-xs text-muted-foreground">
                ativas no momento
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>
              Receita Mensal ({format(startDate, "MMM/yyyy", { locale: ptBR })} - {format(endDate, "MMM/yyyy", { locale: ptBR })})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="monthLabel" 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `R$${value}`}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  formatter={(value: number) => [`R$ ${value.toFixed(2).replace('.', ',')}`, 'Receita']}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                  name="Receita"
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Subscription breakdown */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-success">Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-success">{stats?.assinaturasAtivas}</div>
              <p className="text-sm text-muted-foreground mt-2">
                Assinaturas em dia gerando receita recorrente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-warning">Suspensas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-warning">{stats?.assinaturasSuspensas}</div>
              <p className="text-sm text-muted-foreground mt-2">
                Assinaturas com pagamento pendente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Canceladas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-destructive">{stats?.assinaturasCanceladas}</div>
              <p className="text-sm text-muted-foreground mt-2">
                Assinaturas canceladas ou encerradas
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
