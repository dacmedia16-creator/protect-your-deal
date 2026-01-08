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
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Loader2, Users, FileText, Building2, Home } from 'lucide-react';
import { toast } from 'sonner';

interface Plano {
  id: string;
  nome: string;
  descricao: string | null;
  max_corretores: number;
  max_fichas_mes: number;
  max_clientes: number;
  max_imoveis: number;
  valor_mensal: number;
  ativo: boolean;
  asaas_plan_id: string | null;
}

interface PlanoForm {
  nome: string;
  descricao: string;
  max_corretores: number;
  max_fichas_mes: number;
  max_clientes: number;
  max_imoveis: number;
  valor_mensal: number;
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
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
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
                  <div className="space-y-2">
                    <Label htmlFor="max_clientes">Máx. Clientes</Label>
                    <Input
                      id="max_clientes"
                      type="number"
                      value={form.max_clientes}
                      onChange={(e) => setForm({ ...form, max_clientes: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_imoveis">Máx. Imóveis</Label>
                    <Input
                      id="max_imoveis"
                      type="number"
                      value={form.max_imoveis}
                      onChange={(e) => setForm({ ...form, max_imoveis: parseInt(e.target.value) })}
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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {planos.map((plano) => (
            <Card key={plano.id} className={!plano.ativo ? 'opacity-60' : ''}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {plano.nome}
                    {!plano.ativo && (
                      <Badge variant="outline" className="text-muted-foreground">
                        Inativo
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{plano.descricao}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => openEdit(plano)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold text-primary">
                  {plano.valor_mensal === 0 ? (
                    'Sob consulta'
                  ) : (
                    <>
                      R$ {plano.valor_mensal.toFixed(2).replace('.', ',')}
                      <span className="text-sm font-normal text-muted-foreground">/mês</span>
                    </>
                  )}
                </div>

                <div className="space-y-2 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{plano.max_corretores === 999 ? 'Ilimitado' : plano.max_corretores} corretores</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{plano.max_fichas_mes >= 99999 ? 'Ilimitado' : plano.max_fichas_mes} registros/mês</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{plano.max_clientes >= 99999 ? 'Ilimitado' : plano.max_clientes} clientes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <span>{plano.max_imoveis >= 99999 ? 'Ilimitado' : plano.max_imoveis} imóveis</span>
                  </div>
                </div>

                {plano.asaas_plan_id && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Asaas ID: <code className="bg-muted px-1 rounded">{plano.asaas_plan_id}</code>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </SuperAdminLayout>
  );
}
