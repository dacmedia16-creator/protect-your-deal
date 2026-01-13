import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useFichaNotification } from '@/hooks/useFichaNotification';
import { useAssinaturaNotification } from '@/hooks/useAssinaturaNotification';
import { isFichaConfirmada, isFichaPendente } from '@/lib/fichaStatus';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Users, 
  Building2, 
  Plus,
  CheckCircle,
  Clock,
  Handshake,
  RefreshCw,
  Bug,
} from 'lucide-react';

// Build timestamp para diagnóstico de cache PWA
const BUILD_TIMESTAMP = new Date().toISOString();
import { MobileNav } from '@/components/MobileNav';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { DesktopNav } from '@/components/DesktopNav';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';
import { PWAInstallFAB } from '@/components/PWAInstallFAB';
import { UpgradeBanner } from '@/components/UpgradeBanner';
import { useConvitesPendentes } from '@/hooks/useConvitesPendentes';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { imobiliaria, role } = useUserRole();
  const queryClient = useQueryClient();
  const { data: convitesPendentes = 0 } = useConvitesPendentes();
  const [showDebug, setShowDebug] = useState(false);

  // Hook de notificação para fichas confirmadas
  useFichaNotification();
  
  // Hook de notificação para mudanças de assinatura
  useAssinaturaNotification();

  // Função para forçar atualização (limpar cache e recarregar)
  const handleForceUpdate = async () => {
    try {
      // Limpar cache do React Query
      queryClient.clear();
      
      // Limpar caches do Service Worker
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Desregistrar Service Workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
      }
      
      // Recarregar a página
      window.location.reload();
    } catch (error) {
      console.error('Erro ao forçar atualização:', error);
      window.location.reload();
    }
  };
  

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Query única para todas as stats do dashboard
  // Busca fichas onde o usuário é dono OU parceiro (igual ListaFichas)
  // Query para buscar o perfil do usuário
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('nome')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      // Buscar fichas (dono + parceiro) e clientes em paralelo
      const [fichasResult, clientes] = await Promise.all([
        supabase
          .from('fichas_visita')
          .select('status, corretor_parceiro_id, user_id')
          .or(`user_id.eq.${user.id},corretor_parceiro_id.eq.${user.id}`),
        supabase
          .from('clientes')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
      ]);

      const todasFichas = fichasResult.data || [];
      
      // Separar fichas onde o usuário é parceiro
      const fichasComoParceiro = todasFichas.filter(f => f.corretor_parceiro_id === user.id);
      
      return {
        // Total = todas (dono + parceiro) - igual ListaFichas
        totalFichas: todasFichas.length,
        fichasCompletas: todasFichas.filter(f => isFichaConfirmada(f.status)).length,
        fichasPendentes: todasFichas.filter(f => isFichaPendente(f.status)).length,
        totalClientes: clientes.count || 0,
        fichasParceiro: {
          total: fichasComoParceiro.length,
          pendentes: fichasComoParceiro.filter(f => isFichaPendente(f.status)).length,
        },
      };
    },
    enabled: !!user,
    staleTime: 30000, // 30 segundos antes de considerar stale
    refetchOnWindowFocus: false,
  });

  // Extrair dados para uso no componente
  const stats = dashboardData;
  const fichasParceiro = dashboardData?.fichasParceiro;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      {/* Desktop Navigation */}
      <DesktopNav />
      
      {/* Mobile Header */}
      <header className="sm:hidden border-b bg-card safe-area-top">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {imobiliaria?.logo_url ? (
              <img 
                src={imobiliaria.logo_url} 
                alt={imobiliaria.nome} 
                className="h-8 w-8 rounded-lg object-contain"
              />
            ) : (
              <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            <span className="font-display text-lg font-bold truncate max-w-[140px]">
              {imobiliaria?.nome || 'VisitaSegura'}
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8">
        {/* PWA Install Banner */}
        <PWAInstallBanner />

        {/* Upgrade Banner for free plan users */}
        <UpgradeBanner className="mb-4" />

        {/* Convites Pendentes Alert */}
        {convitesPendentes > 0 && (
          <Card 
            className="mb-4 border-warning/30 bg-warning/5 cursor-pointer hover:shadow-medium transition-shadow animate-fade-in"
            onClick={() => navigate('/convites-recebidos')}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-warning/20 flex items-center justify-center shrink-0">
                <Handshake className="h-6 w-6 text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-warning">
                  {convitesPendentes} {convitesPendentes === 1 ? 'convite de parceria pendente' : 'convites de parceria pendentes'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Clique para ver e aceitar os convites recebidos
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Welcome Section */}
        <div className="mb-4 md:mb-8">
          <h1 
            className="font-display text-2xl md:text-3xl font-bold mb-1 md:mb-2 cursor-default"
            onClick={() => {
              const clicks = parseInt(sessionStorage.getItem('debug-clicks') || '0') + 1;
              sessionStorage.setItem('debug-clicks', String(clicks));
              if (clicks >= 5) {
                setShowDebug(true);
                sessionStorage.setItem('debug-clicks', '0');
              }
              setTimeout(() => sessionStorage.setItem('debug-clicks', '0'), 2000);
            }}
          >
            Bem-vindo, {profile?.nome?.split(' ')[0] || 'Usuário'}!
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Gerencie seus registros de visita e clientes
          </p>
        </div>

        {/* Stats Grid - 2x2 on mobile, 4 cols on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          <Card 
            className="animate-fade-in cursor-pointer hover:shadow-medium hover:scale-[1.02] transition-all"
            onClick={() => navigate('/fichas')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                Total Registros
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">{stats?.totalFichas || 0}</div>
            </CardContent>
          </Card>

          <Card 
            className="animate-fade-in cursor-pointer hover:shadow-medium hover:scale-[1.02] transition-all" 
            style={{ animationDelay: '0.1s' }}
            onClick={() => navigate('/fichas?status=completo')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                Confirmadas
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold text-success">{stats?.fichasCompletas || 0}</div>
            </CardContent>
          </Card>

          <Card 
            className="animate-fade-in cursor-pointer hover:shadow-medium hover:scale-[1.02] transition-all" 
            style={{ animationDelay: '0.2s' }}
            onClick={() => navigate('/fichas?status=pendente')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                Pendentes
              </CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold text-warning">{stats?.fichasPendentes || 0}</div>
            </CardContent>
          </Card>

          <Card 
            className="animate-fade-in cursor-pointer hover:shadow-medium hover:scale-[1.02] transition-all" 
            style={{ animationDelay: '0.3s' }}
            onClick={() => navigate('/clientes')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                Clientes
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">{stats?.totalClientes || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Card de Fichas como Parceiro */}
        {fichasParceiro && fichasParceiro.total > 0 && (
          <Card 
            className="animate-fade-in cursor-pointer hover:shadow-medium transition-all border-primary/20 bg-primary/5 mb-6"
            style={{ animationDelay: '0.4s' }}
            onClick={() => navigate('/fichas-parceiro')}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <Handshake className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-primary">
                  {fichasParceiro.total} {fichasParceiro.total === 1 ? 'registro como parceiro' : 'registros como parceiro'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {fichasParceiro.pendentes > 0 
                    ? `${fichasParceiro.pendentes} pendente${fichasParceiro.pendentes > 1 ? 's' : ''} de confirmação`
                    : 'Todas confirmadas'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions - vertical on mobile, grid on desktop */}
        <div className="hidden sm:grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card 
            className="cursor-pointer hover:shadow-medium transition-shadow group"
            onClick={() => navigate('/fichas/nova')}
          >
            <CardHeader>
              <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle>Novo Registro de Visita</CardTitle>
              <CardDescription>
                Crie um novo registro e envie para confirmação
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-medium transition-shadow group"
            onClick={() => navigate('/clientes')}
          >
            <CardHeader>
              <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-secondary-foreground" />
              </div>
              <CardTitle>Gerenciar Clientes</CardTitle>
              <CardDescription>
                Cadastre e organize seus clientes
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-medium transition-shadow group"
            onClick={() => navigate('/imoveis')}
          >
            <CardHeader>
              <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Building2 className="h-6 w-6 text-secondary-foreground" />
              </div>
              <CardTitle>Imóveis</CardTitle>
              <CardDescription>
                Cadastre imóveis para agilizar registros
              </CardDescription>
            </CardHeader>
          </Card>

        </div>

        {/* Mobile Quick Actions - Compact list */}
        <div className="sm:hidden space-y-2">
          <h2 className="font-display text-lg font-semibold mb-3">Ações Rápidas</h2>
          
          <Card 
            className="cursor-pointer active:bg-muted/50 transition-colors"
            onClick={() => navigate('/fichas/nova')}
          >
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                <Plus className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm">Novo Registro de Visita</p>
                <p className="text-xs text-muted-foreground truncate">Criar e enviar para confirmação</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer active:bg-muted/50 transition-colors"
            onClick={() => navigate('/clientes')}
          >
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm">Gerenciar Clientes</p>
                <p className="text-xs text-muted-foreground truncate">Cadastrar e organizar clientes</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer active:bg-muted/50 transition-colors"
            onClick={() => navigate('/imoveis')}
          >
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm">Imóveis</p>
                <p className="text-xs text-muted-foreground truncate">Cadastrar e gerenciar imóveis</p>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>

      {/* Floating Action Button for mobile */}
      <FloatingActionButton 
        onClick={() => navigate('/fichas/nova')} 
        label="Novo Registro"
      />

      {/* Mobile Navigation */}
      <MobileNav />
      
      {/* PWA Install FAB */}
      <PWAInstallFAB />

      {/* Debug Banner - clique 5x no título para mostrar */}
      {showDebug && (
        <div className="fixed bottom-20 sm:bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-card border rounded-lg shadow-lg p-4 z-50 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-sm flex items-center gap-2">
              <Bug className="h-4 w-4" /> Diagnóstico PWA
            </span>
            <Button variant="ghost" size="sm" onClick={() => setShowDebug(false)}>✕</Button>
          </div>
          <div className="text-xs space-y-1 text-muted-foreground mb-3">
            <p><strong>Build:</strong> {BUILD_TIMESTAMP}</p>
            <p><strong>User:</strong> {user?.id?.slice(0, 8)}...</p>
            <p><strong>Role:</strong> {role || 'carregando...'}</p>
            <p><strong>Fichas:</strong> {stats?.totalFichas || 0} (parceiro: {fichasParceiro?.total || 0})</p>
          </div>
          <Button 
            onClick={handleForceUpdate} 
            size="sm" 
            className="w-full"
            variant="destructive"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Forçar Atualização
          </Button>
        </div>
      )}

    </div>
  );
}
