import { useState } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ConstutoraLayout } from '@/components/layouts/ConstutoraLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ConstutoraConfiguracoes() {
  useDocumentTitle('Configurações | Construtora');
  const { construtora, construtoraId, refetch } = useUserRole();
  const queryClient = useQueryClient();

  const [nome, setNome] = useState(construtora?.nome || '');
  const [cnpj, setCnpj] = useState(construtora?.cnpj || '');
  const [email, setEmail] = useState(construtora?.email || '');
  const [telefone, setTelefone] = useState(construtora?.telefone || '');
  const [endereco, setEndereco] = useState(construtora?.endereco || '');
  const [cidade, setCidade] = useState(construtora?.cidade || '');
  const [estado, setEstado] = useState(construtora?.estado || '');

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!construtoraId) throw new Error('Construtora not found');
      const { error } = await supabase
        .from('construtoras')
        .update({ nome, cnpj: cnpj || null, email, telefone: telefone || null, endereco: endereco || null, cidade: cidade || null, estado: estado || null })
        .eq('id', construtoraId);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success('Dados atualizados com sucesso!');
      await refetch();
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao atualizar'),
  });

  return (
    <ConstutoraLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold">Configurações</h1>
          <p className="text-muted-foreground">Dados cadastrais da construtora</p>
        </div>

        <Card>
          <CardHeader><CardTitle>Dados da Empresa</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>Nome *</Label><Input value={nome} onChange={e => setNome(e.target.value)} /></div>
              <div><Label>CNPJ</Label><Input value={cnpj} onChange={e => setCnpj(e.target.value)} /></div>
              <div><Label>Email *</Label><Input value={email} onChange={e => setEmail(e.target.value)} type="email" /></div>
              <div><Label>Telefone</Label><Input value={telefone} onChange={e => setTelefone(e.target.value)} /></div>
              <div><Label>Endereço</Label><Input value={endereco} onChange={e => setEndereco(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Cidade</Label><Input value={cidade} onChange={e => setCidade(e.target.value)} /></div>
                <div><Label>Estado</Label><Input value={estado} onChange={e => setEstado(e.target.value)} maxLength={2} /></div>
              </div>
            </div>
            <Button onClick={() => updateMutation.mutate()} disabled={!nome || !email || updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Salvar Alterações
            </Button>
          </CardContent>
        </Card>
      </div>
    </ConstutoraLayout>
  );
}
