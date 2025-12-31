import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ImobiliariaLayout } from '@/components/layouts/ImobiliariaLayout';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Search, MoreHorizontal, Users, Mail, Trash2, Loader2, Send, UserPlus, Pencil, UserCheck, UserX, KeyRound } from 'lucide-react';
import { formatPhone } from '@/lib/phone';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Corretor {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  telefone: string | null;
  creci: string | null;
  created_at: string;
  fichas_count?: number;
  ativo: boolean;
}

interface Convite {
  id: string;
  email: string;
  nome: string;
  status: string;
  created_at: string;
  expira_em: string;
}

export default function EmpresaCorretores() {
  const { imobiliariaId, assinatura } = useUserRole();
  const { user } = useAuth();
  const [corretores, setCorretores] = useState<Corretor[]>([]);
  const [convites, setConvites] = useState<Convite[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [conviteForm, setConviteForm] = useState({ nome: '', email: '' });
  const [createForm, setCreateForm] = useState({ nome: '', email: '', senha: '', telefone: '', creci: '' });
  const [editForm, setEditForm] = useState({ user_id: '', nome: '', telefone: '', creci: '', email: '' });
  const [resetPasswordForm, setResetPasswordForm] = useState({ user_id: '', nome: '', newPassword: '' });
  const [selectedCorretor, setSelectedCorretor] = useState<Corretor | null>(null);

  async function fetchData() {
    if (!imobiliariaId) return;

    try {
      // Fetch corretores (users with corretor role in this imobiliaria)
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, created_at')
        .eq('imobiliaria_id', imobiliariaId)
        .eq('role', 'corretor');

      if (rolesError) throw rolesError;

      // Fetch profiles for these users
      const userIds = rolesData?.map(r => r.user_id) || [];
      
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        // Fetch emails from edge function
        const { data: sessionData } = await supabase.auth.getSession();
        let emailsMap: Record<string, string> = {};
        
        try {
          const { data: emailsData } = await supabase.functions.invoke('admin-get-corretores-emails', {
            body: { user_ids: userIds },
            headers: {
              Authorization: `Bearer ${sessionData.session?.access_token}`,
            },
          });
          emailsMap = emailsData?.emails || {};
        } catch (emailError) {
          console.warn('Could not fetch emails:', emailError);
        }

        // Enrich with fichas count and emails
        const enrichedCorretores = await Promise.all(
          (profilesData || []).map(async (profile) => {
            const { count } = await supabase
              .from('fichas_visita')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', profile.user_id);

            const roleData = rolesData?.find(r => r.user_id === profile.user_id);

            return {
              id: profile.id,
              user_id: profile.user_id,
              nome: profile.nome,
              email: emailsMap[profile.user_id] || '',
              telefone: profile.telefone,
              creci: profile.creci,
              created_at: roleData?.created_at || profile.created_at,
              fichas_count: count || 0,
              ativo: profile.ativo ?? true,
            };
          })
        );

        setCorretores(enrichedCorretores);
      }

      // Fetch pending invites
      const { data: convitesData } = await supabase
        .from('convites')
        .select('*')
        .eq('imobiliaria_id', imobiliariaId)
        .in('status', ['pendente'])
        .order('created_at', { ascending: false });

      setConvites(convitesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [imobiliariaId]);

  async function sendConvite(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);

    try {
      const { error } = await supabase
        .from('convites')
        .insert({
          imobiliaria_id: imobiliariaId,
          email: conviteForm.email,
          nome: conviteForm.nome,
          role: 'corretor',
          convidado_por: user?.id,
        });

      if (error) throw error;

      toast.success('Convite enviado com sucesso');
      setDialogOpen(false);
      setConviteForm({ nome: '', email: '' });
      fetchData();
    } catch (error: any) {
      console.error('Error sending convite:', error);
      if (error.code === '23505') {
        toast.error('Já existe um convite pendente para este email');
      } else {
        toast.error('Erro ao enviar convite');
      }
    } finally {
      setSending(false);
    }
  }

  async function createCorretor(e: React.FormEvent) {
    e.preventDefault();
    
    if (createForm.senha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setCreating(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('admin-create-corretor', {
        body: {
          nome: createForm.nome,
          email: createForm.email,
          senha: createForm.senha,
          telefone: createForm.telefone || null,
          creci: createForm.creci || null,
        },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      toast.success('Corretor criado com sucesso!');
      setCreateDialogOpen(false);
      setCreateForm({ nome: '', email: '', senha: '', telefone: '', creci: '' });
      fetchData();
    } catch (error: any) {
      console.error('Error creating corretor:', error);
      const errorMsg = error.message?.toLowerCase() || '';
      if (errorMsg.includes('already') || errorMsg.includes('cadastrado') || errorMsg.includes('registered') || errorMsg.includes('exists')) {
        toast.error('Este email já está cadastrado no sistema');
      } else {
        toast.error(error.message || 'Erro ao criar corretor');
      }
    } finally {
      setCreating(false);
    }
  }

  async function cancelConvite(id: string) {
    try {
      const { error } = await supabase
        .from('convites')
        .update({ status: 'cancelado' })
        .eq('id', id);

      if (error) throw error;

      toast.success('Convite cancelado');
      fetchData();
    } catch (error) {
      console.error('Error canceling convite:', error);
      toast.error('Erro ao cancelar convite');
    }
  }

  async function removeCorretor(userId: string) {
    if (!confirm('Tem certeza que deseja remover este corretor? Ele perderá acesso à plataforma.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('imobiliaria_id', imobiliariaId);

      if (error) throw error;

      toast.success('Corretor removido com sucesso');
      fetchData();
    } catch (error) {
      console.error('Error removing corretor:', error);
      toast.error('Erro ao remover corretor');
    }
  }

  function openEditDialog(corretor: Corretor) {
    setSelectedCorretor(corretor);
    setEditForm({
      user_id: corretor.user_id,
      nome: corretor.nome,
      telefone: corretor.telefone || '',
      creci: corretor.creci || '',
      email: corretor.email || '',
    });
    setEditDialogOpen(true);
  }

  async function updateCorretor(e: React.FormEvent) {
    e.preventDefault();
    setEditing(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();

      const { data, error } = await supabase.functions.invoke('admin-update-corretor', {
        body: {
          user_id: editForm.user_id,
          nome: editForm.nome,
          telefone: editForm.telefone || null,
          creci: editForm.creci || null,
        },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      toast.success('Corretor atualizado com sucesso!');
      setEditDialogOpen(false);
      setSelectedCorretor(null);
      fetchData();
    } catch (error: any) {
      console.error('Error updating corretor:', error);
      toast.error(error.message || 'Erro ao atualizar corretor');
    } finally {
      setEditing(false);
    }
  }

  async function toggleCorretorAtivo(corretor: Corretor) {
    const novoStatus = !corretor.ativo;
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();

      const { data, error } = await supabase.functions.invoke('admin-update-corretor', {
        body: {
          user_id: corretor.user_id,
          ativo: novoStatus,
        },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      toast.success(novoStatus ? 'Corretor ativado com sucesso!' : 'Corretor desativado com sucesso!');
      fetchData();
    } catch (error: any) {
      console.error('Error toggling corretor status:', error);
      toast.error(error.message || 'Erro ao alterar status do corretor');
    }
  }

  function openResetPasswordDialog(corretor: Corretor) {
    setResetPasswordForm({
      user_id: corretor.user_id,
      nome: corretor.nome,
      newPassword: '',
    });
    setResetPasswordDialogOpen(true);
  }

  async function resetCorretorPassword(e: React.FormEvent) {
    e.preventDefault();

    if (resetPasswordForm.newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setResettingPassword(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();

      const { data, error } = await supabase.functions.invoke('admin-reset-corretor-password', {
        body: {
          user_id: resetPasswordForm.user_id,
          new_password: resetPasswordForm.newPassword,
        },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      toast.success('Senha redefinida com sucesso!');
      setResetPasswordDialogOpen(false);
      setResetPasswordForm({ user_id: '', nome: '', newPassword: '' });
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(error.message || 'Erro ao redefinir senha');
    } finally {
      setResettingPassword(false);
    }
  }

  const filteredCorretores = corretores.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.creci?.toLowerCase().includes(search.toLowerCase())
  );

  const maxCorretores = assinatura?.plano?.max_corretores || 0;
  const canAddMore = corretores.length + convites.length < maxCorretores;

  if (loading) {
    return (
      <ImobiliariaLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ImobiliariaLayout>
    );
  }

  return (
    <ImobiliariaLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Corretores</h1>
            <p className="text-muted-foreground">
              {corretores.length} de {maxCorretores} corretores
            </p>
          </div>
          <div className="flex gap-2">
            {/* Create corretor dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!canAddMore}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Criar Corretor
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Corretor</DialogTitle>
                </DialogHeader>
                <form onSubmit={createCorretor} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="create_nome">Nome *</Label>
                    <Input
                      id="create_nome"
                      value={createForm.nome}
                      onChange={(e) => setCreateForm({ ...createForm, nome: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create_email">Email *</Label>
                    <Input
                      id="create_email"
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create_senha">Senha *</Label>
                    <Input
                      id="create_senha"
                      type="password"
                      value={createForm.senha}
                      onChange={(e) => setCreateForm({ ...createForm, senha: e.target.value })}
                      required
                      minLength={6}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="create_telefone">Telefone</Label>
                      <Input
                        id="create_telefone"
                        value={createForm.telefone}
                        onChange={(e) => setCreateForm({ ...createForm, telefone: formatPhone(e.target.value) })}
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="create_creci">CRECI</Label>
                      <Input
                        id="create_creci"
                        value={createForm.creci}
                        onChange={(e) => setCreateForm({ ...createForm, creci: e.target.value })}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    O corretor poderá fazer login imediatamente com o email e senha definidos.
                  </p>
                  <Button type="submit" className="w-full" disabled={creating}>
                    {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                    Criar Corretor
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            {/* Invite corretor dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={!canAddMore}>
                  <Send className="h-4 w-4 mr-2" />
                  Convidar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Convidar Corretor</DialogTitle>
                </DialogHeader>
                <form onSubmit={sendConvite} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome</Label>
                    <Input
                      id="nome"
                      value={conviteForm.nome}
                      onChange={(e) => setConviteForm({ ...conviteForm, nome: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={conviteForm.email}
                      onChange={(e) => setConviteForm({ ...conviteForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    O corretor receberá um email com instruções para criar sua conta.
                  </p>
                  <Button type="submit" className="w-full" disabled={sending}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    Enviar Convite
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Pending invites */}
        {convites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Convites Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {convites.map((convite) => (
                  <div key={convite.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{convite.nome}</p>
                      <p className="text-sm text-muted-foreground">{convite.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Pendente</Badge>
                      <Button variant="ghost" size="sm" onClick={() => cancelConvite(convite.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Corretores list */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou CRECI..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredCorretores.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Nenhum corretor encontrado</h3>
                <p className="text-muted-foreground">
                  {search ? 'Tente buscar por outro termo' : 'Convide seu primeiro corretor'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead className="hidden md:table-cell">CRECI</TableHead>
                      <TableHead className="hidden lg:table-cell">Telefone</TableHead>
                      <TableHead>Fichas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Desde</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCorretores.map((corretor) => (
                      <TableRow key={corretor.id} className={!corretor.ativo ? 'opacity-60' : ''}>
                        <TableCell>
                          <p className="font-medium">{corretor.nome}</p>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {corretor.creci || '-'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {corretor.telefone ? formatPhone(corretor.telefone) : '-'}
                        </TableCell>
                        <TableCell>{corretor.fichas_count}</TableCell>
                        <TableCell>
                          <Badge variant={corretor.ativo ? 'default' : 'secondary'}>
                            {corretor.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {format(new Date(corretor.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(corretor)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleCorretorAtivo(corretor)}>
                                {corretor.ativo ? (
                                  <>
                                    <UserX className="h-4 w-4 mr-2" />
                                    Desativar
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Ativar
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openResetPasswordDialog(corretor)}>
                                <KeyRound className="h-4 w-4 mr-2" />
                                Redefinir Senha
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => removeCorretor(corretor.user_id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remover
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit corretor dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Corretor</DialogTitle>
            </DialogHeader>
            <form onSubmit={updateCorretor} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit_nome">Nome *</Label>
                <Input
                  id="edit_nome"
                  value={editForm.nome}
                  onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_email">Email</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={editForm.email}
                  disabled
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">
                  O email não pode ser alterado diretamente.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_telefone">Telefone</Label>
                <Input
                  id="edit_telefone"
                  value={editForm.telefone}
                  onChange={(e) => setEditForm({ ...editForm, telefone: formatPhone(e.target.value) })}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_creci">CRECI</Label>
                <Input
                  id="edit_creci"
                  value={editForm.creci}
                  onChange={(e) => setEditForm({ ...editForm, creci: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={editing}>
                {editing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Pencil className="h-4 w-4 mr-2" />}
                Salvar Alterações
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Reset password dialog */}
        <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Redefinir Senha</DialogTitle>
            </DialogHeader>
            <form onSubmit={resetCorretorPassword} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Definir nova senha para <strong>{resetPasswordForm.nome}</strong>
              </p>
              <div className="space-y-2">
                <Label htmlFor="reset_password">Nova Senha *</Label>
                <Input
                  id="reset_password"
                  type="password"
                  value={resetPasswordForm.newPassword}
                  onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, newPassword: e.target.value })}
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <Button type="submit" className="w-full" disabled={resettingPassword}>
                {resettingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <KeyRound className="h-4 w-4 mr-2" />}
                Redefinir Senha
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </ImobiliariaLayout>
  );
}
