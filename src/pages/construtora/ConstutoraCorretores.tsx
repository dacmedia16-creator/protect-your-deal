import { useState } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ConstutoraLayout } from '@/components/layouts/ConstutoraLayout';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, Loader2, Plus, Eye, EyeOff } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RoleBadge } from '@/components/RoleBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/PasswordInput';
import { toast } from 'sonner';
import { invokeWithRetry } from '@/lib/invokeWithRetry';

export default function ConstutoraCorretores() {
  useDocumentTitle('Corretores | Construtora');
  const { construtoraId } = useUserRole();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ nome: '', email: '', senha: '', telefone: '', creci: '', cpf: '' });

  const { data: corretores, isLoading } = useQuery({
    queryKey: ['construtora-corretores', construtoraId],
    queryFn: async () => {
      if (!construtoraId) return [];

      // Step 1: fetch user_roles for this construtora
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('construtora_id', construtoraId)
        .eq('role', 'corretor');

      if (rolesError) throw rolesError;
      if (!roles?.length) return [];

      // Step 2: fetch profiles for those user_ids
      const userIds = roles.map(r => r.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, nome, email, telefone, creci, ativo')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Step 3: merge
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      return roles.map(r => ({
        user_id: r.user_id,
        role: r.role,
        profile: profileMap.get(r.user_id) || null,
      }));
    },
    enabled: !!construtoraId,
  });

  const handleToggleAtivo = async (userId: string, currentAtivo: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ ativo: !currentAtivo })
      .eq('user_id', userId);
    if (error) {
      toast.error('Erro ao atualizar status');
    } else {
      toast.success(!currentAtivo ? 'Corretor ativado' : 'Corretor desativado');
      queryClient.invalidateQueries({ queryKey: ['construtora-corretores'] });
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
        const msg = (error as any)?.context ? await (error as any).context.json().then((r: any) => r.error).catch(() => error.message) : error.message;
        toast.error(msg || 'Erro ao criar corretor');
        return;
      }

      if (data && !(data as any).success) {
        toast.error((data as any).error || 'Erro ao criar corretor');
        return;
      }

      toast.success('Corretor criado com sucesso!');
      setForm({ nome: '', email: '', senha: '', telefone: '', creci: '', cpf: '' });
      setDialogOpen(false);
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
          <Button onClick={() => setDialogOpen(true)}>
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
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAtivo(c.user_id, c.profile?.ativo !== false)}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
              <PasswordInput value={form.senha} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))} placeholder="Mínimo 6 caracteres" />
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Corretor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConstutoraLayout>
  );
}
