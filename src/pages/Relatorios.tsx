import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DesktopNav } from '@/components/DesktopNav';
import { MobileNav } from '@/components/MobileNav';
import { MobileHeader } from '@/components/MobileHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  CalendarDays
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Relatorios() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch fichas data
  const { data: fichas = [], isLoading: fichasLoading } = useQuery({
    queryKey: ['relatorios-fichas', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fichas_visita')
        .select('*')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isLoading = fichasLoading;

  // Calculate metrics
  const totalFichas = fichas.length;
  const fichasConfirmadas = fichas.filter(f => f.status === 'confirmado').length;
  const fichasPendentes = fichas.filter(f => f.status === 'pendente').length;
  const taxaConfirmacao = totalFichas > 0 ? Math.round((fichasConfirmadas / totalFichas) * 100) : 0;

  // Data for charts
  const statusData = [
    { name: 'Confirmadas', value: fichasConfirmadas, color: 'hsl(var(--success))' },
    { name: 'Pendentes', value: fichasPendentes, color: 'hsl(var(--warning))' },
  ].filter(d => d.value > 0);

  // Monthly fichas data (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    
    const count = fichas.filter(f => {
      const createdAt = new Date(f.created_at);
      return createdAt >= start && createdAt <= end;
    }).length;

    return {
      month: format(date, 'MMM', { locale: ptBR }),
      fichas: count,
    };
  });

  const chartConfig = {
    fichas: {
      label: 'Registros',
      color: 'hsl(var(--primary))',
    },
  };

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      <DesktopNav />
      <MobileHeader 
        title="Relatórios" 
        subtitle="Visão geral do sistema"
      />

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Main metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{totalFichas}</p>
                      <p className="text-xs text-muted-foreground">Total Registros</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-success/10">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{fichasConfirmadas}</p>
                      <p className="text-xs text-muted-foreground">Confirmadas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-warning/10">
                      <Clock className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{fichasPendentes}</p>
                      <p className="text-xs text-muted-foreground">Pendentes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{taxaConfirmacao}%</p>
                      <p className="text-xs text-muted-foreground">Taxa Confirm.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Secondary metric - Este mês */}
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary">
                    <CalendarDays className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {fichas.filter(f => {
                        const date = new Date(f.created_at);
                        const now = new Date();
                        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                      }).length}
                    </p>
                    <p className="text-xs text-muted-foreground">Registros este mês</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid sm:grid-cols-2 gap-6">
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

              {/* Status distribution */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Status dos Registros</CardTitle>
                </CardHeader>
                <CardContent>
                  {statusData.length > 0 ? (
                    <div className="h-[200px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-col gap-2 ml-4">
                        {statusData.map((entry, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-muted-foreground">{entry.name}:</span>
                            <span className="font-medium">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                      Nenhum registro ainda
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      <MobileNav />
    </div>
  );
}
