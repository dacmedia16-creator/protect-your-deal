import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  FileEdit
} from 'lucide-react';
import { MobileNav } from '@/components/MobileNav';
import { DesktopNav } from '@/components/DesktopNav';
import { format, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface ConviteParceiro {
  id: string;
  ficha_id: string;
  corretor_origem_id: string;
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

export default function ConvitesRecebidos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar convites recebidos
  const { data: convites, isLoading } = useQuery({
    queryKey: ['convites-recebidos', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('convites_parceiro')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ConviteParceiro[];
    },
    enabled: !!user,
  });

  // Buscar detalhes das fichas e corretores
  const { data: detalhes } = useQuery({
    queryKey: ['convites-detalhes', convites?.map(c => c.ficha_id)],
    queryFn: async () => {
      if (!convites || convites.length === 0) return {};
      
      const fichaIds = convites.map(c => c.ficha_id);
      const corretorIds = convites.map(c => c.corretor_origem_id);
      
      const [fichas, corretores] = await Promise.all([
        supabase
          .from('fichas_visita')
          .select('id, imovel_endereco, imovel_tipo, data_visita, proprietario_telefone, comprador_telefone, proprietario_confirmado_em, comprador_confirmado_em')
          .in('id', fichaIds),
        supabase
          .from('profiles')
          .select('user_id, nome')
          .in('user_id', corretorIds)
      ]);
      
      const fichasMap: Record<string, FichaDetalhe> = {};
      const corretoresMap: Record<string, string> = {};
      
      fichas.data?.forEach(f => { fichasMap[f.id] = f as FichaDetalhe; });
      corretores.data?.forEach(c => { corretoresMap[c.user_id] = c.nome; });
      
      return { fichas: fichasMap, corretores: corretoresMap };
    },
    enabled: !!convites && convites.length > 0,
  });

  // Mutation para aceitar convite
  const aceitarMutation = useMutation({
    mutationFn: async (convite: ConviteParceiro) => {
      // Atualizar o convite com o id do usuário
      const { error: conviteError } = await supabase
        .from('convites_parceiro')
        .update({ 
          corretor_parceiro_id: user?.id,
          status: 'aceito'
        })
        .eq('id', convite.id);
      
      if (conviteError) throw conviteError;
      
      // Atualizar a ficha com o id do parceiro
      const { error: fichaError } = await supabase
        .from('fichas_visita')
        .update({ corretor_parceiro_id: user?.id })
        .eq('id', convite.ficha_id);
      
      if (fichaError) throw fichaError;
      
      return convite;
    },
    onSuccess: (convite) => {
      toast.success('Convite aceito! Redirecionando para preencher os dados...');
      queryClient.invalidateQueries({ queryKey: ['convites-recebidos'] });
      // Redirecionar para a página de preenchimento
      navigate(`/convite-parceiro/${convite.token}`);
    },
    onError: (error) => {
      console.error('Erro ao aceitar convite:', error);
      toast.error('Erro ao aceitar o convite');
    }
  });

  // Mutation para recusar convite
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
    onError: (error) => {
      console.error('Erro ao recusar convite:', error);
      toast.error('Erro ao recusar o convite');
    }
  });

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

  const convitesPendentes = convites?.filter(c => 
    c.status === 'pendente' && !isPast(new Date(c.expira_em))
  ) || [];
  
  // Convites aceitos que ainda precisam de ação (dados ou confirmação)
  const convitesEmAndamento = convites?.filter(c => {
    if (c.status !== 'aceito') return false;
    const ficha = detalhes?.fichas?.[c.ficha_id];
    const state = getConviteState(c, ficha);
    return state !== 'completo';
  }) || [];
  
  // Histórico: convites completos, recusados ou expirados
  const convitesHistorico = convites?.filter(c => {
    if (c.status === 'recusado') return true;
    if (c.status === 'pendente' && isPast(new Date(c.expira_em))) return true;
    if (c.status === 'aceito') {
      const ficha = detalhes?.fichas?.[c.ficha_id];
      const state = getConviteState(c, ficha);
      return state === 'completo';
    }
    return false;
  }) || [];

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
            <span className="font-display text-lg font-bold">Convites Recebidos</span>
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
              onClick={() => navigate('/convites-enviados')}
              className="hidden sm:flex"
            >
              <Send className="h-4 w-4 mr-2" />
              Ver Enviados
            </Button>
          </div>
          <p className="text-muted-foreground">
            Gerencie os convites de parceria recebidos de outros corretores
          </p>

          {/* Mobile Tab Navigation */}
          <div className="sm:hidden mt-4">
            <div className="flex gap-2">
              <Button variant="default" className="flex-1" size="sm">
                <Inbox className="h-4 w-4 mr-2" />
                Recebidos
              </Button>
              <Button variant="outline" className="flex-1" size="sm" onClick={() => navigate('/convites-enviados')}>
                <Send className="h-4 w-4 mr-2" />
                Enviados
              </Button>
            </div>
          </div>
        </div>

        {/* Convites Pendentes */}
        {convitesPendentes.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              Pendentes ({convitesPendentes.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {convitesPendentes.map((convite) => {
                const ficha = detalhes?.fichas?.[convite.ficha_id];
                const corretorNome = detalhes?.corretores?.[convite.corretor_origem_id];
                
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
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="text-xs">
                          Preencher: {convite.parte_faltante === 'comprador' ? 'Comprador' : 'Proprietário'}
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        Expira em: {format(new Date(convite.expira_em), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button 
                          className="flex-1" 
                          size="sm"
                          onClick={() => aceitarMutation.mutate(convite)}
                          disabled={aceitarMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aceitar
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
          <div className="mb-8">
            <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-primary" />
              Em Andamento ({convitesEmAndamento.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {convitesEmAndamento.map((convite) => {
                const ficha = detalhes?.fichas?.[convite.ficha_id];
                const corretorNome = detalhes?.corretores?.[convite.corretor_origem_id];
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
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="text-xs">
                          Preencher: {convite.parte_faltante === 'comprador' ? 'Comprador' : 'Proprietário'}
                        </Badge>
                      </div>
                      
                      <div className="pt-2">
                        <Button 
                          className="w-full" 
                          size="sm"
                          onClick={() => navigate(`/convite-parceiro/${convite.token}`)}
                        >
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Continuar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Histórico */}
        {convitesHistorico.length > 0 && (
          <div>
            <h2 className="font-display text-lg font-semibold mb-4">Histórico</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {convitesHistorico.map((convite) => {
                const ficha = detalhes?.fichas?.[convite.ficha_id];
                const corretorNome = detalhes?.corretores?.[convite.corretor_origem_id];
                
                return (
                  <Card key={convite.id} className="opacity-70">
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
                        <span>{corretorNome || 'Corretor'}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Recebido em: {format(new Date(convite.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!convites || convites.length === 0) && (
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Inbox className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Nenhum convite recebido</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Quando outros corretores enviarem convites de parceria, eles aparecerão aqui.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <MobileNav />
    </div>
  );
}
