import { useState } from 'react';
import { useUserRole, AppRole } from '@/hooks/useUserRole';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ConstutoraLayout } from '@/components/layouts/ConstutoraLayout';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, Loader2, Plus, Eye, EyeOff, Pencil } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RoleBadge } from '@/components/RoleBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/PasswordInput';
import { toast } from 'sonner';
import { invokeWithRetry } from '@/lib/invokeWithRetry';

interface CorretorData {
  user_id: string;
  role: string;
  profile: {
    user_id: string;
    nome: string | null;
    email: string | null;
    telefone: string | null;
    creci: string | null;
    ativo: boolean | null;
    cpf?: string | null;
  } | null;
}

export default function ConstutoraCorretores() {
  useDocumentTitle('Corretores | Construtora');
  const { construtoraId } = useUserRole();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ nome: '', email: '', senha: '', telefone: '', creci: '', cpf: '' });

  // Edit state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTarget, setEditTarget] = useState<CorretorData | null>(null);
  const [editForm, setEditForm] = useState({ nome: '', telefone: '', creci: '', cpf: '' });

  // Deactivate confirmation state
  const [deactivateTarget, setDeactivateTarget] = useState<CorretorData | null>(null);

  const { data: corretores, isLoading } = useQuery({
    queryKey: ['construtora-corretores', construtoraId],
    queryFn: async () => {
      if (!construtoraId) return [];

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('construtora_id', construtoraId)
        .eq('role', 'corretor');

      if (rolesError) throw rolesError;
      if (!roles?.length) return [];

      const userIds = roles.map(r => r.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, nome, email, telefone, creci, cpf, ativo')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      return roles.map(r => ({
        user_id: r.user_id,
        role: r.role,
        profile: profileMap.get(r.user_id) || null,
      })) as CorretorData[];
    },
    enabled: !!construtoraId,
  });

  const handleToggleAtivo = async (corretor: CorretorData) => {
    const isAtivo = corretor.profile?.ativo !== false;
    if (isAtivo) {
      // Show confirmation before deactivating
      setDeactivateTarget(corretor);
      return;
    }
    // Activate directly
    await doToggleAtivo(corretor.user_id, true);
  };

  const doToggleAtivo = async (userId: string, newAtivo: boolean) => {
    try {
      const { error } = await invokeWithRetry<{ success: boolean; error?: string }>('admin-update-corretor', {
        body: { user_id: userId, ativo: newAtivo },
      });
      if (error) {
        toast.error('Erro ao atualizar status');
      } else {
        toast.success(newAtivo ? 'Corretor ativado' : 'Corretor desativado');
        queryClient.invalidateQueries({ queryKey: ['construtora-corretores'] });
      }
    } catch {
      toast.error('Erro inesperado');
    }
  };

  const confirmDeactivate = async () => {
    if (!deactivateTarget) return;
    await doToggleAtivo(deactivateTarget.user_id, false);
    setDeactivateTarget(null);
  };

  const openEditDialog = (corretor: CorretorData) => {
    setEditTarget(corretor);
    setEditForm({
      nome: corretor.profile?.nome || '',
      telefone: corretor.profile?.telefone || '',
      creci: corretor.profile?.creci || '',
      cpf: (corretor.profile as any)?.cpf || '',
    });
    setEditDialogOpen(true);
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    if (!editForm.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    setEditing(true);
    try {
      const { data, error } = await invokeWithRetry<{ success: boolean; error?: string }>('admin-update-corretor', {
        body: {
          user_id: editTarget.user_id,
          nome: editForm.nome.trim(),
          telefone: editForm.telefone.trim() || null,
          creci: editForm.creci.trim() || null,
          cpf: editForm.cpf.trim() || null,
        },
      });

      if (error) {
        const msg = (error as any)?.context ? await (error as any).context.json().then((r: any) => r.error).catch(() => (error as any).message) : (error as any).message;
        toast.error(msg || 'Erro ao atualizar corretor');
        return;
      }

      if (data && !(data as any).success) {
        toast.error((data as any).error || 'Erro ao atualizar corretor');
        return;
      }

      toast.success('Corretor atualizado com sucesso!');
      setEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['construtora-corretores'] });
    } catch (err: any) {
      toast.error(err?.message || 'Erro inesperado');
    } finally {
      setEditing(false);
    }
  };

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
        body: {
          nome: form.nome,
          email: form.email,
          senha: form.senha,
          telefone: form.telefone || undefined,
          creci: form.creci || undefined,
          cpf: form.cpf || undefined,
          construtora: true,
        },
      });

      if (error) {
        const msg = (error as any)?.context ? await (error as any).context.json().then((r: any) => r.error).catch(() => (error as any).message) : (error as any).message;
        toast.error(msg || 'Erro ao criar corretor');
        return;
      }

      if (data && !(data as any).success) {
        toast.error((data as any).error || 'Erro ao criar corretor');
        return;
      }

      toast.success('Corretor criado com sucesso!');
      setForm({ nome: '', email: '', senha: '', telefone: '', creci: '', cpf: '' });
      setCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['construtora-corretores'] });
    } catch (err: any) {
      toast.error(err?.message || 'Erro inesperado');
    } finally {
      setCreating(false);
    }
  };

  return (
    <ConstutoraLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold">Corretores</h1>
            <p className="text-muted-foreground">Corretores vinculados à construtora</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Novo Corretor
          </Button>
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
                  <TableHead>Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {corretores.map((c) => (
                  <TableRow key={c.user_id}>
                    <TableCell className="font-medium">{c.profile?.nome || '—'}</TableCell>
                    <TableCell>{c.profile?.email || '—'}</TableCell>
                    <TableCell>{c.profile?.telefone || '—'}</TableCell>
                    <TableCell>{c.profile?.creci || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={c.profile?.ativo !== false ? 'default' : 'secondary'}>
                        {c.profile?.ativo !== false ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell><RoleBadge role={c.role} variant="compact" /></TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(c)}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAtivo(c)}
                        title={c.profile?.ativo !== false ? 'Desativar' : 'Ativar'}
                      >
                        {c.profile?.ativo !== false ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Corretor</DialogTitle>
            <DialogDescription>Cadastre um novo corretor vinculado à construtora</DialogDescription>
          </DialogHeader>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Corretor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Corretor</DialogTitle>
            <DialogDescription>Altere os dados do corretor</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={editForm.nome} onChange={e => setEditForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome completo" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={editForm.telefone} onChange={e => setEditForm(f => ({ ...f, telefone: e.target.value }))} placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-2">
                <Label>CRECI</Label>
                <Input value={editForm.creci} onChange={e => setEditForm(f => ({ ...f, creci: e.target.value }))} placeholder="CRECI" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>CPF</Label>
              <Input value={editForm.cpf} onChange={e => setEditForm(f => ({ ...f, cpf: e.target.value }))} placeholder="000.000.000-00" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={editing}>
              {editing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation */}
      <AlertDialog open={!!deactivateTarget} onOpenChange={(open) => !open && setDeactivateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar corretor?</AlertDialogTitle>
            <AlertDialogDescription>
              O corretor <strong>{deactivateTarget?.profile?.nome}</strong> será desativado e não poderá mais acessar o sistema. Deseja continuar?
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
