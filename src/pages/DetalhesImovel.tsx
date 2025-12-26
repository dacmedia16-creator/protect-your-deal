import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  MapPin, 
  User, 
  Phone, 
  Pencil,
  Calendar,
  FileText,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MobileHeader } from '@/components/MobileHeader';
import { MobileNav } from '@/components/MobileNav';
import { DesktopNav } from '@/components/DesktopNav';

export default function DetalhesImovel() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const { data: imovel, isLoading } = useQuery({
    queryKey: ['imovel', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('imoveis')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  const { data: proprietario } = useQuery({
    queryKey: ['proprietario', imovel?.proprietario_id],
    queryFn: async () => {
      if (!imovel?.proprietario_id) return null;
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', imovel.proprietario_id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!imovel?.proprietario_id,
  });

  // Buscar fichas relacionadas a este imóvel
  const { data: fichasRelacionadas } = useQuery({
    queryKey: ['fichas-imovel', imovel?.endereco],
    queryFn: async () => {
      if (!imovel?.endereco || !user) return [];
      const { data, error } = await supabase
        .from('fichas_visita')
        .select('id, protocolo, data_visita, status')
        .eq('user_id', user.id)
        .ilike('imovel_endereco', `%${imovel.endereco}%`)
        .order('data_visita', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!imovel?.endereco && !!user,
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!imovel) {
    return (
      <div className="min-h-screen bg-background pb-20 sm:pb-0">
        <DesktopNav />
        <MobileHeader title="Imóvel não encontrado" backPath="/imoveis" />
        <main className="container mx-auto px-4 py-8 text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Imóvel não encontrado</h2>
          <p className="text-muted-foreground mb-4">O imóvel solicitado não existe ou foi removido.</p>
          <Button onClick={() => navigate('/imoveis')}>Voltar para Imóveis</Button>
        </main>
        <MobileNav />
      </div>
    );
  }

  const localizacao = [imovel.bairro, imovel.cidade, imovel.estado].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      {/* Desktop Navigation */}
      <DesktopNav />
      
      {/* Mobile Header */}
      <MobileHeader
        title="Detalhes do Imóvel"
        subtitle={imovel.tipo}
        backPath="/imoveis"
      >
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate(`/imoveis/${id}/editar`)}
          className="gap-1.5"
        >
          <Pencil className="h-4 w-4" />
          <span className="hidden sm:inline">Editar</span>
        </Button>
      </MobileHeader>

      <main className="container mx-auto px-4 py-4 md:py-6 max-w-3xl">
        {/* Header Card */}
        <Card className="mb-4">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 md:h-16 md:w-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="h-7 w-7 md:h-8 md:w-8 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant="secondary">{imovel.tipo}</Badge>
                </div>
                <h1 className="text-lg md:text-xl font-bold mb-1">{imovel.endereco}</h1>
                {localizacao && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{localizacao}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Proprietário */}
        {proprietario && (
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Proprietário
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div 
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                onClick={() => navigate(`/clientes/${proprietario.id}`)}
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{proprietario.nome}</p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>{proprietario.telefone}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Observações */}
        {imovel.notas && (
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Observações</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{imovel.notas}</p>
            </CardContent>
          </Card>
        )}

        {/* Fichas Relacionadas */}
        {fichasRelacionadas && fichasRelacionadas.length > 0 && (
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Fichas de Visita Relacionadas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {fichasRelacionadas.map((ficha) => (
                <div 
                  key={ficha.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => navigate(`/fichas/${ficha.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-mono text-sm font-medium">#{ficha.protocolo}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(ficha.data_visita), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={ficha.status === 'completo' ? 'default' : 'secondary'}>
                    {ficha.status === 'completo' ? 'Confirmado' : 'Pendente'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Informações Adicionais */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Informações</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Cadastrado em</p>
                <p className="font-medium">
                  {format(new Date(imovel.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Última atualização</p>
                <p className="font-medium">
                  {format(new Date(imovel.updated_at), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
