import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SuperAdminLayout } from '@/components/layouts/SuperAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Users, FileText, TrendingUp, AlertCircle } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface DashboardStats {
  totalImobiliarias: number;
  imobiliariasAtivas: number;
  totalCorretores: number;
  totalFichas: number;
  fichasMes: number;
  assinaturasAtivas: number;
  assinaturasSuspensas: number;
  receitaMensal: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch imobiliarias count
        const { count: totalImobiliarias } = await supabase
          .from('imobiliarias')
          .select('*', { count: 'exact', head: true });

        const { count: imobiliariasAtivas } = await supabase
          .from('imobiliarias')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'ativo');

        // Fetch corretores count (users with corretor role)
        const { count: totalCorretores } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'corretor');

        // Fetch fichas count
        const { count: totalFichas } = await supabase
          .from('fichas_visita')
          .select('*', { count: 'exact', head: true });

        // Fetch fichas this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const { count: fichasMes } = await supabase
          .from('fichas_visita')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfMonth.toISOString());

        // Fetch subscriptions
        const { count: assinaturasAtivas } = await supabase
          .from('assinaturas')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'ativa');

        const { count: assinaturasSuspensas } = await supabase
          .from('assinaturas')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'suspensa');

        // Calculate monthly revenue (sum of active subscriptions)
        const { data: activeSubscriptions } = await supabase
          .from('assinaturas')
          .select('plano:planos(valor_mensal)')
          .eq('status', 'ativa');

        const receitaMensal = activeSubscriptions?.reduce((total, sub) => {
          const plano = Array.isArray(sub.plano) ? sub.plano[0] : sub.plano;
          return total + (plano?.valor_mensal || 0);
        }, 0) || 0;

        setStats({
          totalImobiliarias: totalImobiliarias || 0,
          imobiliariasAtivas: imobiliariasAtivas || 0,
          totalCorretores: totalCorretores || 0,
          totalFichas: totalFichas || 0,
          fichasMes: fichasMes || 0,
          assinaturasAtivas: assinaturasAtivas || 0,
          assinaturasSuspensas: assinaturasSuspensas || 0,
          receitaMensal,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
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
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema</p>
        </div>

        {/* Stats grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card 
            className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
            onClick={() => navigate('/admin/imobiliarias')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Imobiliárias</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalImobiliarias}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.imobiliariasAtivas} ativas · Ver detalhes →
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
            onClick={() => navigate('/admin/usuarios')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Corretores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalCorretores}</div>
              <p className="text-xs text-muted-foreground">usuários ativos · Ver detalhes →</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
            onClick={() => navigate('/admin/fichas')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registros de Visita</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalFichas}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.fichasMes} este mês · Ver detalhes →
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
            onClick={() => navigate('/admin/financeiro')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {stats?.receitaMensal?.toFixed(2).replace('.', ',')}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.assinaturasAtivas} assinaturas ativas · Ver detalhes →
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts section */}
        {(stats?.assinaturasSuspensas || 0) > 0 && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader className="flex flex-row items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Atenção</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-destructive">
                {stats?.assinaturasSuspensas} assinatura(s) suspensa(s) por inadimplência.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Quick stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card 
            className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
            onClick={() => navigate('/admin/assinaturas')}
          >
            <CardHeader>
              <CardTitle>Assinaturas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Ativas</span>
                <span className="font-medium text-success">{stats?.assinaturasAtivas}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Suspensas</span>
                <span className="font-medium text-destructive">{stats?.assinaturasSuspensas}</span>
              </div>
              <p className="text-xs text-muted-foreground text-right">Ver detalhes →</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Atividade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Fichas este mês</span>
                <span className="font-medium">{stats?.fichasMes}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total de fichas</span>
                <span className="font-medium">{stats?.totalFichas}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
