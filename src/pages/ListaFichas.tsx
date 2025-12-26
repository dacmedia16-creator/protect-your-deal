import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  FileText,
  CheckCircle,
  Clock,
  Search,
  Loader2,
  Building2,
  MapPin,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MobileHeader } from '@/components/MobileHeader';
import { MobileNav } from '@/components/MobileNav';
import { FloatingActionButton } from '@/components/FloatingActionButton';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
  pendente: { label: 'Pendente', variant: 'secondary', icon: Clock },
  aguardando_comprador: { label: 'Aguard. Comprador', variant: 'outline', icon: Clock },
  aguardando_proprietario: { label: 'Aguard. Proprietário', variant: 'outline', icon: Clock },
  completo: { label: 'Confirmado', variant: 'default', icon: CheckCircle },
  expirado: { label: 'Expirado', variant: 'destructive', icon: Clock },
};

export default function ListaFichas() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  
  const statusFilter = searchParams.get('status');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const { data: fichas, isLoading } = useQuery({
    queryKey: ['fichas', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('fichas_visita')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const filteredFichas = fichas?.filter(ficha => {
    if (statusFilter) {
      if (statusFilter === 'pendente' && ficha.status === 'completo') return false;
      if (statusFilter === 'completo' && ficha.status !== 'completo') return false;
    }
    
    const term = searchTerm.toLowerCase();
    return (
      ficha.protocolo.toLowerCase().includes(term) ||
      ficha.imovel_endereco.toLowerCase().includes(term) ||
      (ficha.proprietario_nome && ficha.proprietario_nome.toLowerCase().includes(term)) ||
      (ficha.comprador_nome && ficha.comprador_nome.toLowerCase().includes(term))
    );
  });

  const allCount = fichas?.length || 0;
  const pendingCount = fichas?.filter(f => f.status !== 'completo').length || 0;
  const confirmedCount = fichas?.filter(f => f.status === 'completo').length || 0;

  const handleTabChange = (value: string) => {
    if (value === 'todas') {
      setSearchParams({});
    } else {
      setSearchParams({ status: value });
    }
  };

  const currentTab = statusFilter || 'todas';

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <MobileHeader
        title="Fichas de Visita"
        subtitle={`${fichas?.length || 0} fichas no total`}
        showAdd
        onAdd={() => navigate('/fichas/nova')}
        addLabel="Nova Ficha"
      />

      <main className="container mx-auto px-4 py-4 md:py-6">
        {/* Filter Tabs - horizontal scroll on mobile */}
        <div className="mb-4 md:mb-6 -mx-4 px-4 overflow-x-auto scrollbar-hide">
          <Tabs value={currentTab} onValueChange={handleTabChange}>
            <TabsList className="bg-muted inline-flex w-auto min-w-full md:min-w-0">
              <TabsTrigger value="todas" className="gap-1.5 text-xs md:text-sm px-3 md:px-4">
                Todas
                <Badge variant="secondary" className="ml-1 text-[10px] md:text-xs px-1.5 py-0">
                  {allCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="pendente" className="gap-1.5 text-xs md:text-sm px-3 md:px-4">
                Pendentes
                <Badge variant="secondary" className="ml-1 text-[10px] md:text-xs px-1.5 py-0">
                  {pendingCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="completo" className="gap-1.5 text-xs md:text-sm px-3 md:px-4">
                Confirmadas
                <Badge variant="secondary" className="ml-1 text-[10px] md:text-xs px-1.5 py-0">
                  {confirmedCount}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Search */}
        <div className="mb-4 md:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por protocolo, endereço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 md:max-w-md"
            />
          </div>
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredFichas && filteredFichas.length > 0 ? (
          <div className="space-y-3">
            {filteredFichas.map((ficha) => {
              const status = statusConfig[ficha.status] || statusConfig.pendente;
              const StatusIcon = status.icon;
              
              return (
                <Card 
                  key={ficha.id} 
                  className="cursor-pointer hover:shadow-medium active:bg-muted/30 transition-all"
                  onClick={() => navigate(`/fichas/${ficha.id}`)}
                >
                  <CardContent className="p-3 md:p-4">
                    {/* Mobile Layout */}
                    <div className="md:hidden space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-xs font-medium text-primary">
                          #{ficha.protocolo}
                        </span>
                        <Badge variant={status.variant} className="gap-1 text-[10px] shrink-0">
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-sm font-medium leading-tight line-clamp-2">{ficha.imovel_endereco}</p>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" />
                        <span>{ficha.imovel_tipo}</span>
                        <span className="text-border">•</span>
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{format(new Date(ficha.data_visita), "dd/MM 'às' HH:mm")}</span>
                      </div>
                      
                      <div className="flex gap-3 text-xs text-muted-foreground pt-1 border-t">
                        <span className="truncate">Prop: {ficha.proprietario_nome || 'A preencher'}</span>
                        <span className="truncate">Comp: {ficha.comprador_nome || 'A preencher'}</span>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-sm font-medium text-primary">
                              #{ficha.protocolo}
                            </span>
                            <Badge variant={status.variant} className="gap-1 text-xs">
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </Badge>
                          </div>
                          <p className="font-medium truncate">{ficha.imovel_endereco}</p>
                          <p className="text-sm text-muted-foreground">
                            {ficha.imovel_tipo} • Visita em {format(new Date(ficha.data_visita), "dd/MM/yyyy 'às' HH:mm")}
                          </p>
                          <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                            <span>Proprietário: {ficha.proprietario_nome || 'A preencher'}</span>
                            <span>Comprador: {ficha.comprador_nome || 'A preencher'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">Nenhuma ficha encontrada</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm ? 'Tente outro termo de busca' : 'Crie sua primeira ficha de visita'}
            </p>
            {!searchTerm && (
              <Button onClick={() => navigate('/fichas/nova')} className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Ficha
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Floating Action Button for mobile */}
      <FloatingActionButton 
        onClick={() => navigate('/fichas/nova')} 
        label="Nova Ficha"
      />

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
