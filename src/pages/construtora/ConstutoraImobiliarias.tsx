import { useState } from 'react';
import { isFichaConfirmada } from '@/lib/fichaStatus';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Handshake, Loader2, Search, Plus, MoreVertical, Building2, Phone,
  FileText, Users, CheckCircle, PauseCircle, Trash2, Link2, MessageCircle,
} from 'lucide-react';

export default function ConstutoraImobiliarias() {
  useDocumentTitle('Imobiliárias Parceiras | Construtora');
  const { construtoraId } = useUserRole();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todas');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteSearch, setInviteSearch] = useState('');
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkImobId, setLinkImobId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{ id: string; nome: string } | null>(null);

  // --- Queries ---
  const { data: parcerias, isLoading } = useQuery({
    queryKey: ['construtora-parcerias', construtoraId],
    queryFn: async () => {
      if (!construtoraId) return [];
      const { data, error } = await supabase
        .from('construtora_imobiliarias')
        .select('*, imobiliarias:imobiliaria_id(id, nome, email, telefone, logo_url, status, cnpj)')
        .eq('construtora_id', construtoraId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!construtoraId,
  });

  const { data: empreendimentos } = useQuery({
    queryKey: ['construtora-empreendimentos', construtoraId],
    queryFn: async () => {
      if (!construtoraId) return [];
      const { data, error } = await supabase
        .from('empreendimentos')
        .select('id, nome')
        .eq('construtora_id', construtoraId)
        .eq('status', 'ativo')
        .order('nome');
      if (error) throw error;
      return data || [];
    },
    enabled: !!construtoraId,
  });

  const { data: empVinculos } = useQuery({
    queryKey: ['empreendimento-imobiliarias', construtoraId],
    queryFn: async () => {
      if (!construtoraId || !empreendimentos?.length) return [];
      const empIds = empreendimentos.map((e) => e.id);
      const { data, error } = await supabase
        .from('empreendimento_imobiliarias')
        .select('empreendimento_id, imobiliaria_id')
        .in('empreendimento_id', empIds);
      if (error) throw error;
      return data || [];
    },
    enabled: !!construtoraId && !!empreendimentos?.length,
  });

  const { data: fichaStats } = useQuery({
    queryKey: ['construtora-ficha-stats', construtoraId],
    queryFn: async () => {
      if (!construtoraId) return {};
      const { data, error } = await supabase
        .from('fichas_visita')
        .select('imobiliaria_id, status')
        .eq('construtora_id', construtoraId);
      if (error) throw error;
      const stats: Record<string, { total: number; confirmadas: number }> = {};
      (data || []).forEach((f) => {
        if (!f.imobiliaria_id) return;
        if (!stats[f.imobiliaria_id]) stats[f.imobiliaria_id] = { total: 0, confirmadas: 0 };
        stats[f.imobiliaria_id].total++;
        if (isFichaConfirmada(f.status)) stats[f.imobiliaria_id].confirmadas++;
      });
      return stats;
    },
    enabled: !!construtoraId,
  });

  const { data: corretorStats } = useQuery({
    queryKey: ['construtora-corretor-stats', construtoraId, parcerias],
    queryFn: async () => {
      if (!parcerias?.length) return {};
      const imobIds = parcerias.map((p: any) => p.imobiliaria_id);
      const { data, error } = await supabase
        .from('user_roles')
        .select('imobiliaria_id')
        .in('imobiliaria_id', imobIds)
        .eq('role', 'corretor');
      if (error) throw error;
      const stats: Record<string, number> = {};
      (data || []).forEach((r) => {
        if (!r.imobiliaria_id) return;
        stats[r.imobiliaria_id] = (stats[r.imobiliaria_id] || 0) + 1;
      });
      return stats;
    },
    enabled: !!parcerias?.length,
  });

  // Invite search
  const { data: searchResults, isFetching: searching } = useQuery({
    queryKey: ['invite-search', inviteSearch],
    queryFn: async () => {
      if (inviteSearch.length < 3) return [];
      const cleaned = inviteSearch.replace(/\D/g, '');
      let query = supabase.from('imobiliarias').select('id, nome, email, cnpj, logo_url').eq('status', 'ativo');
      if (cleaned.length >= 3) {
        query = query.or(`email.ilike.%${inviteSearch}%,cnpj.ilike.%${cleaned}%,nome.ilike.%${inviteSearch}%`);
      } else {
        query = query.or(`email.ilike.%${inviteSearch}%,nome.ilike.%${inviteSearch}%`);
      }
      const { data, error } = await query.limit(10);
      if (error) throw error;
      // Filter out already partnered
      const existingIds = new Set(parcerias?.map((p: any) => p.imobiliaria_id) || []);
      return (data || []).filter((i) => !existingIds.has(i.id));
    },
    enabled: inviteSearch.length >= 3 && inviteOpen,
  });

  // --- Mutations ---
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['construtora-parcerias'] });
    queryClient.invalidateQueries({ queryKey: ['empreendimento-imobiliarias'] });
    queryClient.invalidateQueries({ queryKey: ['construtora-ficha-stats'] });
    queryClient.invalidateQueries({ queryKey: ['construtora-corretor-stats'] });
  };

  const addPartner = useMutation({
    mutationFn: async (imobiliariaId: string) => {
      const { error } = await supabase.from('construtora_imobiliarias').insert({
        construtora_id: construtoraId!,
        imobiliaria_id: imobiliariaId,
        status: 'pendente',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Convite enviado! A imobiliária precisa aceitar a parceria.');
      invalidateAll();
      setInviteOpen(false);
      setInviteSearch('');
    },
    onError: (e: any) => {
      if (e.message?.includes('duplicate') || e.code === '23505') {
        toast.error('Esta imobiliária já está vinculada.');
      } else {
        toast.error('Erro ao vincular imobiliária.');
      }
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('construtora_imobiliarias')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      toast.success(status === 'ativa' ? 'Parceria reativada!' : 'Parceria suspensa.');
      invalidateAll();
    },
    onError: () => toast.error('Erro ao atualizar status.'),
  });

  const removePartner = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('construtora_imobiliarias').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Parceria removida.');
      invalidateAll();
      setRemoveTarget(null);
    },
    onError: () => toast.error('Erro ao remover parceria.'),
  });

  const toggleEmpLink = useMutation({
    mutationFn: async ({ empId, imobId, linked }: { empId: string; imobId: string; linked: boolean }) => {
      if (linked) {
        const { error } = await supabase
          .from('empreendimento_imobiliarias')
          .delete()
          .eq('empreendimento_id', empId)
          .eq('imobiliaria_id', imobId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('empreendimento_imobiliarias')
          .insert({ empreendimento_id: empId, imobiliaria_id: imobId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empreendimento-imobiliarias'] });
      toast.success('Vínculos atualizados.');
    },
    onError: () => toast.error('Erro ao atualizar vínculo.'),
  });

  // --- Helpers ---
  const getLinkedEmps = (imobId: string) =>
    (empVinculos || []).filter((v) => v.imobiliaria_id === imobId).map((v) => v.empreendimento_id);

  const getEmpName = (empId: string) =>
    empreendimentos?.find((e) => e.id === empId)?.nome || '';

  const formatPhone = (phone: string) => {
    const d = phone.replace(/\D/g, '');
    return `55${d}`;
  };

  // --- Filtered list ---
  const filtered = (parcerias || []).filter((p: any) => {
    const imob = p.imobiliarias;
    const matchSearch =
      !searchFilter ||
      imob?.nome?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      imob?.email?.toLowerCase().includes(searchFilter.toLowerCase());
    const matchStatus = statusFilter === 'todas' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (<><div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold">Imobiliárias Parceiras</h1>
            <p className="text-muted-foreground">Gerencie as imobiliárias vinculadas à construtora</p>
          </div>
          <Button onClick={() => setInviteOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Convidar Imobiliária
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="ativa">Ativa</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="suspensa">Suspensa</SelectItem>
              <SelectItem value="recusada">Recusada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !filtered.length ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Handshake className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {parcerias?.length ? 'Nenhum resultado encontrado' : 'Nenhuma imobiliária parceira vinculada'}
              </p>
              {!parcerias?.length && (
                <p className="text-sm text-muted-foreground mt-2">
                  Clique em "Convidar Imobiliária" para adicionar uma parceira.
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p: any) => {
              const imob = p.imobiliarias;
              const stats = fichaStats?.[p.imobiliaria_id];
              const corretores = corretorStats?.[p.imobiliaria_id] || 0;
              const linkedEmps = getLinkedEmps(p.imobiliaria_id);

              return (
                <Card key={p.id} className="flex flex-col cursor-pointer hover:border-primary transition-colors"
                  onClick={() => navigate(`/construtora/fichas?imobiliaria=${p.imobiliaria_id}`)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        {imob?.logo_url ? (
                          <img src={imob.logo_url} alt={imob.nome} className="h-10 w-10 object-contain rounded shrink-0" />
                        ) : (
                          <div className="h-10 w-10 bg-muted rounded flex items-center justify-center shrink-0">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <CardTitle className="text-base truncate">{imob?.nome || 'Imobiliária'}</CardTitle>
                          {imob?.email && (
                            <p className="text-xs text-muted-foreground truncate">{imob.email}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge
                          variant="outline"
                          className={
                            p.status === 'ativa'
                              ? 'bg-green-500/10 text-green-600 border-green-200'
                              : p.status === 'pendente'
                              ? 'bg-yellow-500/10 text-yellow-600 border-yellow-200'
                              : p.status === 'recusada'
                              ? 'bg-red-500/10 text-red-600 border-red-200'
                              : 'bg-orange-500/10 text-orange-600 border-orange-200'
                          }
                        >
                          {p.status === 'ativa' ? 'Ativa' : p.status === 'pendente' ? 'Pendente' : p.status === 'recusada' ? 'Recusada' : 'Suspensa'}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {p.status === 'ativa' ? (
                              <DropdownMenuItem onClick={() => updateStatus.mutate({ id: p.id, status: 'suspensa' })}>
                                <PauseCircle className="h-4 w-4 mr-2" /> Suspender
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => updateStatus.mutate({ id: p.id, status: 'ativa' })}>
                                <CheckCircle className="h-4 w-4 mr-2" /> Reativar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                setLinkImobId(p.imobiliaria_id);
                                setLinkOpen(true);
                              }}
                            >
                              <Link2 className="h-4 w-4 mr-2" /> Vincular Empreendimentos
                            </DropdownMenuItem>
                            {imob?.telefone && (
                              <DropdownMenuItem
                                onClick={() =>
                                  window.open(
                                    `https://wa.me/${formatPhone(imob.telefone)}`,
                                    '_blank'
                                  )
                                }
                              >
                                <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setRemoveTarget({ id: p.id, nome: imob?.nome || 'Imobiliária' })}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Remover Parceria
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-3">
                    {/* KPIs */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-muted/50 rounded-lg p-2">
                        <FileText className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                        <p className="text-lg font-bold">{stats?.total || 0}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">Fichas</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2">
                        <CheckCircle className="h-4 w-4 mx-auto text-green-500 mb-1" />
                        <p className="text-lg font-bold">{stats?.confirmadas || 0}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">Confirmadas</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2">
                        <Users className="h-4 w-4 mx-auto text-primary mb-1" />
                        <p className="text-lg font-bold">{corretores}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">Corretores</p>
                      </div>
                    </div>

                    {/* Linked empreendimentos */}
                    {linkedEmps.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {linkedEmps.map((empId) => (
                          <Badge key={empId} variant="secondary" className="text-[10px]">
                            {getEmpName(empId)}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Quick actions */}
                    <div className="flex gap-2 pt-1">
                      {imob?.telefone && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`https://wa.me/${formatPhone(imob.telefone)}`, '_blank');
                          }}
                        >
                          <Phone className="h-3 w-3" /> WhatsApp
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLinkImobId(p.imobiliaria_id);
                          setLinkOpen(true);
                        }}
                      >
                        <Link2 className="h-3 w-3" /> Empreendimentos
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Convidar Imobiliária</DialogTitle>
            <DialogDescription>Busque por nome, email ou CNPJ para vincular uma imobiliária parceira.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Digite nome, email ou CNPJ..."
                value={inviteSearch}
                onChange={(e) => setInviteSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {searching && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
              {!searching && inviteSearch.length >= 3 && !searchResults?.length && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma imobiliária encontrada.</p>
              )}
              {searchResults?.map((imob) => (
                <div
                  key={imob.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {imob.logo_url ? (
                      <img src={imob.logo_url} alt={imob.nome} className="h-8 w-8 rounded object-contain" />
                    ) : (
                      <div className="h-8 w-8 bg-muted rounded flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{imob.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">{imob.email}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addPartner.mutate(imob.id)}
                    disabled={addPartner.isPending}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Link Empreendimentos Dialog */}
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vincular Empreendimentos</DialogTitle>
            <DialogDescription>Selecione os empreendimentos que esta imobiliária pode acessar.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {!empreendimentos?.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum empreendimento cadastrado.</p>
            ) : (
              empreendimentos.map((emp) => {
                const linked = linkImobId
                  ? (empVinculos || []).some(
                      (v) => v.empreendimento_id === emp.id && v.imobiliaria_id === linkImobId
                    )
                  : false;
                return (
                  <label
                    key={emp.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={linked}
                      onCheckedChange={() => {
                        if (linkImobId) {
                          toggleEmpLink.mutate({ empId: emp.id, imobId: linkImobId, linked });
                        }
                      }}
                    />
                    <span className="text-sm">{emp.nome}</span>
                  </label>
                );
              })
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation */}
      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Parceria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a parceria com <strong>{removeTarget?.nome}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => removeTarget && removePartner.mutate(removeTarget.id)}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </>);
}
