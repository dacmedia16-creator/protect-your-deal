import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Handshake, 
  MapPin, 
  Calendar, 
  User, 
  ArrowLeft,
  FileText,
  CheckCircle,
  Clock,
  Eye
} from 'lucide-react';
import { MobileNav } from '@/components/MobileNav';
import { DesktopNav } from '@/components/DesktopNav';
import { DescartarFichaDialog } from '@/components/DescartarFichaDialog';
import { isFichaConfirmada } from '@/lib/fichaStatus';
import { useFichasOcultas } from '@/hooks/useFichasOcultas';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FichaParceiro {
  id: string;
  protocolo: string;
  imovel_tipo: string;
  imovel_endereco: string;
  data_visita: string;
  status: string;
  parte_preenchida_parceiro: string | null;
  proprietario_nome: string | null;
  proprietario_telefone: string | null;
  proprietario_confirmado_em: string | null;
  comprador_nome: string | null;
  comprador_telefone: string | null;
  comprador_confirmado_em: string | null;
  user_id: string;
  created_at: string;
}

export default function FichasParceiro() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { hiddenIds } = useFichasOcultas();

  // Buscar fichas onde o usuário é o corretor parceiro
  const { data: fichasRaw, isLoading } = useQuery({
    queryKey: ['fichas-parceiro', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('fichas_visita')
        .select('*')
        .eq('corretor_parceiro_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as FichaParceiro[];
    },
    enabled: !!user,
  });

  const fichas = useMemo(() => {
    if (!fichasRaw) return [];
    return hiddenIds.length > 0 ? fichasRaw.filter(f => !hiddenIds.includes(f.id)) : fichasRaw;
  }, [fichasRaw, hiddenIds]);

  // Buscar nomes dos corretores de origem
  const corretorIds = [...new Set(fichas?.map(f => f.user_id) || [])];
  const { data: corretores } = useQuery({
    queryKey: ['corretores-origem', corretorIds],
    queryFn: async () => {
      if (corretorIds.length === 0) return {};
      
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, nome')
        .in('user_id', corretorIds);
      
      if (error) throw error;
      
      const map: Record<string, string> = {};
      data?.forEach(c => { map[c.user_id] = c.nome; });
      return map;
    },
    enabled: corretorIds.length > 0,
  });

  const getStatusBadge = (ficha: FichaParceiro) => {
    if (isFichaConfirmada(ficha.status)) {
      return <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Confirmada</Badge>;
    }
    
    const parte = ficha.parte_preenchida_parceiro;
    const confirmado = parte === 'proprietario' 
      ? ficha.proprietario_confirmado_em 
      : ficha.comprador_confirmado_em;
    
    if (confirmado) {
      return <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Parte confirmada</Badge>;
    }
    
    // Verificar telefone OU nome (autopreenchimento pode ter só telefone)
    const temDados = parte === 'proprietario' 
      ? (ficha.proprietario_nome || ficha.proprietario_telefone)
      : (ficha.comprador_nome || ficha.comprador_telefone);
    
    if (temDados) {
      return <Badge variant="default" className="flex items-center gap-1"><Clock className="h-3 w-3" />Aguardando confirmação</Badge>;
    }
    
    return <Badge variant="warning" className="flex items-center gap-1"><Clock className="h-3 w-3" />Aguardando dados</Badge>;
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
            <Handshake className="h-5 w-5 text-primary" />
            <span className="font-display text-lg font-bold">Registros como Parceiro</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl md:text-3xl font-bold hidden sm:block">
            Registros como Parceiro
          </h1>
          <p className="text-muted-foreground mt-1">
            Registros de visita onde você preencheu dados como corretor parceiro
          </p>
        </div>

        {/* Lista de Fichas */}
        {fichas && fichas.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {fichas.map((ficha) => {
              const corretorNome = corretores?.[ficha.user_id];
              
              return (
                <Card key={ficha.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base font-medium line-clamp-1">
                        {ficha.imovel_tipo}
                      </CardTitle>
                      {getStatusBadge(ficha)}
                    </div>
                    <CardDescription className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="line-clamp-1">{ficha.imovel_endereco}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span className="font-mono text-xs">{ficha.protocolo}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Corretor origem: <strong className="text-foreground">{corretorNome || 'Corretor'}</strong></span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Visita: {format(new Date(ficha.data_visita), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-xs">
                        Preencheu: {ficha.parte_preenchida_parceiro === 'comprador' ? 'Comprador' : 'Proprietário'}
                      </Badge>
                    </div>
                    
                    <div className="pt-2 flex gap-2">
                      <Button 
                        variant="outline"
                        className="flex-1" 
                        size="sm"
                        onClick={() => navigate(`/fichas/${ficha.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                      <DescartarFichaDialog
                        fichaId={ficha.id}
                        protocolo={ficha.protocolo}
                        onDiscarded={() => window.location.reload()}
                        variant="icon"
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Handshake className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Nenhum registro como parceiro</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Quando você preencher dados em registros de outros corretores, eles aparecerão aqui.
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate('/convites-recebidos')}>
                Ver Convites Recebidos
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <MobileNav />
    </div>
  );
}