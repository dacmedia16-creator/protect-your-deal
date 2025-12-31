import { useState } from 'react';
import { SuperAdminLayout } from '@/components/layouts/SuperAdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Package, 
  Loader2, 
  Edit, 
  Users, 
  Building2, 
  UserCircle,
  CheckCircle,
  XCircle,
  Search,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Modulo {
  id: string;
  nome: string;
  codigo: string;
  descricao: string | null;
  valor_mensal: number;
  recursos: string[];
  ativo: boolean;
  created_at: string;
}

interface ModuloContratado {
  id: string;
  modulo_id: string;
  status: string;
  data_inicio: string;
  data_fim: string | null;
  user_id: string | null;
  imobiliaria_id: string | null;
  asaas_subscription_id: string | null;
  profile?: { nome: string } | null;
  imobiliaria?: { nome: string } | null;
}

export default function AdminModulos() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingModulo, setEditingModulo] = useState<Modulo | null>(null);
  const [viewingAssinantes, setViewingAssinantes] = useState<string | null>(null);

  // Buscar módulos
  const { data: modulos, isLoading: loadingModulos } = useQuery({
    queryKey: ['admin-modulos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modulos')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []).map(m => ({
        ...m,
        recursos: Array.isArray(m.recursos) ? m.recursos as string[] : []
      })) as Modulo[];
    },
  });

  // Buscar contratações por módulo
  const { data: contratacoes, isLoading: loadingContratacoes } = useQuery({
    queryKey: ['admin-modulos-contratados', viewingAssinantes],
    queryFn: async () => {
      if (!viewingAssinantes) return [];
      
      const { data, error } = await supabase
        .from('modulos_contratados')
        .select('*')
        .eq('modulo_id', viewingAssinantes)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich with profile/imobiliaria names
      const enriched = await Promise.all((data || []).map(async (c) => {
        let profile = null;
        let imobiliaria = null;

        if (c.user_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('nome')
            .eq('user_id', c.user_id)
            .maybeSingle();
          profile = profileData;
        }

        if (c.imobiliaria_id) {
          const { data: imobData } = await supabase
            .from('imobiliarias')
            .select('nome')
            .eq('id', c.imobiliaria_id)
            .maybeSingle();
          imobiliaria = imobData;
        }

        return { ...c, profile, imobiliaria };
      }));

      return enriched as ModuloContratado[];
    },
    enabled: !!viewingAssinantes,
  });

  // Contar assinantes por módulo
  const { data: assinantesCount } = useQuery({
    queryKey: ['admin-modulos-count'],
    queryFn: async () => {
      const counts: Record<string, { ativos: number; total: number }> = {};
      
      if (!modulos) return counts;

      for (const modulo of modulos) {
        const { count: total } = await supabase
          .from('modulos_contratados')
          .select('*', { count: 'exact', head: true })
          .eq('modulo_id', modulo.id);

        const { count: ativos } = await supabase
          .from('modulos_contratados')
          .select('*', { count: 'exact', head: true })
          .eq('modulo_id', modulo.id)
          .eq('status', 'ativo');

        counts[modulo.id] = { ativos: ativos || 0, total: total || 0 };
      }

      return counts;
    },
    enabled: !!modulos && modulos.length > 0,
  });

  // Mutation para atualizar módulo
  const updateModuloMutation = useMutation({
    mutationFn: async (modulo: Partial<Modulo> & { id: string }) => {
      const { error } = await supabase
        .from('modulos')
        .update({
          nome: modulo.nome,
          descricao: modulo.descricao,
          valor_mensal: modulo.valor_mensal,
          recursos: modulo.recursos,
          ativo: modulo.ativo,
        })
        .eq('id', modulo.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-modulos'] });
      toast.success('Módulo atualizado com sucesso');
      setEditingModulo(null);
    },
    onError: (error) => {
      console.error('Error updating modulo:', error);
      toast.error('Erro ao atualizar módulo');
    },
  });

  // Mutation para cancelar contratação
  const cancelContratacaoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('modulos_contratados')
        .update({ status: 'cancelado', data_fim: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-modulos-contratados'] });
      queryClient.invalidateQueries({ queryKey: ['admin-modulos-count'] });
      toast.success('Contratação cancelada');
    },
    onError: () => {
      toast.error('Erro ao cancelar contratação');
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const filteredModulos = modulos?.filter(m =>
    m.nome.toLowerCase().includes(search.toLowerCase()) ||
    m.codigo.toLowerCase().includes(search.toLowerCase())
  );

  const selectedModulo = modulos?.find(m => m.id === viewingAssinantes);

  if (loadingModulos) {
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
        <div>
          <h1 className="text-2xl font-display font-bold">Módulos</h1>
          <p className="text-muted-foreground">Gerencie módulos e visualize assinantes</p>
        </div>

        {/* Cards de resumo */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Módulos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{modulos?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                {modulos?.filter(m => m.ativo).length || 0} ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assinantes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.values(assinantesCount || {}).reduce((acc, c) => acc + c.ativos, 0)}
              </div>
              <p className="text-xs text-muted-foreground">assinaturas ativas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Estimada</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  modulos?.reduce((acc, m) => {
                    const count = assinantesCount?.[m.id]?.ativos || 0;
                    return acc + (m.valor_mensal * count);
                  }, 0) || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">/mês</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Módulos */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Módulos Disponíveis</CardTitle>
                <CardDescription>Clique em "Ver Assinantes" para detalhes</CardDescription>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar módulo..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Recursos</TableHead>
                    <TableHead>Assinantes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredModulos?.map((modulo) => (
                    <TableRow key={modulo.id}>
                      <TableCell className="font-medium">{modulo.nome}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {modulo.codigo}
                        </code>
                      </TableCell>
                      <TableCell>{formatCurrency(modulo.valor_mensal)}/mês</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {modulo.recursos.slice(0, 2).map((r) => (
                            <Badge key={r} variant="secondary" className="text-xs">
                              {r}
                            </Badge>
                          ))}
                          {modulo.recursos.length > 2 && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Badge 
                                  variant="outline" 
                                  className="text-xs cursor-pointer hover:bg-muted"
                                >
                                  +{modulo.recursos.length - 2}
                                </Badge>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto max-w-xs">
                                <div className="space-y-2">
                                  <p className="font-medium text-sm">Todos os recursos</p>
                                  <div className="flex flex-wrap gap-1">
                                    {modulo.recursos.map((r) => (
                                      <Badge key={r} variant="secondary" className="text-xs">
                                        {r}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {assinantesCount?.[modulo.id]?.ativos || 0}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            / {assinantesCount?.[modulo.id]?.total || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={modulo.ativo ? 'default' : 'secondary'}>
                          {modulo.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewingAssinantes(modulo.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingModulo(modulo)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Dialog de Assinantes */}
        <Dialog open={!!viewingAssinantes} onOpenChange={(open) => !open && setViewingAssinantes(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Assinantes - {selectedModulo?.nome}</DialogTitle>
              <DialogDescription>
                {assinantesCount?.[viewingAssinantes || '']?.ativos || 0} assinaturas ativas
              </DialogDescription>
            </DialogHeader>

            {loadingContratacoes ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : contratacoes && contratacoes.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contratacoes.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        {c.imobiliaria_id ? (
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs">Imobiliária</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <UserCircle className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs">Autônomo</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {c.imobiliaria?.nome || c.profile?.nome || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(c.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.status === 'ativo' ? 'default' : 'secondary'}>
                          {c.status === 'ativo' ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {c.status === 'ativo' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => cancelContratacaoMutation.mutate(c.id)}
                          >
                            Cancelar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum assinante encontrado
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de Edição */}
        <Dialog open={!!editingModulo} onOpenChange={(open) => !open && setEditingModulo(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Módulo</DialogTitle>
              <DialogDescription>Atualize as informações do módulo</DialogDescription>
            </DialogHeader>

            {editingModulo && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={editingModulo.nome}
                    onChange={(e) => setEditingModulo({ ...editingModulo, nome: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={editingModulo.descricao || ''}
                    onChange={(e) => setEditingModulo({ ...editingModulo, descricao: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor">Valor Mensal (R$)</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    value={editingModulo.valor_mensal}
                    onChange={(e) => setEditingModulo({ 
                      ...editingModulo, 
                      valor_mensal: parseFloat(e.target.value) || 0 
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recursos">Recursos (um por linha)</Label>
                  <Textarea
                    id="recursos"
                    value={editingModulo.recursos.join('\n')}
                    onChange={(e) => setEditingModulo({ 
                      ...editingModulo, 
                      recursos: e.target.value.split('\n').filter(r => r.trim()) 
                    })}
                    rows={5}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="ativo">Módulo Ativo</Label>
                  <Switch
                    id="ativo"
                    checked={editingModulo.ativo}
                    onCheckedChange={(checked) => setEditingModulo({ ...editingModulo, ativo: checked })}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingModulo(null)}>
                Cancelar
              </Button>
              <Button
                onClick={() => editingModulo && updateModuloMutation.mutate(editingModulo)}
                disabled={updateModuloMutation.isPending}
              >
                {updateModuloMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  );
}
