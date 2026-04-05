import { useState } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Building, Loader2, MapPin, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ConstutoraEmpreendimentos() {
  useDocumentTitle('Empreendimentos | Construtora');
  const { construtoraId } = useUserRole();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState('');
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [tipo, setTipo] = useState('residencial');
  const [totalUnidades, setTotalUnidades] = useState('');
  const [descricao, setDescricao] = useState('');

  const resetForm = () => {
    setNome(''); setEndereco(''); setCidade(''); setEstado(''); setTipo('residencial'); setTotalUnidades(''); setDescricao('');
    setEditingEmp(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (emp: any) => {
    setEditingEmp(emp);
    setNome(emp.nome || '');
    setEndereco(emp.endereco || '');
    setCidade(emp.cidade || '');
    setEstado(emp.estado || '');
    setTipo(emp.tipo || 'residencial');
    setTotalUnidades(emp.total_unidades ? String(emp.total_unidades) : '');
    setDescricao(emp.descricao || '');
    setDialogOpen(true);
  };

  const { data: empreendimentos, isLoading } = useQuery({
    queryKey: ['empreendimentos', construtoraId],
    queryFn: async () => {
      if (!construtoraId) return [];
      const { data, error } = await supabase
        .from('empreendimentos')
        .select('*')
        .eq('construtora_id', construtoraId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!construtoraId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('empreendimentos').insert({
        construtora_id: construtoraId!,
        nome, endereco: endereco || null, cidade: cidade || null, estado: estado || null,
        tipo, total_unidades: totalUnidades ? parseInt(totalUnidades) : null, descricao: descricao || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Empreendimento criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['empreendimentos'] });
      setDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao criar empreendimento'),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('empreendimentos').update({
        nome, endereco: endereco || null, cidade: cidade || null, estado: estado || null,
        tipo, total_unidades: totalUnidades ? parseInt(totalUnidades) : null, descricao: descricao || null,
      }).eq('id', editingEmp.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Empreendimento atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['empreendimentos'] });
      setDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao atualizar empreendimento'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('empreendimentos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Empreendimento excluído com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['empreendimentos'] });
      setDeleteDialogOpen(false);
      setDeleteId(null);
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao excluir empreendimento'),
  });

  const handleSubmit = () => {
    if (editingEmp) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const statusColors: Record<string, string> = {
    ativo: 'bg-green-500/10 text-green-600 border-green-500/20',
    em_obras: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    entregue: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    cancelado: 'bg-red-500/10 text-red-600 border-red-500/20',
  };

  return (<>
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold">Empreendimentos</h1>
            <p className="text-muted-foreground">Gerencie os empreendimentos da construtora</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}><Plus className="h-4 w-4 mr-2" /> Novo Empreendimento</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingEmp ? 'Editar Empreendimento' : 'Novo Empreendimento'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div><Label>Nome *</Label><Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do empreendimento" /></div>
                <div><Label>Endereço</Label><Input value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Endereço completo" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Cidade</Label><Input value={cidade} onChange={e => setCidade(e.target.value)} /></div>
                  <div><Label>Estado</Label><Input value={estado} onChange={e => setEstado(e.target.value)} maxLength={2} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo</Label>
                    <Select value={tipo} onValueChange={setTipo}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residencial">Residencial</SelectItem>
                        <SelectItem value="comercial">Comercial</SelectItem>
                        <SelectItem value="misto">Misto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Total Unidades</Label><Input type="number" value={totalUnidades} onChange={e => setTotalUnidades(e.target.value)} /></div>
                </div>
                <div><Label>Descrição</Label><Input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descrição do empreendimento" /></div>
                <Button onClick={handleSubmit} disabled={!nome || isPending} className="w-full">
                  {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {editingEmp ? 'Salvar Alterações' : 'Criar Empreendimento'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : !empreendimentos?.length ? (
          <Card><CardContent className="py-12 text-center">
            <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum empreendimento cadastrado</p>
          </CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {empreendimentos.map((emp: any) => (
              <Card key={emp.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{emp.nome}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={statusColors[emp.status] || ''}>
                        {emp.status === 'ativo' ? 'Ativo' : emp.status === 'em_obras' ? 'Em Obras' : emp.status === 'entregue' ? 'Entregue' : 'Cancelado'}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(emp)}>
                            <Pencil className="h-4 w-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          {emp.nome !== 'Outro (Endereço Manual)' && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => { setDeleteId(emp.id); setDeleteName(emp.nome); setDeleteDialogOpen(true); }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Excluir
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {emp.endereco && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {emp.endereco}{emp.cidade ? `, ${emp.cidade}` : ''}{emp.estado ? ` - ${emp.estado}` : ''}
                    </div>
                  )}
                  <div className="flex gap-4 text-sm">
                    <span className="text-muted-foreground">Tipo: <span className="text-foreground capitalize">{emp.tipo}</span></span>
                    {emp.total_unidades && <span className="text-muted-foreground">{emp.total_unidades} unidades</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir empreendimento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o empreendimento <strong>{deleteName}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog></>
      </>);
}
