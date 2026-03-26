import { useUserRole } from '@/hooks/useUserRole';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ConstutoraLayout } from '@/components/layouts/ConstutoraLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Handshake, Loader2 } from 'lucide-react';

export default function ConstutoraImobiliarias() {
  useDocumentTitle('Imobiliárias Parceiras | Construtora');
  const { construtoraId } = useUserRole();

  const { data: parcerias, isLoading } = useQuery({
    queryKey: ['construtora-parcerias', construtoraId],
    queryFn: async () => {
      if (!construtoraId) return [];
      const { data, error } = await supabase
        .from('construtora_imobiliarias')
        .select('*, imobiliarias:imobiliaria_id(id, nome, email, telefone, logo_url, status)')
        .eq('construtora_id', construtoraId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!construtoraId,
  });

  return (
    <ConstutoraLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold">Imobiliárias Parceiras</h1>
          <p className="text-muted-foreground">Gerencie as imobiliárias vinculadas à construtora</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : !parcerias?.length ? (
          <Card><CardContent className="py-12 text-center">
            <Handshake className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma imobiliária parceira vinculada</p>
            <p className="text-sm text-muted-foreground mt-2">As parcerias serão gerenciadas por aqui.</p>
          </CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {parcerias.map((p: any) => {
              const imob = p.imobiliarias;
              return (
                <Card key={p.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {imob?.logo_url ? (
                          <img src={imob.logo_url} alt={imob.nome} className="h-10 w-10 object-contain rounded" />
                        ) : (
                          <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                            <Handshake className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <CardTitle className="text-lg">{imob?.nome || 'Imobiliária'}</CardTitle>
                      </div>
                      <Badge variant="outline" className={p.status === 'ativa' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}>
                        {p.status === 'ativa' ? 'Ativa' : p.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {imob?.email && <p className="text-sm text-muted-foreground">{imob.email}</p>}
                    {imob?.telefone && <p className="text-sm text-muted-foreground">{imob.telefone}</p>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </ConstutoraLayout>
  );
}
