import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
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
  Send,
  Inbox,
  Phone
} from 'lucide-react';
import { MobileNav } from '@/components/MobileNav';
import { DesktopNav } from '@/components/DesktopNav';
import { format, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

export default function ConvitesEnviados() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Buscar convites enviados pelo usuário
  const { data: convites, isLoading } = useQuery({
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

  // Buscar detalhes das fichas
  const { data: fichasMap } = useQuery({
    queryKey: ['convites-enviados-fichas', convites?.map(c => c.ficha_id)],
    queryFn: async () => {
      if (!convites || convites.length === 0) return {};
      
      const fichaIds = convites.map(c => c.ficha_id);
      
      const { data } = await supabase
        .from('fichas_visita')
        .select('id, imovel_endereco, imovel_tipo, data_visita')
        .in('id', fichaIds);
      
      const map: Record<string, any> = {};
      data?.forEach(f => { map[f.id] = f; });
      
      return map;
    },
    enabled: !!convites && convites.length > 0,
  });

  // Buscar nomes dos parceiros que aceitaram
  const { data: parceirosMap } = useQuery({
    queryKey: ['convites-enviados-parceiros', convites?.map(c => c.corretor_parceiro_id).filter(Boolean)],
    queryFn: async () => {
      if (!convites) return {};
      
      const parceiroIds = convites
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
    enabled: !!convites,
  });

  const getStatusBadge = (status: string, expiraEm: string) => {
    if (isPast(new Date(expiraEm)) && status === 'pendente') {
      return <Badge variant="secondary">Expirado</Badge>;
    }
    
    switch (status) {
      case 'pendente':
        return <Badge variant="warning">Aguardando</Badge>;
      case 'aceito':
        return <Badge variant="success">Aceito</Badge>;
      case 'recusado':
        return <Badge variant="destructive">Recusado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const convitesPendentes = convites?.filter(c => 
    c.status === 'pendente' && !isPast(new Date(c.expira_em))
  ) || [];
  
  const convitesAceitos = convites?.filter(c => c.status === 'aceito') || [];
  
  const convitesOutros = convites?.filter(c => 
    c.status === 'recusado' || (c.status === 'pendente' && isPast(new Date(c.expira_em)))
  ) || [];

  const renderConviteCard = (convite: ConviteParceiro, showActions = false) => {
    const ficha = fichasMap?.[convite.ficha_id];
    const parceiroNome = convite.corretor_parceiro_id ? parceirosMap?.[convite.corretor_parceiro_id] : null;
    const isExpired = isPast(new Date(convite.expira_em)) && convite.status === 'pendente';
    
    return (
      <Card key={convite.id} className={isExpired ? 'opacity-60' : ''}>
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
          
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="text-xs">
              Parceiro preenche: {convite.parte_faltante === 'comprador' ? 'Comprador' : 'Proprietário'}
            </Badge>
          </div>
          
          <div className="text-xs text-muted-foreground pt-1">
            Enviado em: {format(new Date(convite.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </div>
          
          {showActions && convite.status === 'pendente' && !isExpired && (
            <div className="pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => navigate(`/fichas/${convite.ficha_id}`)}
              >
                Ver Ficha
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

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
            <Send className="h-5 w-5 text-primary" />
            <span className="font-display text-lg font-bold">Convites Enviados</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-display text-2xl md:text-3xl font-bold hidden sm:block">
              Convites de Parceria Enviados
            </h1>
            <Button 
              variant="outline" 
              onClick={() => navigate('/convites-recebidos')}
              className="hidden sm:flex"
            >
              <Inbox className="h-4 w-4 mr-2" />
              Ver Recebidos
            </Button>
          </div>
          <p className="text-muted-foreground">
            Acompanhe os convites de parceria que você enviou
          </p>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="sm:hidden mb-4">
          <Tabs defaultValue="enviados">
            <TabsList className="w-full">
              <TabsTrigger value="enviados" className="flex-1" onClick={() => {}}>
                <Send className="h-4 w-4 mr-2" />
                Enviados
              </TabsTrigger>
              <TabsTrigger value="recebidos" className="flex-1" onClick={() => navigate('/convites-recebidos')}>
                <Inbox className="h-4 w-4 mr-2" />
                Recebidos
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Stats Summary */}
        {convites && convites.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card className="text-center">
              <CardContent className="pt-4 pb-3">
                <div className="text-2xl font-bold text-warning">{convitesPendentes.length}</div>
                <div className="text-xs text-muted-foreground">Aguardando</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-4 pb-3">
                <div className="text-2xl font-bold text-success">{convitesAceitos.length}</div>
                <div className="text-xs text-muted-foreground">Aceitos</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-4 pb-3">
                <div className="text-2xl font-bold text-muted-foreground">{convitesOutros.length}</div>
                <div className="text-xs text-muted-foreground">Outros</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Convites Pendentes */}
        {convitesPendentes.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              Aguardando Resposta ({convitesPendentes.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {convitesPendentes.map((convite) => renderConviteCard(convite, true))}
            </div>
          </div>
        )}

        {/* Convites Aceitos */}
        {convitesAceitos.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Aceitos ({convitesAceitos.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {convitesAceitos.map((convite) => renderConviteCard(convite))}
            </div>
          </div>
        )}

        {/* Outros (Recusados/Expirados) */}
        {convitesOutros.length > 0 && (
          <div>
            <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-muted-foreground" />
              Recusados / Expirados ({convitesOutros.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {convitesOutros.map((convite) => renderConviteCard(convite))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!convites || convites.length === 0) && (
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Send className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Nenhum convite enviado</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Você ainda não enviou convites de parceria. Crie uma ficha de visita e convide um parceiro!
                </p>
              </div>
              <Button onClick={() => navigate('/fichas/nova')}>
                Criar Nova Ficha
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <MobileNav />
    </div>
  );
}
