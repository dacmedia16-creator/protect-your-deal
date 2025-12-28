import { useEffect, useState } from 'react';
import { SuperAdminLayout } from '@/components/layouts/SuperAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, ArrowLeft } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface MonthlyRevenue {
  month: string;
  monthLabel: string;
  revenue: number;
}

interface FinancialStats {
  receitaMensalAtual: number;
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

  useEffect(() => {
    async function fetchData() {
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

        // Generate last 12 months data
        const months: MonthlyRevenue[] = [];
        const now = new Date();
        
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
          
          // For current month, use active subscriptions
          // For past months, estimate based on subscriptions created before that month end
          const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
          
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

        // Calculate growth (comparing current month to previous month)
        const currentMonthRevenue = months[months.length - 1]?.revenue || 0;
        const previousMonthRevenue = months[months.length - 2]?.revenue || 0;
        const crescimentoMensal = previousMonthRevenue > 0 
          ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
          : 0;

        setStats({
          receitaMensalAtual,
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
  }, []);

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

        {/* Stats grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                R$ {stats?.receitaMensalAtual?.toFixed(2).replace('.', ',')}
              </div>
              <p className="text-xs text-muted-foreground">
                Receita recorrente atual
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
            <CardTitle>Receita Mensal (últimos 12 meses)</CardTitle>
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
