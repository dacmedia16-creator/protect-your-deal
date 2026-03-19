import { useEffect, useState } from 'react';
import { SuperAdminLayout } from '@/components/layouts/SuperAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Check, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { AnimatedContent, AnimatedList, AnimatedItem } from '@/components/AnimatedContent';

interface Plano {
  id: string;
  nome: string;
  descricao: string | null;
  max_corretores: number;
  max_fichas_mes: number;
  max_clientes: number;
  max_imoveis: number;
  valor_mensal: number;
  valor_anual: number | null;
  ativo: boolean;
  asaas_plan_id: string | null;
  tipo_cadastro: string | null;
}

interface PlanoForm {
  nome: string;
  descricao: string;
  max_corretores: number;
  max_fichas_mes: number;
  max_clientes: number;
  max_imoveis: number;
  valor_mensal: number;
  valor_anual: number | null;
  ativo: boolean;
  asaas_plan_id: string;
}

const defaultForm: PlanoForm = {
  nome: '',
  descricao: '',
  max_corretores: 5,
  max_fichas_mes: 100,
  max_clientes: 500,
  max_imoveis: 200,
  valor_mensal: 0,
  ativo: true,
  asaas_plan_id: '',
};

export default function AdminPlanos() {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PlanoForm>(defaultForm);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planoToDelete, setPlanoToDelete] = useState<Plano | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchPlanos() {
    try {
      const { data, error } = await supabase
        .from('planos')
        .select('*')
        .order('valor_mensal', { ascending: true });

      if (error) throw error;
      setPlanos(data || []);
    } catch (error) {
      console.error('Error fetching planos:', error);
      toast.error('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPlanos();
  }, []);

  function openEdit(plano: Plano) {
    setEditingId(plano.id);
    setForm({
      nome: plano.nome,
      descricao: plano.descricao || '',
      max_corretores: plano.max_corretores,
      max_fichas_mes: plano.max_fichas_mes,
      max_clientes: plano.max_clientes,
      max_imoveis: plano.max_imoveis,
      valor_mensal: plano.valor_mensal,
      ativo: plano.ativo,
      asaas_plan_id: plano.asaas_plan_id || '',
    });
    setDialogOpen(true);
  }

  function openNew() {
    setEditingId(null);
    setForm(defaultForm);
    setDialogOpen(true);
  }

  async function handleDelete() {
    if (!planoToDelete) return;
    setDeleting(true);

    try {
      // Verificar se há assinaturas vinculadas
      const { count, error: countError } = await supabase
        .from('assinaturas')
        .select('*', { count: 'exact', head: true })
        .eq('plano_id', planoToDelete.id);

      if (countError) throw countError;

      if (count && count > 0) {
        toast.error(`Não é possível excluir: ${count} assinatura(s) vinculada(s) a este plano`);
        return;
      }

      // Excluir plano
      const { error } = await supabase
        .from('planos')
        .delete()
        .eq('id', planoToDelete.id);

      if (error) throw error;
      toast.success('Plano excluído com sucesso');
      fetchPlanos();
    } catch (error) {
      console.error('Error deleting plano:', error);
      toast.error('Erro ao excluir plano');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setPlanoToDelete(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const dataToSave = {
        ...form,
        asaas_plan_id: form.asaas_plan_id || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from('planos')
          .update(dataToSave)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Plano atualizado com sucesso');
      } else {
        const { error } = await supabase
          .from('planos')
          .insert(dataToSave);

        if (error) throw error;
        toast.success('Plano criado com sucesso');
      }

      setDialogOpen(false);
      fetchPlanos();
    } catch (error) {
      console.error('Error saving plano:', error);
      toast.error('Erro ao salvar plano');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Plans grid skeleton */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="flex flex-col">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex-1">
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <div className="flex gap-1">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 flex-1 flex flex-col">
                  <Skeleton className="h-10 w-32" />
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-36" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <AnimatedContent className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Planos</h1>
            <p className="text-muted-foreground">Gerencie os planos de assinatura</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Plano
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={form.descricao}
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max_corretores">Máx. Corretores</Label>
                    <Input
                      id="max_corretores"
                      type="number"
                      value={form.max_corretores}
                      onChange={(e) => setForm({ ...form, max_corretores: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_fichas_mes">Máx. Registros/Mês</Label>
                    <Input
                      id="max_fichas_mes"
                      type="number"
                      value={form.max_fichas_mes}
                      onChange={(e) => setForm({ ...form, max_fichas_mes: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_mensal">Valor Mensal (R$)</Label>
                  <Input
                    id="valor_mensal"
                    type="number"
                    step="0.01"
                    value={form.valor_mensal}
                    onChange={(e) => setForm({ ...form, valor_mensal: parseFloat(e.target.value) })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="asaas_plan_id">ID do Plano no Asaas (opcional)</Label>
                  <Input
                    id="asaas_plan_id"
                    value={form.asaas_plan_id}
                    onChange={(e) => setForm({ ...form, asaas_plan_id: e.target.value })}
                    placeholder="sub_xxxxxxxxxx"
                  />
                  <p className="text-xs text-muted-foreground">
                    ID da assinatura no Asaas para rastreamento
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="ativo">Plano ativo</Label>
                  <Switch
                    id="ativo"
                    checked={form.ativo}
                    onCheckedChange={(checked) => setForm({ ...form, ativo: checked })}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editingId ? 'Salvar Alterações' : 'Criar Plano'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <AnimatedList className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {planos.map((plano) => {
            const isGratuitoCpf = plano.nome.toLowerCase().includes('gratuito') && plano.tipo_cadastro === 'cpf';
            const isEnterprise = plano.valor_mensal === 0 && plano.max_corretores === 999;
            
            return (
              <AnimatedItem key={plano.id}>
                <Card
                  className={`relative overflow-hidden flex flex-col ${
                    !plano.ativo ? 'opacity-60' : ''
                } ${
                  isGratuitoCpf ? 'border-2 border-primary' : ''
                }`}
              >
                {/* Banner "Recomendado para começar" */}
                {isGratuitoCpf && (
                  <div className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 flex items-center justify-center gap-1.5">
                    <Sparkles className="h-3 w-3" />
                    Recomendado para começar
                  </div>
                )}
                
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex-1">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      {plano.nome}
                      {!plano.ativo && (
                        <Badge variant="outline" className="text-muted-foreground">
                          Inativo
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{plano.descricao}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(plano)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setPlanoToDelete(plano);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4 flex-1 flex flex-col">
                  {/* Preço em verde */}
                  <div className="text-3xl font-bold text-green-600">
                    {isEnterprise ? (
                      'Sob consulta'
                    ) : plano.valor_mensal === 0 ? (
                      'Grátis'
                    ) : (
                      <>
                        R$ {plano.valor_mensal.toFixed(2).replace('.', ',')}
                        <span className="text-base font-normal text-muted-foreground">/mês</span>
                      </>
                    )}
                  </div>

                  {/* Lista de recursos */}
                  <ul className="space-y-2 text-sm flex-1">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{plano.max_corretores === 999 ? 'Corretores ilimitados' : `Até ${plano.max_corretores} corretor(es)`}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{plano.max_fichas_mes >= 99999 ? 'Fichas ilimitadas' : `${plano.max_fichas_mes} fichas/mês`}</span>
                    </li>
                  </ul>

                  {/* Asaas ID (mantido para admin) */}
                  {plano.asaas_plan_id && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Asaas ID: <code className="bg-muted px-1 rounded">{plano.asaas_plan_id}</code>
                      </p>
                    </div>
                  )}

                  {/* Botão de ação */}
                  <Button 
                    variant={isGratuitoCpf ? 'default' : 'outline'}
                    className={`w-full mt-auto ${
                      isGratuitoCpf ? 'bg-green-500 hover:bg-green-600 text-white' : ''
                    }`}
                    onClick={() => openEdit(plano)}
                  >
                    {isGratuitoCpf ? (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Começar Grátis
                      </>
                    ) : (
                      'Escolher Plano'
                    )}
                  </Button>
                </CardContent>
              </Card>
              </AnimatedItem>
            );
          })}
        </AnimatedList>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Plano</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o plano "{planoToDelete?.nome}"?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90"
                disabled={deleting}
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AnimatedContent>
    </SuperAdminLayout>
  );
}
