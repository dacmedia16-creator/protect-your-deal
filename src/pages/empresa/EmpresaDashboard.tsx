import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ImobiliariaLayout } from '@/components/layouts/ImobiliariaLayout';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Users, FileText, Building2, Home, Plus, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardStats {
  totalCorretores: number;
  totalFichas: number;
  fichasMes: number;
  totalClientes: number;
  totalImoveis: number;
}

export default function EmpresaDashboard() {
  const { imobiliaria, assinatura, imobiliariaId } = useUserRole();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

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
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const { count: fichasMes } = await supabase
          .from('fichas_visita')
          .select('*', { count: 'exact', head: true })
          .eq('imobiliaria_id', imobiliariaId)
          .gte('created_at', startOfMonth.toISOString());

        // Count clientes
        const { count: totalClientes } = await supabase
          .from('clientes')
          .select('*', { count: 'exact', head: true })
          .eq('imobiliaria_id', imobiliariaId);

        // Count imoveis
        const { count: totalImoveis } = await supabase
          .from('imoveis')
          .select('*', { count: 'exact', head: true })
          .eq('imobiliaria_id', imobiliariaId);

        setStats({
          totalCorretores: totalCorretores || 0,
          totalFichas: totalFichas || 0,
          fichasMes: fichasMes || 0,
          totalClientes: totalClientes || 0,
          totalImoveis: totalImoveis || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [imobiliariaId]);

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
  const clientesPercent = plano ? (stats?.totalClientes || 0) / plano.max_clientes * 100 : 0;
  const imoveisPercent = plano ? (stats?.totalImoveis || 0) / plano.max_imoveis * 100 : 0;

  return (
    <ImobiliariaLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Bem-vindo, {imobiliaria?.nome}
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              <CardTitle className="text-sm font-medium">Fichas do Mês</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.fichasMes}</div>
              {plano && (
                <>
                  <Progress value={fichasPercent} className="h-1 mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    de {plano.max_fichas_mes} permitidas
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalClientes}</div>
              {plano && (
                <>
                  <Progress value={clientesPercent} className="h-1 mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    de {plano.max_clientes} permitidos
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Imóveis</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalImoveis}</div>
              {plano && (
                <>
                  <Progress value={imoveisPercent} className="h-1 mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    de {plano.max_imoveis} permitidos
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

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
                  Ver todas as fichas
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
                  <Link to="/empresa/assinatura">
                    <Button variant="outline" className="w-full mt-4">
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
