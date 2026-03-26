import { useState, useMemo, useEffect } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ConstutoraLayout } from '@/components/layouts/ConstutoraLayout';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import {
  Users, Loader2, Search, MoreHorizontal, UserPlus, Pencil,
  UserCheck, UserX, KeyRound, Shield, FileText
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { PasswordInput } from '@/components/PasswordInput';
import { toast } from 'sonner';
import { invokeWithRetry } from '@/lib/invokeWithRetry';
import { cn } from '@/lib/utils';

interface CorretorData {
  user_id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  creci: string | null;
  cpf: string | null;
  ativo: boolean;
  fichas_count: number;
}

export default function ConstutoraCorretores() {
  useDocumentTitle('Corretores | Construtora');
  const { construtoraId } = useUserRole();

  const [corretores, setCorretores] = useState<CorretorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ nome: '', email: '', senha: '', telefone: '', creci: '', cpf: '' });

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTarget, setEditTarget] = useState<CorretorData | null>(null);
  const [editForm, setEditForm] = useState({ nome: '', telefone: '', creci: '', cpf: '' });

  // Reset password dialog
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetTarget, setResetTarget] = useState<CorretorData | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Deactivate confirmation
  const [deactivateTarget, setDeactivateTarget] = useState<CorretorData | null>(null);

  async function fetchData() {
    if (!construtoraId) return;
    try {
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('construtora_id', construtoraId)
        .eq('role', 'corretor');

      if (rolesError) throw rolesError;
      if (!roles?.length) { setCorretores([]); setLoading(false); return; }

      const userIds = roles.map(r => r.user_id);

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, nome, email, telefone, creci, cpf, ativo')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Count fichas per corretor
      const enriched = await Promise.all(
        (profiles || []).map(async (p) => {
          const { count } = await supabase
            .from('fichas_visita')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', p.user_id);

          return {
            user_id: p.user_id,
            nome: p.nome || '—',
            email: p.email,
            telefone: p.telefone,
            creci: p.creci,
            cpf: (p as any).cpf || null,
            ativo: p.ativo ?? true,
            fichas_count: count || 0,
          };
        })
      );

      setCorretores(enriched);
    } catch (err) {
      console.error('Error fetching corretores:', err);
      toast.error('Erro ao carregar corretores');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, [construtoraId]);

  // Filtered & sorted
  const filtered = useMemo(() => {
    return corretores
      .filter(c => {
        const s = search.toLowerCase();
        return c.nome.toLowerCase().includes(s) || c.creci?.toLowerCase().includes(s);
      })
      .sort((a, b) => (b.fichas_count || 0) - (a.fichas_count || 0));
  }, [corretores, search]);

  // KPIs
  const stats = useMemo(() => ({
    ativos: corretores.filter(c => c.ativo).length,
    inativos: corretores.filter(c => !c.ativo).length,
    totalFichas: corretores.reduce((sum, c) => sum + c.fichas_count, 0),
  }), [corretores]);

  // --- Handlers ---

  const handleCreate = async () => {
    if (!form.nome || !form.email || !form.senha) {
      toast.error('Nome, email e senha são obrigatórios');
      return;
    }
    if (form.senha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await invokeWithRetry<{ success: boolean; error?: string }>('admin-create-corretor', {
        body: { nome: form.nome, email: form.email, senha: form.senha, telefone: form.telefone || undefined, creci: form.creci || undefined, cpf: form.cpf || undefined, construtora: true },
      });
      if (error) {
        let msg = 'Erro ao criar corretor';
        try { const ctx = (error as any)?.context; if (ctx instanceof Response) { const body = await ctx.json(); msg = body.error || msg; } } catch {}
        toast.error(msg); return;
      }
      if (data && !(data as any).success) { toast.error((data as any).error || 'Erro ao criar corretor'); return; }
      toast.success('Corretor criado com sucesso!');
      setForm({ nome: '', email: '', senha: '', telefone: '', creci: '', cpf: '' });
      setCreateDialogOpen(false);
      fetchData();
    } catch { toast.error('Erro inesperado'); } finally { setCreating(false); }
  };

  const openEditDialog = (c: CorretorData) => {
    setEditTarget(c);
    setEditForm({ nome: c.nome, telefone: c.telefone || '', creci: c.creci || '', cpf: c.cpf || '' });
    setEditDialogOpen(true);
  };

  const handleEdit = async () => {
    if (!editTarget || !editForm.nome.trim()) { toast.error('Nome é obrigatório'); return; }
    setEditing(true);
    try {
      const { data, error } = await invokeWithRetry<{ success: boolean; error?: string }>('admin-update-corretor', {
        body: { user_id: editTarget.user_id, nome: editForm.nome.trim(), telefone: editForm.telefone.trim() || null, creci: editForm.creci.trim() || null, cpf: editForm.cpf.trim() || null },
      });
      if (error) {
        let msg = 'Erro ao atualizar corretor';
        try { const ctx = (error as any)?.context; if (ctx instanceof Response) { const body = await ctx.json(); msg = body.error || msg; } } catch {}
        toast.error(msg); return;
      }
      if (data && !(data as any).success) { toast.error((data as any).error || 'Erro ao atualizar'); return; }
      toast.success('Corretor atualizado!');
      setEditDialogOpen(false);
      fetchData();
    } catch { toast.error('Erro inesperado'); } finally { setEditing(false); }
  };

  const handleToggleAtivo = async (c: CorretorData) => {
    if (c.ativo) { setDeactivateTarget(c); return; }
    await doToggleAtivo(c.user_id, true);
  };

  const doToggleAtivo = async (userId: string, newAtivo: boolean) => {
    try {
      const { error } = await invokeWithRetry<{ success: boolean }>('admin-update-corretor', {
        body: { user_id: userId, ativo: newAtivo },
      });
      if (error) {
        let msg = 'Erro ao atualizar status';
        try { const ctx = (error as any)?.context; if (ctx instanceof Response) { const body = await ctx.json(); msg = body.error || msg; } } catch {}
        toast.error(msg);
      } else {
        toast.success(newAtivo ? 'Corretor ativado' : 'Corretor desativado');
        fetchData();
      }
    } catch { toast.error('Erro inesperado'); }
  };

  const confirmDeactivate = async () => {
    if (!deactivateTarget) return;
    await doToggleAtivo(deactivateTarget.user_id, false);
    setDeactivateTarget(null);
  };

  const openResetDialog = (c: CorretorData) => {
    setResetTarget(c);
    setNewPassword('');
    setResetDialogOpen(true);
  };

  const handleResetPassword = async () => {
    if (!resetTarget || newPassword.length < 6) { toast.error('A senha deve ter pelo menos 6 caracteres'); return; }
    setResetting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('admin-reset-corretor-password', {
        body: { user_id: resetTarget.user_id, new_password: newPassword },
        headers: { Authorization: `Bearer ${sessionData.session?.access_token}` },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast.success('Senha redefinida com sucesso!');
      setResetDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao redefinir senha');
    } finally { setResetting(false); }
  };

  if (loading) {
    return (
      <ConstutoraLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ConstutoraLayout>
    );
  }

  return (
    <ConstutoraLayout>
      <div className="space-y-6">
        {/* Header + Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Corretores</h1>
            <p className="text-muted-foreground">{corretores.length} corretores</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 flex-1 lg:max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou CRECI..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="whitespace-nowrap">
                  <UserPlus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Criar</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Novo Corretor</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome completo" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Senha *</Label>
                    <PasswordInput value={form.senha} onChange={val => setForm(f => ({ ...f, senha: val }))} placeholder="Mínimo 6 caracteres" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Telefone</Label>
                      <Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} placeholder="(00) 00000-0000" />
                    </div>
                    <div className="space-y-2">
                      <Label>CRECI</Label>
                      <Input value={form.creci} onChange={e => setForm(f => ({ ...f, creci: e.target.value }))} placeholder="CRECI" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>CPF</Label>
                    <Input value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))} placeholder="000.000.000-00" />
                  </div>
                  <p className="text-sm text-muted-foreground">O corretor poderá fazer login imediatamente com o email e senha definidos.</p>
                  <Button onClick={handleCreate} disabled={creating} className="w-full">
                    {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Criar Corretor
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold text-success">{stats.ativos}</p>
              </div>
              <UserCheck className="h-8 w-8 text-success/40" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inativos</p>
                <p className="text-2xl font-bold text-muted-foreground">{stats.inativos}</p>
              </div>
              <UserX className="h-8 w-8 text-muted-foreground/40" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Fichas</p>
                <p className="text-2xl font-bold text-primary">{stats.totalFichas}</p>
              </div>
              <FileText className="h-8 w-8 text-primary/40" />
            </div>
          </Card>
        </div>

        {/* Corretores List */}
        <Card>
          <CardContent className="pt-6">
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Nenhum corretor encontrado</h3>
                <p className="text-muted-foreground">{search ? 'Tente buscar por outro termo' : 'Crie seu primeiro corretor'}</p>
              </div>
            ) : (
              <>
                {/* Mobile Layout */}
                <div className="space-y-3 md:hidden">
                  {filtered.map(c => (
                    <Card key={c.user_id} className={cn(!c.ativo && 'opacity-60')}>
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-medium">{c.nome}</span>
                          <Badge variant={c.ativo ? 'default' : 'secondary'}>
                            {c.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant="outline" className="gap-1 text-xs h-5">
                            <Shield className="h-3 w-3" /> Corretor
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {c.creci && <span>CRECI: {c.creci}</span>}
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            <span>{c.fichas_count} fichas</span>
                          </div>
                        </div>
                        <div className="flex justify-end pt-2 border-t border-border/50">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(c)}>
                                <Pencil className="h-4 w-4 mr-2" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleAtivo(c)}>
                                {c.ativo ? <><UserX className="h-4 w-4 mr-2" /> Desativar</> : <><UserCheck className="h-4 w-4 mr-2" /> Ativar</>}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openResetDialog(c)}>
                                <KeyRound className="h-4 w-4 mr-2" /> Redefinir Senha
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Desktop Layout */}
                <div className="overflow-x-auto hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>CRECI</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Fichas</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map(c => (
                        <TableRow key={c.user_id} className={cn(!c.ativo && 'opacity-60')}>
                          <TableCell>
                            <div className="space-y-1">
                              <span className="font-medium">{c.nome}</span>
                              <div className="flex items-center gap-1.5">
                                <Badge variant="outline" className="gap-1 text-xs h-5">
                                  <Shield className="h-3 w-3" /> Corretor
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{c.creci || '—'}</TableCell>
                          <TableCell>{c.telefone || '—'}</TableCell>
                          <TableCell>{c.fichas_count}</TableCell>
                          <TableCell>
                            <Badge variant={c.ativo ? 'default' : 'secondary'}>
                              {c.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(c)}>
                                  <Pencil className="h-4 w-4 mr-2" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleAtivo(c)}>
                                  {c.ativo ? <><UserX className="h-4 w-4 mr-2" /> Desativar</> : <><UserCheck className="h-4 w-4 mr-2" /> Ativar</>}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openResetDialog(c)}>
                                  <KeyRound className="h-4 w-4 mr-2" /> Redefinir Senha
                                </DropdownMenuItem>
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
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Corretor</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={editForm.nome} onChange={e => setEditForm(f => ({ ...f, nome: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={editForm.telefone} onChange={e => setEditForm(f => ({ ...f, telefone: e.target.value }))} placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-2">
                <Label>CRECI</Label>
                <Input value={editForm.creci} onChange={e => setEditForm(f => ({ ...f, creci: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>CPF</Label>
              <Input value={editForm.cpf} onChange={e => setEditForm(f => ({ ...f, cpf: e.target.value }))} placeholder="000.000.000-00" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
              <Button className="flex-1" onClick={handleEdit} disabled={editing}>
                {editing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Redefinir Senha</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Definir nova senha para <strong>{resetTarget?.nome}</strong>
            </p>
            <div className="space-y-2">
              <Label>Nova Senha *</Label>
              <PasswordInput value={newPassword} onChange={setNewPassword} placeholder="Mínimo 6 caracteres" />
            </div>
            <Button onClick={handleResetPassword} disabled={resetting} className="w-full">
              {resetting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <KeyRound className="h-4 w-4 mr-2" />}
              Redefinir Senha
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation */}
      <AlertDialog open={!!deactivateTarget} onOpenChange={open => !open && setDeactivateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar corretor?</AlertDialogTitle>
            <AlertDialogDescription>
              O corretor <strong>{deactivateTarget?.nome}</strong> será desativado e não poderá mais acessar o sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeactivate} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConstutoraLayout>
  );
}
