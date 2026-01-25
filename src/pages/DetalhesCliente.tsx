import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Building2, 
  User, 
  Phone, 
  Mail,
  FileText,
  Pencil,
  Loader2,
  Calendar,
  StickyNote
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { isFichaConfirmada } from '@/lib/fichaStatus';

export default function DetalhesCliente() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const { data: cliente, isLoading } = useQuery({
    queryKey: ['cliente', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });

  // Get fichas related to this client
  const { data: fichas } = useQuery({
    queryKey: ['fichas-cliente', id, cliente?.telefone],
    queryFn: async () => {
      if (!cliente || !user) return [];
      
      const telefone = cliente.telefone.replace(/\D/g, '');
      
      const { data, error } = await supabase
        .from('fichas_visita')
        .select('*')
        .eq('user_id', user.id)
        .or(`proprietario_telefone.eq.${telefone},comprador_telefone.eq.${telefone}`)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!cliente && !!user,
  });

  const formatPhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length === 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }
    return phone;
  };

  const formatCPF = (cpf: string | null) => {
    if (!cpf) return '-';
    const numbers = cpf.replace(/\D/g, '');
    if (numbers.length === 11) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
    }
    return cpf;
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">Cliente não encontrado</p>
        <Button onClick={() => navigate('/clientes')}>Voltar aos Clientes</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9 sm:h-10 sm:w-10" onClick={() => navigate('/clientes')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center shrink-0 ${
                  cliente.tipo === 'proprietario' ? 'bg-primary/10' : 'bg-secondary'
                }`}>
                  {cliente.tipo === 'proprietario' ? (
                    <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  ) : (
                    <User className="h-5 w-5 sm:h-6 sm:w-6 text-secondary-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <h1 className="font-display text-base sm:text-xl font-bold truncate">{cliente.nome}</h1>
                  <Badge variant={cliente.tipo === 'proprietario' ? 'default' : 'secondary'} className="text-xs">
                    {cliente.tipo === 'proprietario' ? 'Proprietário' : 'Comprador'}
                  </Badge>
                </div>
              </div>
            </div>
            <Button size="sm" onClick={() => navigate(`/clientes/${id}/editar`)} className="gap-1.5 shrink-0">
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">Editar</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-3xl">
        <div className="space-y-4 sm:space-y-6">
          {/* Contato */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">Informações de Contato</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium text-sm sm:text-base truncate">{formatPhone(cliente.telefone)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-sm sm:text-base truncate">{cliente.email || '-'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">CPF</p>
                  <p className="font-medium text-sm sm:text-base">{formatCPF(cliente.cpf)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Cadastrado em</p>
                  <p className="font-medium text-sm sm:text-base">
                    {format(new Date(cliente.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          {cliente.notas && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <StickyNote className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">Observações</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{cliente.notas}</p>
              </CardContent>
            </Card>
          )}

          {/* Histórico de Fichas */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg">Histórico de Visitas</CardTitle>
                {fichas && fichas.length > 0 && (
                  <Badge variant="secondary" className="text-xs">{fichas.length} registros</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {fichas && fichas.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {fichas.map((ficha) => (
                    <div 
                      key={ficha.id}
                      className="flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/fichas/${ficha.id}`)}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs sm:text-sm text-primary">#{ficha.protocolo}</span>
                          <Badge variant={isFichaConfirmada(ficha.status) ? 'default' : 'secondary'} className="text-xs">
                            {isFichaConfirmada(ficha.status) ? 'Confirmado' : 'Pendente'}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">{ficha.imovel_endereco}</p>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground shrink-0">
                        {format(new Date(ficha.data_visita), 'dd/MM/yy')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-6 text-sm">
                  Nenhuma visita registrada para este cliente
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
