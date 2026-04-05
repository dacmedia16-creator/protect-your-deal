import { useUserRole } from '@/hooks/useUserRole';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Building2, Handshake, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function EmpresaParceriasConstrutoras() {
  useDocumentTitle('Parcerias com Construtoras');
  const { imobiliariaId } = useUserRole();
  const queryClient = useQueryClient();

  const { data: parcerias, isLoading } = useQuery({
    queryKey: ['empresa-parcerias-construtoras', imobiliariaId],
    queryFn: async () => {
      if (!imobiliariaId) return [];
      const { data, error } = await supabase
        .from('construtora_imobiliarias')
        .select('*, construtoras:construtora_id(id, nome, logo_url, email, telefone)')
        .eq('imobiliaria_id', imobiliariaId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!imobiliariaId,
  });

  const aceitarParceria = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('construtora_imobiliarias')
        .update({ status: 'ativa' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Parceria aceita com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['empresa-parcerias-construtoras'] });
    },
    onError: () => toast.error('Erro ao aceitar parceria.'),
  });

  const recusarParceria = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('construtora_imobiliarias')
        .update({ status: 'recusada' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Parceria recusada.');
      queryClient.invalidateQueries({ queryKey: ['empresa-parcerias-construtoras'] });
    },
    onError: () => toast.error('Erro ao recusar parceria.'),
  });

  const pendentes = (parcerias || []).filter((p: any) => p.status === 'pendente');
  const ativas = (parcerias || []).filter((p: any) => p.status === 'ativa');
  const recusadas = (parcerias || []).filter((p: any) => p.status === 'recusada');

  const renderCard = (p: any, showActions: boolean) => {
    const construtora = p.construtoras;
    return (
      <Card key={p.id}>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3 min-w-0">
            {construtora?.logo_url ? (
              <img src={construtora.logo_url} alt={construtora.nome} className="h-10 w-10 object-contain rounded shrink-0" />
            ) : (
              <div className="h-10 w-10 bg-muted rounded flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-medium truncate">{construtora?.nome || 'Construtora'}</p>
              {construtora?.email && (
                <p className="text-xs text-muted-foreground truncate">{construtora.email}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Convite em {format(new Date(p.created_at), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {showActions ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-destructive hover:text-destructive"
                  onClick={() => recusarParceria.mutate(p.id)}
                  disabled={recusarParceria.isPending}
                >
                  <XCircle className="h-4 w-4" /> Recusar
                </Button>
                <Button
                  size="sm"
                  className="gap-1"
                  onClick={() => aceitarParceria.mutate(p.id)}
                  disabled={aceitarParceria.isPending}
                >
                  <CheckCircle className="h-4 w-4" /> Aceitar
                </Button>
              </>
            ) : (
              <Badge
                variant="outline"
                className={
                  p.status === 'ativa'
                    ? 'bg-green-500/10 text-green-600 border-green-200'
                    : 'bg-red-500/10 text-red-600 border-red-200'
                }
              >
                {p.status === 'ativa' ? 'Ativa' : 'Recusada'}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (<div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold">Parcerias com Construtoras</h1>
          <p className="text-muted-foreground">Gerencie convites e parcerias com construtoras</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !parcerias?.length ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Handshake className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum convite de parceria recebido</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {pendentes.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Badge variant="warning">{pendentes.length}</Badge>
                  Convites Pendentes
                </h2>
                {pendentes.map((p: any) => renderCard(p, true))}
              </div>
            )}

            {ativas.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">Parcerias Ativas</h2>
                {ativas.map((p: any) => renderCard(p, false))}
              </div>
            )}

            {recusadas.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-muted-foreground">Recusadas</h2>
                {recusadas.map((p: any) => renderCard(p, false))}
              </div>
            )}
          </>
        )}
      </div>);
}
