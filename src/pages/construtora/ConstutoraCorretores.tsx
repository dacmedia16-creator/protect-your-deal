import { useUserRole } from '@/hooks/useUserRole';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ConstutoraLayout } from '@/components/layouts/ConstutoraLayout';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RoleBadge } from '@/components/RoleBadge';

export default function ConstutoraCorretores() {
  useDocumentTitle('Corretores | Construtora');
  const { construtoraId } = useUserRole();

  const { data: corretores, isLoading } = useQuery({
    queryKey: ['construtora-corretores', construtoraId],
    queryFn: async () => {
      if (!construtoraId) return [];
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role, profiles!inner(nome, email, telefone, creci, ativo)')
        .eq('construtora_id', construtoraId)
        .eq('role', 'corretor');
      if (error) throw error;
      return data || [];
    },
    enabled: !!construtoraId,
  });

  return (
    <ConstutoraLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold">Corretores</h1>
          <p className="text-muted-foreground">Corretores vinculados à construtora</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : !corretores?.length ? (
          <Card><CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum corretor vinculado à construtora</p>
          </CardContent></Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>CRECI</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {corretores.map((c: any) => {
                  const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
                  return (
                    <TableRow key={c.user_id}>
                      <TableCell className="font-medium">{profile?.nome || '—'}</TableCell>
                      <TableCell>{profile?.email || '—'}</TableCell>
                      <TableCell>{profile?.telefone || '—'}</TableCell>
                      <TableCell>{profile?.creci || '—'}</TableCell>
                      <TableCell><RoleBadge role={c.role} variant="compact" /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </ConstutoraLayout>
  );
}
