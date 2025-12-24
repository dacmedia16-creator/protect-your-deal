import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Plus, 
  FileText,
  CheckCircle,
  Clock,
  Search,
  Loader2,
  Building2,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
  pendente: { label: 'Pendente', variant: 'secondary', icon: Clock },
  aguardando_comprador: { label: 'Aguardando Comprador', variant: 'outline', icon: Clock },
  aguardando_proprietario: { label: 'Aguardando Proprietário', variant: 'outline', icon: Clock },
  completo: { label: 'Confirmado', variant: 'default', icon: CheckCircle },
  expirado: { label: 'Expirado', variant: 'destructive', icon: Clock },
};

const statusFilterLabels: Record<string, string> = {
  completo: 'Confirmadas',
  pendente: 'Pendentes',
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
    // Apply status filter
    if (statusFilter) {
      if (statusFilter === 'pendente' && ficha.status === 'completo') return false;
      if (statusFilter === 'completo' && ficha.status !== 'completo') return false;
    }
    
    // Apply search filter
    const term = searchTerm.toLowerCase();
    return (
      ficha.protocolo.toLowerCase().includes(term) ||
      ficha.imovel_endereco.toLowerCase().includes(term) ||
      ficha.proprietario_nome.toLowerCase().includes(term) ||
      ficha.comprador_nome.toLowerCase().includes(term)
    );
  });

  const clearStatusFilter = () => {
    setSearchParams({});
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="font-display text-xl font-bold">Fichas de Visita</h1>
                <p className="text-sm text-muted-foreground">
                  {fichas?.length || 0} fichas no total
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/fichas/nova')} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Ficha
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Status Filter Badge */}
        {statusFilter && (
          <div className="mb-4">
            <Badge variant="secondary" className="gap-2 text-sm py-1.5 px-3">
              Filtro: {statusFilterLabels[statusFilter] || statusFilter}
              <button 
                onClick={clearStatusFilter}
                className="hover:bg-muted rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por protocolo, endereço ou nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredFichas && filteredFichas.length > 0 ? (
          <div className="space-y-4">
            {filteredFichas.map((ficha) => {
              const status = statusConfig[ficha.status] || statusConfig.pendente;
              const StatusIcon = status.icon;
              
              return (
                <Card 
                  key={ficha.id} 
                  className="cursor-pointer hover:shadow-medium transition-shadow"
                  onClick={() => navigate(`/fichas/${ficha.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
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
                            <span>Proprietário: {ficha.proprietario_nome}</span>
                            <span>Comprador: {ficha.comprador_nome}</span>
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
    </div>
  );
}
