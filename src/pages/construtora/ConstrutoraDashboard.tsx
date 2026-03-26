import { useUserRole } from '@/hooks/useUserRole';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ConstutoraLayout } from '@/components/layouts/ConstutoraLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Building, Handshake, FileText, Users, Loader2 } from 'lucide-react';

export default function ConstrutoraDashboard() {
  useDocumentTitle('Dashboard | Construtora');
  const { construtora, construtoraId } = useUserRole();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['construtora-stats', construtoraId],
    queryFn: async () => {
      if (!construtoraId) return null;

      const [empreendimentos, parcerias, fichas] = await Promise.all([
        supabase.from('empreendimentos').select('id', { count: 'exact', head: true }).eq('construtora_id', construtoraId),
        supabase.from('construtora_imobiliarias').select('id', { count: 'exact', head: true }).eq('construtora_id', construtoraId).eq('status', 'ativa'),
        supabase.from('fichas_visita').select('id', { count: 'exact', head: true }).eq('construtora_id', construtoraId),
      ]);

      return {
        empreendimentos: empreendimentos.count || 0,
        parcerias: parcerias.count || 0,
        fichas: fichas.count || 0,
      };
    },
    enabled: !!construtoraId,
  });

  return (
    <ConstutoraLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao painel da {construtora?.nome || 'Construtora'}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Empreendimentos</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.empreendimentos || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Imobiliárias Parceiras</CardTitle>
                <Handshake className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.parcerias || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fichas de Visita</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.fichas || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Código</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{construtora?.codigo || '—'}</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ConstutoraLayout>
  );
}
