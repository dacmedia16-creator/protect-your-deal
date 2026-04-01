import { useEffect, useState, useMemo } from 'react';
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
import { Progress } from '@/components/ui/progress';
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
import { UserAvatar } from '@/components/UserAvatar';

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

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

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
      queryClient.clear();
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
      }
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

  // Query para buscar o perfil do usuário (incluindo foto)
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('nome, foto_url')
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
      
      const [fichasResult, clientes, surveysResult] = await Promise.all([
        supabase
          .from('fichas_visita')
          .select('status, corretor_parceiro_id, user_id')
          .or(`user_id.eq.${user.id},corretor_parceiro_id.eq.${user.id}`),
        supabase
          .from('clientes')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        surveyEnabled 
          ? supabase
              .from('surveys')
              .select('status')
              .eq('corretor_id', user.id)
          : Promise.resolve({ data: [] }),
      ]);

      const todasFichas = fichasResult.data || [];
      const surveysData = surveysResult.data || [];
      const fichasComoParceiro = todasFichas.filter(f => f.corretor_parceiro_id === user.id);
      
      return {
        totalFichas: todasFichas.length,
        fichasCompletas: todasFichas.filter(f => isFichaConfirmada(f.status)).length,
        fichasPendentes: todasFichas.filter(f => isFichaPendente(f.status)).length,
        totalClientes: clientes.count || 0,
        fichasParceiro: {
          total: fichasComoParceiro.length,
          pendentes: fichasComoParceiro.filter(f => isFichaPendente(f.status)).length,
        },
        surveys: {
          total: surveysData.length,
          respondidas: surveysData.filter(s => s.status === 'responded').length,
          pendentes: surveysData.filter(s => s.status === 'pending' || s.status === 'sent').length,
        },
      };
    },
    enabled: !!user,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  // Query para buscar resumo da equipe (apenas para líderes)
  const { data: teamSummary } = useQuery({
    queryKey: ['team-summary', user?.id, equipesLideradas],
    queryFn: async () => {
      if (!equipesLideradas.length) return null;
      
      const equipeIds = equipesLideradas.map(e => e.id);
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
      
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const [profilesResult, fichasResult] = await Promise.all([
        supabase.from('profiles').select('ativo').in('user_id', userIds),
        supabase.from('fichas_visita').select('id', { count: 'exact', head: true }).in('user_id', userIds).gte('data_visita', startOfMonth.toISOString()),
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
    staleTime: 60000,
  });

  const stats = dashboardData;
  const fichasParceiro = dashboardData?.fichasParceiro;
  const greeting = useMemo(() => getGreeting(), []);
  const firstName = profile?.nome?.split(' ')[0] || 'Usuário';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  // Mobile quick action items for the icon grid
  const mobileActions = [
    { 
      label: 'Novo Registro', 
      icon: Plus, 
      onClick: () => navigate('/fichas/nova'), 
      className: 'gradient-primary text-primary-foreground',
      dataTour: 'novo-registro',
    },
    { 
      label: 'Registros', 
      icon: FileText, 
      onClick: () => navigate('/fichas'), 
      className: 'bg-secondary text-secondary-foreground',
      dataTour: 'ver-registros',
    },
    ...(parceriasConstrutoras.length > 0 ? [{
      label: 'Construtoras',
      icon: Building2,
      onClick: () => navigate('/fichas/nova?modo=construtora'),
      className: 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
    }] : []),
    { 
      label: 'Convites', 
      icon: Handshake, 
      onClick: () => navigate('/convites'), 
      className: 'bg-secondary text-secondary-foreground',
    },
    ...(parceriasConstrutoras.length === 0 ? [{
      label: 'Ajuda Jurídica',
      icon: Scale,
      onClick: () => window.open('https://wa.me/5515981788214?text=Olá, preciso de ajuda jurídica sobre intermediação imobiliária', '_blank'),
      className: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
    }] : []),
  ];

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      {/* Desktop Navigation */}
      <DesktopNav />
      
      {/* ===== MOBILE HEADER with Gradient ===== */}
      <header className="sm:hidden relative bg-gradient-to-br from-primary to-slate-900 dark:from-primary dark:to-slate-950 rounded-b-3xl safe-area-top">
        <div className="px-5 pt-4 pb-14">
          {/* Top bar: logo + brand */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              {imobiliaria?.logo_url ? (
                <img 
                  src={imobiliaria.logo_url} 
                  alt={imobiliaria.nome} 
                  className="h-7 w-7 rounded-lg object-contain bg-white/20 p-0.5"
                />
              ) : (
                <div className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center">
                  <FileText className="h-3.5 w-3.5 text-white" />
                </div>
              )}
              <span className="font-display text-sm font-semibold text-white/80 truncate max-w-[140px]">
                {imobiliaria?.nome || 'VisitaProva'}
              </span>
            </div>
          </div>

          {/* Welcome with avatar */}
          <div data-tour="welcome" className="flex items-center gap-3">
            <UserAvatar 
              name={profile?.nome || undefined} 
              imageUrl={profile?.foto_url || undefined}
              role={role || 'corretor'}
              size="lg"
              className="ring-2 ring-white/30"
            />
            <div>
              <p className="text-white/70 text-sm">{greeting},</p>
              <h1 
                className="font-display text-xl font-bold text-white cursor-default"
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
                {firstName}!
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* ===== DESKTOP HEADER (unchanged) ===== */}
      {/* Desktop welcome is inside main below */}

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

        {/* Welcome Section - Desktop Only */}
        <div data-tour="welcome" className="mb-4 md:mb-8 hidden sm:block">
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
            Bem-vindo, {firstName}!
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Gerencie seus registros de visita e clientes
          </p>
        </div>

        {/* ===== MOBILE: Floating Stats Card ===== */}
        <div data-tour="stats" className="sm:hidden -mt-10 mb-5">
          <Card className="shadow-lg rounded-2xl border-0">
            <CardContent className="p-0">
              <div className="grid grid-cols-3 divide-x divide-border">
                {/* Total */}
                <button 
                  className="p-3 text-center hover:bg-muted/50 transition-colors rounded-l-2xl"
                  onClick={() => navigate('/fichas')}
                >
                  <FileText className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xl font-bold">{stats?.totalFichas || 0}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Total</p>
                </button>

                {/* Confirmadas */}
                <button 
                  className="p-3 text-center hover:bg-muted/50 transition-colors"
                  onClick={() => navigate('/fichas?status=completo')}
                >
                  <CheckCircle className="h-4 w-4 text-success mx-auto mb-1" />
                  <p className="text-xl font-bold text-success">{stats?.fichasCompletas || 0}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Confirmadas</p>
                </button>

                {/* Pendentes - highlighted when > 0 */}
                <button 
                  className={`p-3 text-center transition-colors rounded-r-2xl ${
                    (stats?.fichasPendentes || 0) > 0 
                      ? 'bg-amber-50 dark:bg-amber-950/30' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => navigate('/fichas?status=pendente')}
                >
                  <Clock className="h-4 w-4 text-warning mx-auto mb-1" />
                  {(stats?.fichasPendentes || 0) > 0 ? (
                    <>
                      <p className="text-xl font-bold text-warning">{stats?.fichasPendentes}</p>
                      <p className="text-[10px] text-warning font-medium">Pendentes</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-success mt-0.5">Tudo em dia!</p>
                      <p className="text-[10px] text-muted-foreground">✅</p>
                    </>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ===== DESKTOP: Stats Grid (unchanged) ===== */}
        <div data-tour="stats" className="hidden sm:grid grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
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

        {/* ===== MOBILE: Quick Action Icon Grid ===== */}
        <div className="sm:hidden mb-5">
          <div className="grid grid-cols-4 gap-2">
            {mobileActions.map((action, i) => (
              <button
                key={i}
                data-tour={action.dataTour}
                className="flex flex-col items-center gap-1.5 py-2 active:scale-95 transition-transform"
                onClick={action.onClick}
              >
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${action.className}`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Card de Fichas como Parceiro */}
        {fichasParceiro && fichasParceiro.total > 0 && (
          <Card 
            className="animate-fade-in cursor-pointer hover:border-primary/30 transition-all border-border mb-4"
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

        {/* ===== MOBILE: Horizontal Carousel for secondary cards ===== */}
        <div className="sm:hidden mb-5 -mx-4">
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 pb-2 scrollbar-hide">
            {/* Card Pesquisas Pós-Visita */}
            {surveyEnabled && stats?.surveys && stats.surveys.total > 0 && (
              <Card 
                className="min-w-[260px] snap-start cursor-pointer shadow-soft rounded-2xl border-purple-500/20 bg-purple-500/5 dark:border-purple-400/20 dark:bg-purple-400/5 shrink-0"
                onClick={() => navigate('/pesquisas')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-9 w-9 rounded-xl bg-purple-500/20 dark:bg-purple-400/20 flex items-center justify-center">
                      <ClipboardCheck className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                    </div>
                    <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">Pesquisas</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {stats.surveys.respondidas} de {stats.surveys.total} respondidas
                  </p>
                  <Progress 
                    value={stats.surveys.total > 0 ? (stats.surveys.respondidas / stats.surveys.total) * 100 : 0}
                    className="h-1"
                  />
                </CardContent>
              </Card>
            )}

            {/* Card Indique e Ganhe */}
            <Card 
              data-tour="indicacoes"
              className={`min-w-[260px] snap-start cursor-pointer shadow-soft rounded-2xl border-amber-400/30 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 dark:from-amber-500/5 dark:to-yellow-500/5 shrink-0 ${showIndicaPulse ? 'animate-attention-pulse' : ''}`}
              onClick={() => navigate('/minhas-indicacoes')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-9 w-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Share2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Indique e Ganhe</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Indique corretores e imobiliárias e ganhe comissão por cada indicação
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ===== DESKTOP: Survey card (unchanged) ===== */}
        {surveyEnabled && stats?.surveys && stats.surveys.total > 0 && (
          <Card 
            className="hidden sm:flex animate-fade-in cursor-pointer hover:shadow-medium transition-all border-purple-500/20 bg-purple-500/5 dark:border-purple-400/20 dark:bg-purple-400/5 mb-6"
            style={{ animationDelay: '0.5s' }}
            onClick={() => navigate('/pesquisas')}
          >
            <CardContent className="p-3 flex items-center gap-3 w-full">
              <div className="h-10 w-10 rounded-lg bg-purple-500/20 dark:bg-purple-400/20 flex items-center justify-center shrink-0">
                <ClipboardCheck className="h-5 w-5 text-purple-500 dark:text-purple-400" />
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
                <Progress 
                  value={stats.surveys.total > 0 ? (stats.surveys.respondidas / stats.surveys.total) * 100 : 0}
                  className="h-1 mt-1.5"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plan Usage Card - hide for linked brokers */}
        {!isCorretorVinculado && <PlanUsageCard compact className="mb-6 animate-fade-in" />}

        {/* ===== DESKTOP: Card de Indicações (unchanged) ===== */}
        <Card 
          data-tour="indicacoes"
          className={`hidden sm:flex animate-fade-in cursor-pointer hover:shadow-medium transition-all border-teal-500/20 bg-teal-500/5 dark:border-teal-400/20 dark:bg-teal-400/5 mb-6 ${showIndicaPulse ? 'animate-attention-pulse' : ''}`}
          onClick={() => navigate('/minhas-indicacoes')}
        >
          <CardContent className="p-4 flex items-center gap-4 w-full">
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

        {/* Quick Actions - Desktop only (unchanged) */}
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
      </main>

      {/* Floating Action Button - Desktop only */}
      <div className="hidden sm:block">
        <FloatingActionButton 
          onClick={() => navigate('/fichas/nova')} 
          label="Novo Registro"
        />
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
      
      {/* PWA Install FAB */}
      <PWAInstallFAB />

      {/* Onboarding Tour */}
      <OnboardingTour steps={ONBOARDING_STEPS} />

      {/* Debug Banner */}
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
