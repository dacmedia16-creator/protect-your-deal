import { useEffect, useState } from 'react';
import { entityStatusColors, subscriptionStatusColors, getStatusColor } from '@/lib/statusColors';
import { useNavigate } from 'react-router-dom';
import { SuperAdminLayout } from '@/components/layouts/SuperAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Search, MoreHorizontal, HardHat, Eye, Power, CreditCard, Ban, Trash2, ClipboardCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { AnimatedContent, AnimatedList, AnimatedItem } from '@/components/AnimatedContent';

interface Construtora {
  id: string;
  nome: string;
  cnpj: string | null;
  email: string;
  telefone: string | null;
  cidade: string | null;
  estado: string | null;
  status: string;
  created_at: string;
  codigo?: number | null;
  empreendimentos_count?: number;
  parceiras_count?: number;
  corretores_count?: number;
  assinatura_status?: string;
  assinatura_id?: string | null;
  assinatura_plano_id?: string | null;
  assinatura_plano_nome?: string | null;
  survey_enabled?: boolean;
  corretores_parceiros_count?: number;
}

interface Plano {
  id: string;
  nome: string;
  valor_mensal: number;
  max_corretores: number;
}

export default function AdminConstrutoras() {
  const navigate = useNavigate();
  const [construtoras, setConstrutoras] = useState<Construtora[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [isPlanoDialogOpen, setIsPlanoDialogOpen] = useState(false);
  const [construtoraToChangePlan, setConstrutoraToChangePlan] = useState<Construtora | null>(null);
  const [selectedPlanoId, setSelectedPlanoId] = useState('');
  const [isChangingPlano, setIsChangingPlano] = useState(false);
  const [isTogglingAssinatura, setIsTogglingAssinatura] = useState<string | null>(null);
  const [isTogglingFeature, setIsTogglingFeature] = useState<string | null>(null);

  async function fetchPlanos() {
    const { data } = await supabase
      .from('planos')
      .select('id, nome, valor_mensal, max_corretores')
      .eq('ativo', true)
      .order('valor_mensal');
    setPlanos(data || []);
  }

  async function fetchConstrutoras() {
    try {
      const { data, error } = await supabase
        .from('construtoras')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enrichedData = await Promise.all(
        (data || []).map(async (c) => {
          const { count: empreendimentos_count } = await supabase
            .from('empreendimentos')
            .select('*', { count: 'exact', head: true })
            .eq('construtora_id', c.id);

          const { count: parceiras_count } = await supabase
            .from('construtora_imobiliarias')
            .select('*', { count: 'exact', head: true })
            .eq('construtora_id', c.id);

          const { count: corretores_count } = await supabase
            .from('user_roles')
            .select('*', { count: 'exact', head: true })
            .eq('construtora_id', c.id)
            .eq('role', 'corretor');

          const { data: assData } = await supabase
            .from('assinaturas')
            .select('id, status, plano_id')
            .eq('construtora_id', c.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          let assinatura_plano_nome: string | null = null;
          if (assData?.plano_id) {
            const { data: planoData } = await supabase
              .from('planos')
              .select('nome')
              .eq('id', assData.plano_id)
              .maybeSingle();
            assinatura_plano_nome = planoData?.nome || null;
          }

          const { data: flagData } = await supabase
            .from('construtora_feature_flags')
            .select('enabled')
            .eq('construtora_id', c.id)
            .eq('feature_key', 'post_visit_survey')
            .maybeSingle();

          return {
            ...c,
            empreendimentos_count: empreendimentos_count || 0,
            parceiras_count: parceiras_count || 0,
            corretores_count: corretores_count || 0,
            assinatura_status: assData?.status || 'sem_assinatura',
            assinatura_id: assData?.id || null,
            assinatura_plano_id: assData?.plano_id || null,
            assinatura_plano_nome,
            survey_enabled: flagData?.enabled ?? false,
          };
        })
      );

      setConstrutoras(enrichedData);
    } catch (error) {
      console.error('Error fetching construtoras:', error);
      toast.error('Erro ao carregar construtoras');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchConstrutoras();
    fetchPlanos();
  }, []);

  async function toggleStatus(c: Construtora) {
    const newStatus = c.status === 'ativo' ? 'suspenso' : 'ativo';
    try {
      const { error } = await supabase
        .from('construtoras')
        .update({ status: newStatus })
        .eq('id', c.id);
      if (error) throw error;
      toast.success(`Construtora ${newStatus === 'ativo' ? 'ativada' : 'suspensa'} com sucesso`);
      fetchConstrutoras();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
    }
  }

  async function toggleAssinatura(c: Construtora) {
    if (!c.assinatura_status || c.assinatura_status === 'sem_assinatura') {
      toast.error('Construtora não possui assinatura vinculada');
      return;
    }

    setIsTogglingAssinatura(c.id);
    try {
      const novoStatus = c.assinatura_status === 'ativa' ? 'suspensa' : 'ativa';
      const { error } = await supabase
        .from('assinaturas')
        .update({ status: novoStatus })
        .eq('construtora_id', c.id);

      if (error) throw error;
      toast.success(novoStatus === 'ativa' ? 'Assinatura ativada com sucesso!' : 'Assinatura suspensa com sucesso!');
      fetchConstrutoras();
    } catch (error: any) {
      console.error('Error toggling subscription:', error);
      toast.error(error.message || 'Erro ao alterar status da assinatura');
    } finally {
      setIsTogglingAssinatura(null);
    }
  }

  async function toggleSurveyFeature(c: Construtora) {
    setIsTogglingFeature(c.id);
    try {
      const newEnabled = !c.survey_enabled;
      const { error } = await supabase
        .from('construtora_feature_flags')
        .upsert(
          { construtora_id: c.id, feature_key: 'post_visit_survey', enabled: newEnabled, updated_at: new Date().toISOString() },
          { onConflict: 'construtora_id,feature_key' }
        );
      if (error) throw error;
      toast.success(newEnabled ? 'Pesquisa habilitada com sucesso!' : 'Pesquisa desabilitada com sucesso!');
      fetchConstrutoras();
    } catch (error: any) {
      console.error('Error toggling survey feature:', error);
      toast.error(error.message || 'Erro ao alterar pesquisa');
    } finally {
      setIsTogglingFeature(null);
    }
  }

  function openPlanoDialog(c: Construtora) {
    setConstrutoraToChangePlan(c);
    setSelectedPlanoId(c.assinatura_plano_id || '');
    setIsPlanoDialogOpen(true);
  }

  async function handleChangePlano() {
    if (!construtoraToChangePlan || !selectedPlanoId) {
      toast.error('Selecione um plano');
      return;
    }

    setIsChangingPlano(true);
    try {
      if (construtoraToChangePlan.assinatura_id) {
        const { error } = await supabase
          .from('assinaturas')
          .update({ plano_id: selectedPlanoId, status: 'ativa' })
          .eq('id', construtoraToChangePlan.assinatura_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('assinaturas')
          .insert({
            construtora_id: construtoraToChangePlan.id,
            plano_id: selectedPlanoId,
            status: 'ativa',
            data_inicio: new Date().toISOString().split('T')[0],
          });
        if (error) throw error;
      }

      toast.success('Plano alterado com sucesso!');
      setIsPlanoDialogOpen(false);
      setConstrutoraToChangePlan(null);
      setSelectedPlanoId('');
      fetchConstrutoras();
    } catch (error: any) {
      console.error('Error changing plan:', error);
      toast.error(error.message || 'Erro ao alterar plano');
    } finally {
      setIsChangingPlano(false);
    }
  }

  async function deleteConstrutora(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta construtora? Esta ação não pode ser desfeita.')) return;

    try {
      const { error } = await supabase
        .from('construtoras')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Construtora excluída com sucesso');
      fetchConstrutoras();
    } catch (error) {
      console.error('Error deleting construtora:', error);
      toast.error('Erro ao excluir construtora');
    }
  }

  const filtered = construtoras.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.cnpj?.includes(search)
  );

  function renderDropdownItems(c: Construtora, stopPropagation: boolean) {
    const stop = (e: React.MouseEvent) => { if (stopPropagation) e.stopPropagation(); };
    return (
      <>
        <DropdownMenuItem onClick={(e) => { stop(e); navigate(`/admin/construtoras/${c.id}`); }}>
          <Eye className="h-4 w-4 mr-2" /> Ver detalhes
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { stop(e); toggleStatus(c); }}>
          <Power className="h-4 w-4 mr-2" />
          {c.status === 'ativo' ? 'Suspender' : 'Ativar'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { stop(e); openPlanoDialog(c); }}>
          <CreditCard className="h-4 w-4 mr-2" /> Alterar Plano
        </DropdownMenuItem>
        {c.assinatura_status && c.assinatura_status !== 'sem_assinatura' && (
          <DropdownMenuItem onClick={(e) => { stop(e); toggleAssinatura(c); }}>
            <Ban className="h-4 w-4 mr-2" />
            {c.assinatura_status === 'ativa' ? 'Desativar Assinatura' : 'Ativar Assinatura'}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={(e) => { stop(e); toggleSurveyFeature(c); }} disabled={isTogglingFeature === c.id}>
          <ClipboardCheck className="h-4 w-4 mr-2" />
          {c.survey_enabled ? 'Desabilitar Pesquisa' : 'Habilitar Pesquisa'}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => { stop(e); deleteConstrutora(c.id); }}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" /> Excluir
        </DropdownMenuItem>
      </>
    );
  }

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <Skeleton className="h-8 w-40 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Card>
            <CardHeader><Skeleton className="h-10 w-full max-w-md" /></CardHeader>
            <CardContent>
              <div className="hidden md:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {[1,2,3,4,5,6].map(i => <TableHead key={i}><Skeleton className="h-4 w-20" /></TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[1,2,3,4,5].map(i => (
                      <TableRow key={i}>
                        {[1,2,3,4,5,6].map(j => <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <AnimatedContent className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Construtoras</h1>
            <p className="text-muted-foreground">Gerencie as construtoras cadastradas</p>
          </div>
          <Button onClick={() => navigate('/admin/construtoras/nova')}>
            <HardHat className="h-4 w-4 mr-2" /> Nova Construtora
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou CNPJ..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <HardHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Nenhuma construtora encontrada</h3>
                <p className="text-muted-foreground">
                  {search ? 'Tente buscar por outro termo' : 'Nenhuma construtora cadastrada ainda'}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile cards */}
                <AnimatedList className="grid grid-cols-1 gap-3 md:hidden">
                  {filtered.map((c) => (
                    <AnimatedItem key={c.id}>
                      <Card className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2" onClick={() => navigate(`/admin/construtoras/${c.id}`)}>
                              {c.codigo && <Badge variant="outline" className="text-xs">#{c.codigo}</Badge>}
                              <span className="font-medium">{c.nome}</span>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {renderDropdownItems(c, false)}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <p className="text-sm text-muted-foreground">{c.email}</p>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(entityStatusColors, c.status)}>{c.status}</Badge>
                            <Badge className={getStatusColor(subscriptionStatusColors, c.assinatura_status ?? 'sem_assinatura')} variant="outline">
                              {c.assinatura_status ?? 'sem_assinatura'}
                            </Badge>
                          </div>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span>{c.empreendimentos_count} empreendimentos</span>
                            <span>{c.parceiras_count} parceiras</span>
                            <span>{c.corretores_count} corretores</span>
                          </div>
                        </CardContent>
                      </Card>
                    </AnimatedItem>
                  ))}
                </AnimatedList>

                {/* Desktop table */}
                <div className="hidden md:block rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cód</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Empreend.</TableHead>
                        <TableHead>Parceiras</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assinatura</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((c) => (
                        <TableRow
                          key={c.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/admin/construtoras/${c.id}`)}
                        >
                          <TableCell className="font-mono text-xs">{c.codigo || '-'}</TableCell>
                          <TableCell className="font-medium">{c.nome}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{c.email}</TableCell>
                          <TableCell>{c.empreendimentos_count}</TableCell>
                          <TableCell>{c.parceiras_count}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(entityStatusColors, c.status)}>{c.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(subscriptionStatusColors, c.assinatura_status ?? 'sem_assinatura')} variant="outline">
                              {c.assinatura_status ?? 'sem_assinatura'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {renderDropdownItems(c, true)}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Dialog para alterar plano */}
        <Dialog open={isPlanoDialogOpen} onOpenChange={setIsPlanoDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Alterar Plano da Construtora</DialogTitle>
              <DialogDescription>
                Selecione o novo plano para {construtoraToChangePlan?.nome}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Plano atual</Label>
                <p className="text-sm text-muted-foreground">
                  {construtoraToChangePlan?.assinatura_plano_nome || 'Sem plano'}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Novo plano</Label>
                <Select value={selectedPlanoId} onValueChange={setSelectedPlanoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {planos.map((plano) => (
                      <SelectItem key={plano.id} value={plano.id}>
                        {plano.nome} - R$ {plano.valor_mensal.toFixed(2)} ({plano.max_corretores} corretores)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPlanoDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleChangePlano} disabled={isChangingPlano || !selectedPlanoId}>
                {isChangingPlano ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AnimatedContent>
    </SuperAdminLayout>
  );
}
