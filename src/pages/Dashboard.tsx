import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useFichaNotification } from '@/hooks/useFichaNotification';
import { useAssinaturaNotification } from '@/hooks/useAssinaturaNotification';
import { isFichaConfirmada, isFichaPendente } from '@/lib/fichaStatus';
import { useImobiliariaFeatureFlag } from '@/hooks/useImobiliariaFeatureFlag';
import { useEquipeLider } from '@/hooks/useEquipeLider';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Plus,
  CheckCircle,
  Clock,
  Handshake,
  RefreshCw,
  Bug,
  ClipboardCheck,
  Scale,
  UsersRound,
  TrendingUp,
  Users,
  ChevronRight,
  Share2,
  Building2,
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
import { PlanUsageCard } from '@/components/PlanUsageCard';
import { OnboardingTour } from '@/components/OnboardingTour';

const ONBOARDING_STEPS = [
  {
    target: 'welcome',
    title: 'Bem-vindo ao VisitaProva! 🎉',
    description: 'Este é seu painel principal. Aqui você acompanha tudo sobre seus registros de visita e clientes.',
  },
  {
    target: 'stats',
    title: 'Seus Números',
    description: 'Acompanhe o total de registros, quantos foram confirmados e quantos estão pendentes de confirmação.',
  },
  {
    target: 'novo-registro',
    title: 'Novo Registro de Visita',
    description: 'Crie fichas de visita com confirmação via WhatsApp. É rápido e seguro!',
  },
  {
    target: 'ver-registros',
    title: 'Seus Registros',
    description: 'Consulte, filtre e gerencie todas as suas fichas de visita em um só lugar.',
  },
  {
    target: 'indicacoes',
    title: 'Indique e Ganhe 💰',
    description: 'Indique corretores e imobiliárias para o VisitaProva e ganhe comissão por cada indicação!',
  },
  {
    target: 'nav-menu',
    title: 'Navegação',
    description: 'Use o menu inferior para navegar entre as seções: Início, Registros, Convites e Perfil.',
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { imobiliaria, role, imobiliariaId } = useUserRole();
  const isCorretorVinculado = role === 'corretor' && !!imobiliariaId;
  const queryClient = useQueryClient();
  const { data: convitesPendentes = 0 } = useConvitesPendentes();

  // Query para buscar parcerias ativas com construtoras
  const { data: parceriasConstrutoras = [] } = useQuery({
    queryKey: ['parcerias-construtoras-dashboard', imobiliariaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('construtora_imobiliarias')
        .select('id, construtora_id, construtoras!construtora_imobiliarias_construtora_id_fkey(nome)')
        .eq('imobiliaria_id', imobiliariaId!)
        .eq('status', 'ativa');
      if (error) throw error;
      return data || [];
    },
    enabled: !!imobiliariaId,
  });
  const [showDebug, setShowDebug] = useState(false);
  const [showIndicaPulse, setShowIndicaPulse] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowIndicaPulse(false), 30000);
    return () => clearTimeout(timer);
  }, []);
  
  // Verificar se pesquisa pós-visita está habilitada
  const { enabled: surveyEnabled } = useImobiliariaFeatureFlag('post_visit_survey');
  
  // Hook para verificar se é líder de equipe
  const { isLider, equipesLideradas, loading: liderLoading } = useEquipeLider();

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
    queryKey: ['dashboard-stats', user?.id, surveyEnabled],
    queryFn: async () => {
      if (!user) return null;
      
      // Buscar fichas (dono + parceiro), clientes e pesquisas em paralelo
      const [fichasResult, clientes, surveysResult] = await Promise.all([
        supabase
          .from('fichas_visita')
          .select('status, corretor_parceiro_id, user_id')
          .or(`user_id.eq.${user.id},corretor_parceiro_id.eq.${user.id}`),
        supabase
          .from('clientes')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        // Buscar pesquisas apenas se a feature estiver habilitada
        surveyEnabled 
          ? supabase
              .from('surveys')
              .select('status')
              .eq('corretor_id', user.id)
          : Promise.resolve({ data: [] }),
      ]);

      const todasFichas = fichasResult.data || [];
      const surveysData = surveysResult.data || [];
      
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
        // Stats de pesquisas (só se feature habilitada)
        surveys: {
          total: surveysData.length,
          respondidas: surveysData.filter(s => s.status === 'responded').length,
          pendentes: surveysData.filter(s => s.status === 'pending' || s.status === 'sent').length,
        },
      };
    },
    enabled: !!user,
    staleTime: 30000, // 30 segundos antes de considerar stale
    refetchOnWindowFocus: false,
  });

  // Query para buscar resumo da equipe (apenas para líderes)
  const { data: teamSummary } = useQuery({
    queryKey: ['team-summary', user?.id, equipesLideradas],
    queryFn: async () => {
      if (!equipesLideradas.length) return null;
      
      const equipeIds = equipesLideradas.map(e => e.id);
      
      // Buscar membros da equipe
      const { data: membrosData } = await supabase
        .from('equipes_membros')
        .select('user_id')
        .in('equipe_id', equipeIds);
      
      const userIds = membrosData?.map(m => m.user_id) || [];
      
      if (userIds.length === 0) {
        return {
          totalMembros: 0,
          membrosAtivos: 0,
          fichasMes: 0,
          nomeEquipe: equipesLideradas.map(e => e.nome).join(', '),
          corEquipe: equipesLideradas[0]?.cor || '#3B82F6',
        };
      }
      
      // Buscar perfis para contar ativos e fichas do mês em paralelo
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const [profilesResult, fichasResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('ativo')
          .in('user_id', userIds),
        supabase
          .from('fichas_visita')
          .select('id', { count: 'exact', head: true })
          .in('user_id', userIds)
          .gte('data_visita', startOfMonth.toISOString()),
      ]);
      
      return {
        totalMembros: userIds.length,
        membrosAtivos: profilesResult.data?.filter(p => p.ativo).length || 0,
        fichasMes: fichasResult.count || 0,
        nomeEquipe: equipesLideradas.map(e => e.nome).join(', '),
        corEquipe: equipesLideradas[0]?.cor || '#3B82F6',
      };
    },
    enabled: isLider && equipesLideradas.length > 0 && !liderLoading,
    staleTime: 60000, // 1 minuto
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
              {imobiliaria?.nome || 'VisitaProva'}
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8">
        {/* PWA Install Banner */}
        <PWAInstallBanner />

        {/* Upgrade Banner for free plan users - hide for linked brokers */}
        {!isCorretorVinculado && <UpgradeBanner className="mb-4" />}

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

      {/* Card de Resumo da Equipe para Líderes */}
      {isLider && teamSummary && (
        <Card 
          className="mb-4 border-cyan-500/30 bg-cyan-500/5 dark:border-cyan-400/30 dark:bg-cyan-400/5 cursor-pointer hover:shadow-medium transition-all animate-fade-in"
          onClick={() => navigate('/minha-equipe')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div 
                className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${teamSummary.corEquipe}20` }}
              >
                <UsersRound className="h-6 w-6" style={{ color: teamSummary.corEquipe }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-cyan-700 dark:text-cyan-300">
                  {teamSummary.nomeEquipe}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {teamSummary.membrosAtivos}/{teamSummary.totalMembros} ativos
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {teamSummary.fichasMes} registros este mês
                  </span>
                </div>
              </div>
              <Badge variant="outline" className="text-cyan-600 dark:text-cyan-400 border-cyan-500/30 shrink-0 hidden sm:flex">
                Líder
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

        {/* Welcome Section */}
        <div data-tour="welcome" className="mb-4 md:mb-8">
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

        {/* Stats Grid - 3 cols on desktop */}
        <div data-tour="stats" className="grid grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
          <Card 
            className="animate-fade-in cursor-pointer hover:shadow-medium hover:scale-[1.02] transition-all group"
            onClick={() => navigate('/fichas')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                Total Registros
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0 flex items-center justify-between">
              <div className="text-xl md:text-2xl font-bold">{stats?.totalFichas || 0}</div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>

          <Card 
            className="animate-fade-in cursor-pointer hover:shadow-medium hover:scale-[1.02] transition-all group" 
            style={{ animationDelay: '0.1s' }}
            onClick={() => navigate('/fichas?status=completo')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                Confirmadas
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0 flex items-center justify-between">
              <div className="text-xl md:text-2xl font-bold text-success">{stats?.fichasCompletas || 0}</div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-success transition-colors" />
            </CardContent>
          </Card>

          <Card 
            className="animate-fade-in cursor-pointer hover:shadow-medium hover:scale-[1.02] transition-all group" 
            style={{ animationDelay: '0.2s' }}
            onClick={() => navigate('/fichas?status=pendente')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                Pendentes
              </CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0 flex items-center justify-between">
              <div className="text-xl md:text-2xl font-bold text-warning">{stats?.fichasPendentes || 0}</div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-warning transition-colors" />
            </CardContent>
          </Card>
        </div>

        {/* Card de Fichas como Parceiro */}
        {fichasParceiro && fichasParceiro.total > 0 && (
          <Card 
            className="animate-fade-in cursor-pointer border-0 bg-card/80 backdrop-blur-sm shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all mb-4"
            style={{ animationDelay: '0.4s' }}
            onClick={() => navigate('/fichas-parceiro')}
          >
            <CardContent className="px-3 py-2 flex items-center gap-3">
              <Handshake className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {fichasParceiro.total} {fichasParceiro.total === 1 ? 'registro como parceiro' : 'registros como parceiro'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {fichasParceiro.pendentes > 0 
                    ? `${fichasParceiro.pendentes} pendente${fichasParceiro.pendentes > 1 ? 's' : ''} de confirmação`
                    : 'Todas confirmadas'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Card de Pesquisas Pós-Visita */}
        {surveyEnabled && stats?.surveys && stats.surveys.total > 0 && (
          <Card 
            className="animate-fade-in cursor-pointer border-0 bg-card/80 backdrop-blur-sm shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all mb-6"
            style={{ animationDelay: '0.5s' }}
            onClick={() => navigate('/pesquisas')}
          >
            <CardContent className="p-3 flex items-center gap-3">
              <div className="shrink-0">
                <PieChart width={44} height={44}>
                  <Pie
                    data={[
                      { value: stats.surveys.respondidas },
                      { value: stats.surveys.pendentes },
                    ]}
                    cx={22}
                    cy={22}
                    innerRadius={13}
                    outerRadius={20}
                    dataKey="value"
                    strokeWidth={0}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <Cell fill="hsl(270, 70%, 55%)" />
                    <Cell fill="hsl(var(--muted))" />
                  </Pie>
                </PieChart>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  {stats.surveys.respondidas} de {stats.surveys.total} pesquisas respondidas
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.surveys.pendentes > 0 
                    ? `${stats.surveys.pendentes} aguardando resposta`
                    : 'Todas respondidas'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plan Usage Card - Compact version for Dashboard - hide for linked brokers */}
        {!isCorretorVinculado && <PlanUsageCard compact className="mb-6 animate-fade-in" />}

        {/* Card de Indicações */}
        <Card 
          data-tour="indicacoes"
          className={`animate-fade-in cursor-pointer hover:shadow-medium transition-all border-teal-500/20 bg-teal-500/5 dark:border-teal-400/20 dark:bg-teal-400/5 mb-6 ${showIndicaPulse ? 'animate-attention-pulse' : ''}`}
          onClick={() => navigate('/minhas-indicacoes')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-teal-500/20 dark:bg-teal-400/20 flex items-center justify-center shrink-0">
              <Share2 className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-teal-700 dark:text-teal-300">
                Indique e Ganhe
              </p>
              <p className="text-sm text-muted-foreground">
                Indique corretores e imobiliárias e ganhe comissão
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>

        {/* Quick Actions - vertical on mobile, grid on desktop */}
        <div className="hidden sm:grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

          {parceriasConstrutoras.length > 0 && (
            <Card 
              className="cursor-pointer hover:shadow-medium transition-shadow group border-orange-500/20"
              onClick={() => navigate('/fichas/nova?modo=construtora')}
            >
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-orange-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Building2 className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Registro Construtoras</CardTitle>
                <CardDescription>
                  Crie fichas para empreendimentos de construtoras parceiras
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          <Card 
            className="cursor-pointer hover:shadow-medium transition-shadow group"
            onClick={() => navigate('/fichas')}
          >
            <CardHeader>
              <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText className="h-6 w-6 text-secondary-foreground" />
              </div>
              <CardTitle>Ver Registros</CardTitle>
              <CardDescription>
                Visualize e gerencie seus registros
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-medium transition-shadow group"
            onClick={() => navigate('/convites')}
          >
            <CardHeader>
              <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Handshake className="h-6 w-6 text-secondary-foreground" />
              </div>
              <CardTitle>Convites</CardTitle>
              <CardDescription>
                Gerencie convites de parceria
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-medium transition-shadow group"
            onClick={() => window.open('https://wa.me/5515981788214?text=Olá, preciso de ajuda jurídica sobre intermediação imobiliária', '_blank')}
          >
            <CardHeader>
              <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Scale className="h-6 w-6 text-amber-600" />
              </div>
              <CardTitle>Ajuda Jurídica</CardTitle>
              <CardDescription>
                Consulte um advogado especializado
              </CardDescription>
            </CardHeader>
          </Card>

        </div>

        {/* Mobile Quick Actions - Compact list */}
        <div className="sm:hidden space-y-2">
          <h2 className="font-display text-lg font-semibold mb-3">Ações Rápidas</h2>
          
          <Card 
            data-tour="novo-registro"
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

          {parceriasConstrutoras.length > 0 && (
            <Card 
              className="cursor-pointer active:bg-muted/50 transition-colors border-orange-500/20"
              onClick={() => navigate('/fichas/nova?modo=construtora')}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm">Registro Construtoras</p>
                  <p className="text-xs text-muted-foreground truncate">Fichas para empreendimentos parceiros</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card 
            data-tour="ver-registros"
            className="cursor-pointer active:bg-muted/50 transition-colors"
            onClick={() => navigate('/fichas')}
          >
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm">Ver Registros</p>
                <p className="text-xs text-muted-foreground truncate">Visualizar e gerenciar registros</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer active:bg-muted/50 transition-colors"
            onClick={() => window.open('https://wa.me/5515981788214?text=Olá, preciso de ajuda jurídica sobre intermediação imobiliária', '_blank')}
          >
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                <Scale className="h-5 w-5 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm">Ajuda Jurídica</p>
                <p className="text-xs text-muted-foreground truncate">Consulte um advogado especializado</p>
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

      {/* Onboarding Tour */}
      <OnboardingTour steps={ONBOARDING_STEPS} />

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
