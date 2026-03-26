import { useUserRole } from '@/hooks/useUserRole';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ConstutoraLayout } from '@/components/layouts/ConstutoraLayout';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fichaStatusColors, getStatusColor } from '@/lib/statusColors';

const fichaStatusLabels: Record<string, string> = {
  pendente: 'Pendente',
  aguardando_proprietario: 'Aguardando Proprietário',
  aguardando_comprador: 'Aguardando Comprador',
  completo: 'Completo',
  confirmado: 'Confirmado',
  finalizado_parcial: 'Finalizado Parcial',
  cancelado: 'Cancelado',
};

export default function ConstutoraFichas() {
  useDocumentTitle('Fichas de Visita | Construtora');
  const { construtoraId } = useUserRole();

  const { data: fichas, isLoading } = useQuery({
    queryKey: ['construtora-fichas', construtoraId],
    queryFn: async () => {
      if (!construtoraId) return [];
      const { data, error } = await supabase
        .from('fichas_visita')
        .select('id, protocolo, imovel_endereco, proprietario_nome, comprador_nome, data_visita, status, created_at')
        .eq('construtora_id', construtoraId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!construtoraId,
  });

  return (
    <ConstutoraLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold">Registros de Visita</h1>
          <p className="text-muted-foreground">Fichas de visita vinculadas aos empreendimentos</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : !fichas?.length ? (
          <Card><CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma ficha de visita vinculada</p>
          </CardContent></Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Proprietário</TableHead>
                  <TableHead>Comprador</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fichas.map((f: any) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-mono text-sm">{f.protocolo}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{f.imovel_endereco}</TableCell>
                    <TableCell>{f.proprietario_nome || '—'}</TableCell>
                    <TableCell>{f.comprador_nome || '—'}</TableCell>
                    <TableCell>{f.data_visita ? format(new Date(f.data_visita), 'dd/MM/yyyy') : '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(fichaStatusColors, f.status)}>
                        {fichaStatusLabels[f.status] || f.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </ConstutoraLayout>
  );
}
