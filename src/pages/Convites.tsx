import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Handshake, 
  MapPin, 
  Calendar, 
  User, 
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Inbox,
  Send,
  PlayCircle,
  FileEdit,
  FileText,
  Phone,
  RefreshCw
} from 'lucide-react';
import { MobileNav } from '@/components/MobileNav';
import { DesktopNav } from '@/components/DesktopNav';
import { format, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useConvitesPendentes } from '@/hooks/useConvitesPendentes';

interface ConviteParceiro {
  id: string;
  ficha_id: string;
  corretor_origem_id: string;
  corretor_parceiro_id: string | null;
  corretor_parceiro_telefone: string;
  parte_faltante: string;
  status: string;
  token: string;
  expira_em: string;
  created_at: string;
}

interface FichaDetalhe {
  id: string;
  imovel_endereco: string;
  imovel_tipo: string;
  data_visita: string;
  proprietario_telefone: string | null;
  comprador_telefone: string | null;
  proprietario_confirmado_em: string | null;
  comprador_confirmado_em: string | null;
}

type ConviteState = 'aguardando_dados' | 'aguardando_confirmacao' | 'completo';

const getConviteState = (convite: ConviteParceiro, ficha?: FichaDetalhe): ConviteState => {
  if (!ficha) return 'aguardando_dados';
  
  const parte = convite.parte_faltante;
  const telefone = parte === 'proprietario' 
    ? ficha.proprietario_telefone 
    : ficha.comprador_telefone;
  const confirmado = parte === 'proprietario'
    ? ficha.proprietario_confirmado_em
    : ficha.comprador_confirmado_em;
    
  if (confirmado) return 'completo';
  if (telefone) return 'aguardando_confirmacao';
  return 'aguardando_dados';
};

export default function Convites() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const activeTab = searchParams.get('tab') || 'recebidos';
  const { data: convitesPendentesCount = 0 } = useConvitesPendentes();

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  // Cache do telefone do usuário
  const { data: userTelefone } = useQuery({
    queryKey: ['user-profile-telefone', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('telefone')
        .eq('user_id', user!.id)
        .single();
      return data?.telefone?.replace(/\D/g, '') || '';
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // ========== RECEBIDOS (query otimizada com JOIN) ==========
  const { data: convitesRecebidosRaw, isLoading: loadingRecebidos } = useQuery({
    queryKey: ['convites-recebidos', user?.id, userTelefone],
    queryFn: async () => {
      if (!user) return [];
      
      const telefoneNormalizado = userTelefone || '';
      
      let query = supabase
        .from('convites_parceiro')
        .select(`
          *,
          ficha:fichas_visita(
            id, imovel_endereco, imovel_tipo, data_visita,
            proprietario_telefone, comprador_telefone,
            proprietario_confirmado_em, comprador_confirmado_em
          )
        `)
        .neq('corretor_origem_id', user.id)
        .order('created_at', { ascending: false });
      
      if (telefoneNormalizado) {
        query = query.or(`corretor_parceiro_id.eq.${user.id},corretor_parceiro_telefone.eq.${telefoneNormalizado}`);
      } else {
        query = query.eq('corretor_parceiro_id', user.id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user && userTelefone !== undefined,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Buscar nomes dos corretores separadamente
  const { data: corretoresRecebidosMap } = useQuery({
    queryKey: ['convites-recebidos-corretores', convitesRecebidosRaw?.map(c => c.corretor_origem_id)],
    queryFn: async () => {
      if (!convitesRecebidosRaw || convitesRecebidosRaw.length === 0) return {};
      const corretorIds = [...new Set(convitesRecebidosRaw.map(c => c.corretor_origem_id))];
      const { data } = await supabase
        .from('profiles')
        .select('user_id, nome')
        .in('user_id', corretorIds);
      
      const map: Record<string, string> = {};
      data?.forEach(c => { map[c.user_id] = c.nome; });
      return map;
    },
    enabled: !!convitesRecebidosRaw && convitesRecebidosRaw.length > 0,
  });

  const convitesRecebidos = convitesRecebidosRaw;

  // Processar dados dos convites recebidos para mapas
  const detalhesRecebidos = useMemo(() => {
    if (!convitesRecebidosRaw || convitesRecebidosRaw.length === 0) return {};
    
    const fichasMap: Record<string, FichaDetalhe> = {};
    
    convitesRecebidosRaw.forEach(c => {
      if (c.ficha) fichasMap[c.ficha.id] = c.ficha as FichaDetalhe;
    });
    
    return { fichas: fichasMap, corretores: corretoresRecebidosMap || {} };
  }, [convitesRecebidosRaw, corretoresRecebidosMap]);

  // ========== ENVIADOS ==========
  const { data: convitesEnviados, isLoading: loadingEnviados } = useQuery({
    queryKey: ['convites-enviados', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('convites_parceiro')
        .select('*')
        .eq('corretor_origem_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ConviteParceiro[];
    },
    enabled: !!user,
  });

  const { data: fichasEnviadosMap } = useQuery({
    queryKey: ['convites-enviados-fichas', convitesEnviados?.map(c => c.ficha_id)],
    queryFn: async () => {
      if (!convitesEnviados || convitesEnviados.length === 0) return {};
      
      const fichaIds = convitesEnviados.map(c => c.ficha_id);
      const { data } = await supabase
        .from('fichas_visita')
        .select('id, imovel_endereco, imovel_tipo, data_visita')
        .in('id', fichaIds);
      
      const map: Record<string, any> = {};
      data?.forEach(f => { map[f.id] = f; });
      return map;
    },
    enabled: !!convitesEnviados && convitesEnviados.length > 0,
  });

  const { data: parceirosEnviadosMap } = useQuery({
    queryKey: ['convites-enviados-parceiros', convitesEnviados?.map(c => c.corretor_parceiro_id).filter(Boolean)],
    queryFn: async () => {
      if (!convitesEnviados) return {};
      
      const parceiroIds = convitesEnviados
        .map(c => c.corretor_parceiro_id)
        .filter((id): id is string => !!id);
      
      if (parceiroIds.length === 0) return {};
      
      const { data } = await supabase
        .from('profiles')
        .select('user_id, nome')
        .in('user_id', parceiroIds);
      
      const map: Record<string, string> = {};
      data?.forEach(p => { map[p.user_id] = p.nome; });
      return map;
    },
    enabled: !!convitesEnviados,
  });

  // ========== MUTATIONS ==========
  // Função para abrir a página de detalhes do convite
  // A aceitação é centralizada em ConviteParceiro.tsx para garantir consistência
  const handleAbrirConvite = (convite: ConviteParceiro) => {
    navigate(`/convite-parceiro/${convite.token}`);
  };

  const recusarMutation = useMutation({
    mutationFn: async (conviteId: string) => {
      const { error } = await supabase
        .from('convites_parceiro')
        .update({ status: 'recusado' })
        .eq('id', conviteId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Convite recusado');
      queryClient.invalidateQueries({ queryKey: ['convites-recebidos'] });
    },
    onError: () => toast.error('Erro ao recusar o convite'),
  });

  const reenviarMutation = useMutation({
    mutationFn: async (convite: ConviteParceiro) => {
      // Update existing invite with new expiration and reset status to pendente
      const novaExpiracao = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const { error } = await supabase
        .from('convites_parceiro')
        .update({ 
          status: 'pendente',
          expira_em: novaExpiracao,
          updated_at: new Date().toISOString()
        })
        .eq('id', convite.id);
      
      if (error) throw error;
      return convite;
    },
    onSuccess: (convite) => {
      toast.success(`Convite reenviado para ${formatPhone(convite.corretor_parceiro_telefone)}`);
      queryClient.invalidateQueries({ queryKey: ['convites-enviados'] });
    },
    onError: () => toast.error('Erro ao reenviar o convite'),
  });

  // ========== HELPERS ==========
  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const getStatusBadge = (status: string, expiraEm: string) => {
    if (isPast(new Date(expiraEm)) && status === 'pendente') {
      return <Badge variant="secondary">Expirado</Badge>;
    }
    switch (status) {
      case 'pendente':
        return <Badge variant="warning">Pendente</Badge>;
      case 'aceito':
        return <Badge variant="success">Aceito</Badge>;
      case 'recusado':
        return <Badge variant="destructive">Recusado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Categorize received invites
  const convitesPendentesRecebidos = convitesRecebidos?.filter(c => 
    c.status === 'pendente' && !isPast(new Date(c.expira_em))
  ) || [];
  
  const convitesEmAndamento = convitesRecebidos?.filter(c => {
    if (c.status !== 'aceito') return false;
    const ficha = detalhesRecebidos?.fichas?.[c.ficha_id];
    const state = getConviteState(c, ficha);
    return state !== 'completo';
  }) || [];
  
  const convitesHistoricoRecebidos = convitesRecebidos?.filter(c => {
    if (c.status === 'recusado') return true;
    if (c.status === 'pendente' && isPast(new Date(c.expira_em))) return true;
    if (c.status === 'aceito') {
      const ficha = detalhesRecebidos?.fichas?.[c.ficha_id];
      const state = getConviteState(c, ficha);
      return state === 'completo';
    }
    return false;
  }) || [];

  // Categorize sent invites
  const convitesPendentesEnviados = convitesEnviados?.filter(c => 
    c.status === 'pendente' && !isPast(new Date(c.expira_em))
  ) || [];
  
  const convitesAceitosEnviados = convitesEnviados?.filter(c => c.status === 'aceito') || [];
  
  const convitesOutrosEnviados = convitesEnviados?.filter(c => 
    c.status === 'recusado' || (c.status === 'pendente' && isPast(new Date(c.expira_em)))
  ) || [];

  const isLoading = loadingRecebidos || loadingEnviados;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      <DesktopNav />
      
      {/* Mobile Header */}
      <header className="sm:hidden border-b bg-card safe-area-top">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Handshake className="h-5 w-5 text-primary" />
            <span className="font-display text-lg font-bold">Convites</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-display text-2xl md:text-3xl font-bold hidden sm:block">
              Convites de Parceria
            </h1>
            <Button 
              variant="outline" 
              onClick={() => navigate('/fichas-parceiro')}
              className="hidden sm:flex"
            >
              <FileText className="h-4 w-4 mr-2" />
              Fichas como Parceiro
            </Button>
          </div>
          <p className="text-muted-foreground hidden sm:block">
            Gerencie seus convites de parceria recebidos e enviados
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full mb-6">
            <TabsTrigger value="recebidos" className="flex-1 gap-2">
              <Inbox className="h-4 w-4" />
              Recebidos
              {convitesPendentesCount > 0 && (
                <Badge className="ml-1 h-5 min-w-5 px-1.5 text-[10px]">
                  {convitesPendentesCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="enviados" className="flex-1 gap-2">
              <Send className="h-4 w-4" />
              Enviados
            </TabsTrigger>
          </TabsList>

          {/* TAB RECEBIDOS */}
          <TabsContent value="recebidos" className="space-y-6">
            {/* Pendentes */}
            {convitesPendentesRecebidos.length > 0 && (
              <div>
                <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-warning" />
                  Pendentes ({convitesPendentesRecebidos.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {convitesPendentesRecebidos.map((convite) => {
                    const ficha = detalhesRecebidos?.fichas?.[convite.ficha_id];
                    const corretorNome = detalhesRecebidos?.corretores?.[convite.corretor_origem_id];
                    
                    return (
                      <Card key={convite.id} className="border-warning/30 bg-warning/5">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-base font-medium line-clamp-1">
                              {ficha?.imovel_tipo || 'Imóvel'}
                            </CardTitle>
                            {getStatusBadge(convite.status, convite.expira_em)}
                          </div>
                          <CardDescription className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="line-clamp-1">{ficha?.imovel_endereco || 'Endereço não disponível'}</span>
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>Enviado por: <strong className="text-foreground">{corretorNome || 'Corretor'}</strong></span>
                          </div>
                          
                          {ficha?.data_visita && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>Visita: {format(new Date(ficha.data_visita), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                            </div>
                          )}
                          
                          <Badge variant="outline" className="text-xs">
                            Preencher: {convite.parte_faltante === 'comprador' ? 'Comprador' : 'Proprietário'}
                          </Badge>
                          
                          <div className="text-xs text-muted-foreground">
                            Expira em: {format(new Date(convite.expira_em), "dd/MM 'às' HH:mm", { locale: ptBR })}
                          </div>
                          
                          <div className="flex gap-2 pt-2">
                            <Button 
                              className="flex-1" 
                              size="sm"
                              onClick={() => handleAbrirConvite(convite)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Ver Convite
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => recusarMutation.mutate(convite.id)}
                              disabled={recusarMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Recusar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Em Andamento */}
            {convitesEmAndamento.length > 0 && (
              <div>
                <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                  <PlayCircle className="h-5 w-5 text-primary" />
                  Em Andamento ({convitesEmAndamento.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {convitesEmAndamento.map((convite) => {
                    const ficha = detalhesRecebidos?.fichas?.[convite.ficha_id];
                    const corretorNome = detalhesRecebidos?.corretores?.[convite.corretor_origem_id];
                    const state = getConviteState(convite, ficha);
                    
                    return (
                      <Card key={convite.id} className="border-primary/30 bg-primary/5">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-base font-medium line-clamp-1">
                              {ficha?.imovel_tipo || 'Imóvel'}
                            </CardTitle>
                            {state === 'aguardando_dados' ? (
                              <Badge variant="warning" className="flex items-center gap-1">
                                <FileEdit className="h-3 w-3" />
                                Aguardando dados
                              </Badge>
                            ) : (
                              <Badge variant="default" className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Aguardando confirmação
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="line-clamp-1">{ficha?.imovel_endereco || 'Endereço não disponível'}</span>
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>Parceria com: <strong className="text-foreground">{corretorNome || 'Corretor'}</strong></span>
                          </div>
                          
                          {ficha?.data_visita && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>Visita: {format(new Date(ficha.data_visita), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                            </div>
                          )}
                          
                          <Badge variant="outline" className="text-xs">
                            Preencher: {convite.parte_faltante === 'comprador' ? 'Comprador' : 'Proprietário'}
                          </Badge>
                          
                          <Button 
                            className="w-full" 
                            size="sm"
                            onClick={() => navigate(`/convite-parceiro/${convite.token}`)}
                          >
                            {state === 'aguardando_dados' ? 'Preencher Dados' : 'Ver Ficha'}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Histórico */}
            {convitesHistoricoRecebidos.length > 0 && (
              <div>
                <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                  Histórico ({convitesHistoricoRecebidos.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {convitesHistoricoRecebidos.map((convite) => {
                    const ficha = detalhesRecebidos?.fichas?.[convite.ficha_id];
                    const corretorNome = detalhesRecebidos?.corretores?.[convite.corretor_origem_id];
                    
                    return (
                      <Card key={convite.id} className="opacity-60">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-base font-medium line-clamp-1">
                              {ficha?.imovel_tipo || 'Imóvel'}
                            </CardTitle>
                            {getStatusBadge(convite.status, convite.expira_em)}
                          </div>
                          <CardDescription className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="line-clamp-1">{ficha?.imovel_endereco || 'Endereço não disponível'}</span>
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>Enviado por: <strong className="text-foreground">{corretorNome || 'Corretor'}</strong></span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty State Recebidos */}
            {(!convitesRecebidos || convitesRecebidos.length === 0) && (
              <Card className="text-center py-12">
                <CardContent className="space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Inbox className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Nenhum convite recebido</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Você ainda não recebeu convites de parceria de outros corretores.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TAB ENVIADOS */}
          <TabsContent value="enviados" className="space-y-6">
            {/* Stats Summary */}
            {convitesEnviados && convitesEnviados.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                <Card className="text-center">
                  <CardContent className="pt-4 pb-3">
                    <div className="text-2xl font-bold text-warning">{convitesPendentesEnviados.length}</div>
                    <div className="text-xs text-muted-foreground">Aguardando</div>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="pt-4 pb-3">
                    <div className="text-2xl font-bold text-success">{convitesAceitosEnviados.length}</div>
                    <div className="text-xs text-muted-foreground">Aceitos</div>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="pt-4 pb-3">
                    <div className="text-2xl font-bold text-muted-foreground">{convitesOutrosEnviados.length}</div>
                    <div className="text-xs text-muted-foreground">Outros</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Pendentes Enviados */}
            {convitesPendentesEnviados.length > 0 && (
              <div>
                <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-warning" />
                  Aguardando Resposta ({convitesPendentesEnviados.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {convitesPendentesEnviados.map((convite) => {
                    const ficha = fichasEnviadosMap?.[convite.ficha_id];
                    
                    return (
                      <Card key={convite.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-base font-medium line-clamp-1">
                              {ficha?.imovel_tipo || 'Imóvel'}
                            </CardTitle>
                            {getStatusBadge(convite.status, convite.expira_em)}
                          </div>
                          <CardDescription className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="line-clamp-1">{ficha?.imovel_endereco || 'Endereço não disponível'}</span>
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>Enviado para: <strong className="text-foreground">{formatPhone(convite.corretor_parceiro_telefone)}</strong></span>
                          </div>
                          
                          {ficha?.data_visita && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>Visita: {format(new Date(ficha.data_visita), "dd/MM/yyyy", { locale: ptBR })}</span>
                            </div>
                          )}
                          
                          <Badge variant="outline" className="text-xs">
                            Parceiro preenche: {convite.parte_faltante === 'comprador' ? 'Comprador' : 'Proprietário'}
                          </Badge>
                          
                          <div className="text-xs text-muted-foreground pt-1">
                            Enviado em: {format(new Date(convite.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </div>
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full mt-2"
                            onClick={() => navigate(`/fichas/${convite.ficha_id}`)}
                          >
                            Ver Ficha
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Aceitos Enviados */}
            {convitesAceitosEnviados.length > 0 && (
              <div>
                <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  Aceitos ({convitesAceitosEnviados.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {convitesAceitosEnviados.map((convite) => {
                    const ficha = fichasEnviadosMap?.[convite.ficha_id];
                    const parceiroNome = convite.corretor_parceiro_id ? parceirosEnviadosMap?.[convite.corretor_parceiro_id] : null;
                    
                    return (
                      <Card key={convite.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-base font-medium line-clamp-1">
                              {ficha?.imovel_tipo || 'Imóvel'}
                            </CardTitle>
                            {getStatusBadge(convite.status, convite.expira_em)}
                          </div>
                          <CardDescription className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="line-clamp-1">{ficha?.imovel_endereco || 'Endereço não disponível'}</span>
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>Enviado para: <strong className="text-foreground">{formatPhone(convite.corretor_parceiro_telefone)}</strong></span>
                          </div>
                          
                          {parceiroNome && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <User className="h-4 w-4" />
                              <span>Parceiro: <strong className="text-foreground">{parceiroNome}</strong></span>
                            </div>
                          )}
                          
                          {ficha?.data_visita && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>Visita: {format(new Date(ficha.data_visita), "dd/MM/yyyy", { locale: ptBR })}</span>
                            </div>
                          )}
                          
                          <Badge variant="outline" className="text-xs">
                            Parceiro preenche: {convite.parte_faltante === 'comprador' ? 'Comprador' : 'Proprietário'}
                          </Badge>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Outros (Recusados/Expirados) */}
            {convitesOutrosEnviados.length > 0 && (
              <div>
                <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                  Recusados / Expirados ({convitesOutrosEnviados.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {convitesOutrosEnviados.map((convite) => {
                    const ficha = fichasEnviadosMap?.[convite.ficha_id];
                    const isExpired = isPast(new Date(convite.expira_em)) && convite.status === 'pendente';
                    
                    return (
                      <Card key={convite.id} className={isExpired ? 'opacity-80' : ''}>
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-base font-medium line-clamp-1">
                              {ficha?.imovel_tipo || 'Imóvel'}
                            </CardTitle>
                            {getStatusBadge(convite.status, convite.expira_em)}
                          </div>
                          <CardDescription className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="line-clamp-1">{ficha?.imovel_endereco || 'Endereço não disponível'}</span>
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>Enviado para: <strong className="text-foreground">{formatPhone(convite.corretor_parceiro_telefone)}</strong></span>
                          </div>
                          
                          <div className="text-xs text-muted-foreground pt-1">
                            Enviado em: {format(new Date(convite.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </div>
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full mt-2"
                            onClick={() => reenviarMutation.mutate(convite)}
                            disabled={reenviarMutation.isPending}
                          >
                            <RefreshCw className={`h-4 w-4 mr-1 ${reenviarMutation.isPending ? 'animate-spin' : ''}`} />
                            Reenviar Convite
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty State Enviados */}
            {(!convitesEnviados || convitesEnviados.length === 0) && (
              <Card className="text-center py-12">
                <CardContent className="space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Send className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Nenhum convite enviado</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Você ainda não enviou convites de parceria. Crie um registro de visita e convide um parceiro!
                    </p>
                  </div>
                  <Button onClick={() => navigate('/fichas/nova')}>
                    Criar Novo Registro
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Mobile link to Fichas Parceiro */}
        <div className="sm:hidden mt-6">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => navigate('/fichas-parceiro')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Fichas como Parceiro
          </Button>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
