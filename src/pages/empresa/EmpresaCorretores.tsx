import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
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
import { Plus, Search, MoreHorizontal, Users, Mail, Trash2, Loader2, Send, UserPlus, Pencil, UserCheck, UserX, KeyRound, Users2, ShieldCheck, Shield, Crown, ArrowLeft, UserMinus, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPhone } from '@/lib/phone';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EquipeBadge } from '@/components/EquipeBadge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Equipe {
  id: string;
  nome: string;
  cor: string;
}

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
  equipe?: Equipe | null;
  role: 'corretor' | 'imobiliaria_admin';
  isLider: boolean;
  equipeQueLidera?: string | null;
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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [corretores, setCorretores] = useState<Corretor[]>([]);
  const [convites, setConvites] = useState<Convite[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [equipeFilter, setEquipeFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [moveEquipeDialogOpen, setMoveEquipeDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [movingEquipe, setMovingEquipe] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [conviteForm, setConviteForm] = useState({ nome: '', email: '' });
  const [createForm, setCreateForm] = useState({ nome: '', email: '', senha: '', telefone: '', creci: '' });
  const [editForm, setEditForm] = useState({ user_id: '', nome: '', telefone: '', creci: '', email: '' });
  const [resetPasswordForm, setResetPasswordForm] = useState({ user_id: '', nome: '', newPassword: '' });
  const [selectedCorretor, setSelectedCorretor] = useState<Corretor | null>(null);
  const [selectedEquipeId, setSelectedEquipeId] = useState<string>('');

  async function fetchData() {
    if (!imobiliariaId) return;

    try {
      // Fetch equipes first (including lider_id for leader detection)
      const { data: equipesData } = await supabase
        .from('equipes')
        .select('id, nome, cor, lider_id')
        .eq('imobiliaria_id', imobiliariaId)
        .eq('ativa', true)
        .order('nome');

      setEquipes(equipesData || []);

      // Build leaders map: user_id -> team name they lead
      const lideresMap: Record<string, string> = {};
      (equipesData || []).forEach((equipe: any) => {
        if (equipe.lider_id) {
          lideresMap[equipe.lider_id] = equipe.nome;
        }
      });

      // Fetch corretores and admins (users with corretor or imobiliaria_admin role in this imobiliaria)
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, created_at, role')
        .eq('imobiliaria_id', imobiliariaId)
        .in('role', ['corretor', 'imobiliaria_admin']);

      if (rolesError) throw rolesError;

      // Fetch profiles for these users
      const userIds = rolesData?.map(r => r.user_id) || [];
      
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        // Fetch equipes_membros to get team assignments
        const { data: membrosData } = await supabase
          .from('equipes_membros')
          .select(`
            user_id,
            equipe:equipes!equipes_membros_equipe_id_fkey(id, nome, cor)
          `)
          .in('user_id', userIds);

        const membrosMap: Record<string, Equipe | null> = {};
        (membrosData || []).forEach((m: any) => {
          if (m.equipe) {
            membrosMap[m.user_id] = m.equipe;
          }
        });

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

        // Enrich with fichas count, emails and team
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
              equipe: membrosMap[profile.user_id] || null,
              role: (roleData?.role as 'corretor' | 'imobiliaria_admin') || 'corretor',
              isLider: !!lideresMap[profile.user_id],
              equipeQueLidera: lideresMap[profile.user_id] || null,
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

  // Detectar parâmetro highlight na URL para abrir modal automaticamente
  useEffect(() => {
    const highlightUserId = searchParams.get('highlight');
    if (highlightUserId && corretores.length > 0) {
      const corretor = corretores.find(c => c.user_id === highlightUserId);
      if (corretor) {
        openEditDialog(corretor);
        // Limpa o parâmetro da URL após abrir
        setSearchParams({});
      }
    }
  }, [searchParams, corretores]);

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
    if (!confirm('Tem certeza que deseja excluir este corretor permanentemente? Esta ação não pode ser desfeita. As fichas serão transferidas para você.')) {
      return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('empresa-delete-corretor', {
        body: { user_id: userId },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      toast.success('Corretor excluído com sucesso');
      fetchData();
    } catch (error: any) {
      console.error('Error removing corretor:', error);
      toast.error(error.message || 'Erro ao excluir corretor');
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

      // When deactivating, phone is automatically cleared by edge function
      toast.success(novoStatus ? 'Corretor ativado com sucesso!' : 'Corretor desativado (telefone liberado)');
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

  function openMoveEquipeDialog(corretor: Corretor) {
    setSelectedCorretor(corretor);
    setSelectedEquipeId(corretor.equipe?.id || '');
    setMoveEquipeDialogOpen(true);
  }

  async function handleMoveToEquipe() {
    if (!selectedCorretor) return;

    setMovingEquipe(true);

    try {
      // Remove from current team if exists
      if (selectedCorretor.equipe) {
        await supabase
          .from('equipes_membros')
          .delete()
          .eq('user_id', selectedCorretor.user_id);
      }

      // Add to new team if selected
      if (selectedEquipeId && selectedEquipeId !== 'none') {
        const { error } = await supabase
          .from('equipes_membros')
          .insert({
            equipe_id: selectedEquipeId,
            user_id: selectedCorretor.user_id,
            cargo: 'corretor',
          });

        if (error) throw error;
        toast.success('Corretor movido para a equipe!');
      } else {
        toast.success('Corretor removido da equipe!');
      }

      setMoveEquipeDialogOpen(false);
      setSelectedCorretor(null);
      setSelectedEquipeId('');
      fetchData();
    } catch (error: any) {
      console.error('Error moving to team:', error);
      toast.error(error.message || 'Erro ao mover corretor');
    } finally {
      setMovingEquipe(false);
    }
  }

  async function handlePromoteCorretor(corretor: Corretor) {
    const newRole = corretor.role === 'corretor' ? 'imobiliaria_admin' : 'corretor';
    const actionText = newRole === 'imobiliaria_admin' ? 'promover a administrador' : 'rebaixar para corretor';
    
    if (!confirm(`Tem certeza que deseja ${actionText} ${corretor.nome}?`)) {
      return;
    }

    setPromoting(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();

      const { data, error } = await supabase.functions.invoke('admin-promote-corretor', {
        body: {
          user_id: corretor.user_id,
          new_role: newRole,
        },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      toast.success(data?.message || (newRole === 'imobiliaria_admin' 
        ? 'Usuário promovido a administrador!' 
        : 'Usuário rebaixado para corretor!'));
      fetchData();
    } catch (error: any) {
      console.error('Error promoting corretor:', error);
      toast.error(error.message || 'Erro ao alterar role do usuário');
    } finally {
      setPromoting(false);
    }
  }

  const filteredCorretores = corretores
    .filter(c => {
      const matchesSearch = c.nome.toLowerCase().includes(search.toLowerCase()) ||
        c.creci?.toLowerCase().includes(search.toLowerCase());
      
      const matchesEquipe = equipeFilter === 'all' || 
        (equipeFilter === 'none' && !c.equipe) ||
        c.equipe?.id === equipeFilter;

      return matchesSearch && matchesEquipe;
    })
    .sort((a, b) => {
      // 1. Admins primeiro
      if (a.role === 'imobiliaria_admin' && b.role !== 'imobiliaria_admin') return -1;
      if (a.role !== 'imobiliaria_admin' && b.role === 'imobiliaria_admin') return 1;
      
      // 2. Líderes depois dos admins
      if (a.isLider && !b.isLider) return -1;
      if (!a.isLider && b.isLider) return 1;
      
      // 3. Por número de fichas (decrescente)
      return (b.fichas_count || 0) - (a.fichas_count || 0);
    });

  const maxCorretores = assinatura?.plano?.max_corretores || 0;
  const canAddMore = corretores.length + convites.length < maxCorretores;

  // KPI stats
  const stats = useMemo(() => ({
    ativos: corretores.filter(c => c.ativo).length,
    inativos: corretores.filter(c => !c.ativo).length,
    // Apenas corretores sem equipe (não inclui admins, que não precisam de equipe)
    semEquipe: corretores.filter(c => c.role === 'corretor' && !c.equipe).length,
  }), [corretores]);

  if (loading) {
    return (<div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>);
  }

  return (<div className="space-y-6">
        {/* Unified Header with Toolbar */}
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Corretores</h1>
              <p className="text-muted-foreground">
                {corretores.length} de {maxCorretores} corretores
              </p>
            </div>
            
            {/* Toolbar: Search + Filter + Actions */}
            <div className="flex flex-col sm:flex-row gap-2 flex-1 lg:max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou CRECI..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={equipeFilter} onValueChange={setEquipeFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Users2 className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Equipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="none">Sem equipe</SelectItem>
                  {equipes.map((equipe) => (
                    <SelectItem key={equipe.id} value={equipe.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: equipe.cor }}
                        />
                        {equipe.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex gap-2">
                {/* Create corretor dialog */}
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button disabled={!canAddMore} size="sm" className="whitespace-nowrap">
                      <UserPlus className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Criar</span>
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
                    <Button variant="outline" disabled={!canAddMore} size="sm" className="whitespace-nowrap">
                      <Send className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Convidar</span>
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
          </div>
        </div>

        {/* KPI Summary Cards */}
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
                <p className="text-sm text-muted-foreground">Sem Equipe</p>
                <p className="text-2xl font-bold text-warning">{stats.semEquipe}</p>
              </div>
              <UserMinus className="h-8 w-8 text-warning/40" />
            </div>
          </Card>
        </div>

        {/* Pending invites */}
        {convites.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
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
          <CardContent className="pt-6">
            {filteredCorretores.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Nenhum corretor encontrado</h3>
                <p className="text-muted-foreground">
                  {search ? 'Tente buscar por outro termo' : 'Convide seu primeiro corretor'}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Layout - Cards clicáveis */}
                <div className="space-y-3 md:hidden">
                  {filteredCorretores.map((corretor) => (
                    <Card 
                      key={corretor.id}
                      className={cn(
                        "cursor-pointer hover:shadow-md active:bg-muted/30 transition-all",
                        !corretor.ativo && "opacity-60"
                      )}
                      onClick={() => navigate(`/empresa/corretores/${corretor.user_id}`)}
                    >
                      <CardContent className="p-3 space-y-2">
                        {/* Header: Nome + Status */}
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-medium">{corretor.nome}</span>
                          <Badge variant={corretor.ativo ? 'default' : 'secondary'}>
                            {corretor.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        
                        {/* Badges: Role + Líder + Equipe */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge 
                            variant={corretor.role === 'imobiliaria_admin' ? 'default' : 'outline'} 
                            className="gap-1 text-xs h-5"
                          >
                            {corretor.role === 'imobiliaria_admin' ? (
                              <>
                                <ShieldCheck className="h-3 w-3" />
                                Admin
                              </>
                            ) : (
                              <>
                                <Shield className="h-3 w-3" />
                                Corretor
                              </>
                            )}
                          </Badge>
                          {corretor.isLider && (
                            <Badge 
                              variant="outline" 
                              className="gap-1 bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs h-5"
                            >
                              <Crown className="h-3 w-3" />
                              Líder
                            </Badge>
                          )}
                          {corretor.equipe && (
                            <EquipeBadge nome={corretor.equipe.nome} cor={corretor.equipe.cor} />
                          )}
                        </div>
                        
                        {/* Info: CRECI + Fichas */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {corretor.creci && <span>CRECI: {corretor.creci}</span>}
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            <span>{corretor.fichas_count} fichas</span>
                          </div>
                        </div>
                        
                        {/* Footer com menu de ações */}
                        <div 
                          className="flex justify-end pt-2 border-t border-border/50" 
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(corretor)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openMoveEquipeDialog(corretor)}>
                                <Users2 className="h-4 w-4 mr-2" />
                                {corretor.equipe ? 'Mudar Equipe' : 'Adicionar à Equipe'}
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
                                onClick={() => handlePromoteCorretor(corretor)}
                                disabled={promoting}
                              >
                                {corretor.role === 'corretor' ? (
                                  <>
                                    <ShieldCheck className="h-4 w-4 mr-2" />
                                    Promover a Admin
                                  </>
                                ) : (
                                  <>
                                    <Shield className="h-4 w-4 mr-2" />
                                    Rebaixar para Corretor
                                  </>
                                )}
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
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Desktop Layout - Tabela */}
                <div className="overflow-x-auto hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead className="hidden sm:table-cell">Equipe</TableHead>
                        <TableHead className="hidden md:table-cell">CRECI</TableHead>
                        <TableHead className="hidden lg:table-cell">Telefone</TableHead>
                        <TableHead>Fichas</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCorretores.map((corretor) => (
                        <TableRow key={corretor.id} className={!corretor.ativo ? 'opacity-60' : ''}>
                          <TableCell>
                            <div className="space-y-1">
                              <button
                                onClick={() => navigate(`/empresa/corretores/${corretor.user_id}`)}
                                className="font-medium hover:underline hover:text-primary cursor-pointer transition-colors block"
                              >
                                {corretor.nome}
                              </button>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Badge 
                                  variant={corretor.role === 'imobiliaria_admin' ? 'default' : 'outline'} 
                                  className="gap-1 text-xs h-5"
                                >
                                  {corretor.role === 'imobiliaria_admin' ? (
                                    <>
                                      <ShieldCheck className="h-3 w-3" />
                                      Admin
                                    </>
                                  ) : (
                                    <>
                                      <Shield className="h-3 w-3" />
                                      Corretor
                                    </>
                                  )}
                                </Badge>
                                {corretor.isLider && (
                                  <Badge 
                                    variant="outline" 
                                    className="gap-1 bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs h-5" 
                                    title={`Líder da equipe ${corretor.equipeQueLidera}`}
                                  >
                                    <Crown className="h-3 w-3" />
                                    Líder
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {corretor.equipe ? (
                              <EquipeBadge nome={corretor.equipe.nome} cor={corretor.equipe.cor} />
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
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
                                <DropdownMenuItem onClick={() => openMoveEquipeDialog(corretor)}>
                                  <Users2 className="h-4 w-4 mr-2" />
                                  {corretor.equipe ? 'Mudar Equipe' : 'Adicionar à Equipe'}
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
                                  onClick={() => handlePromoteCorretor(corretor)}
                                  disabled={promoting}
                                >
                                  {corretor.role === 'corretor' ? (
                                    <>
                                      <ShieldCheck className="h-4 w-4 mr-2" />
                                      Promover a Admin
                                    </>
                                  ) : (
                                    <>
                                      <Shield className="h-4 w-4 mr-2" />
                                      Rebaixar para Corretor
                                    </>
                                  )}
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
              </>
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
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setEditDialogOpen(false);
                    navigate('/empresa/equipes');
                  }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar para Equipes
                </Button>
                <Button type="submit" className="flex-1" disabled={editing}>
                  {editing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Pencil className="h-4 w-4 mr-2" />}
                  Salvar
                </Button>
              </div>
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

        {/* Move to equipe dialog */}
        <Dialog open={moveEquipeDialogOpen} onOpenChange={setMoveEquipeDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mover para Equipe</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Selecione a equipe para <strong>{selectedCorretor?.nome}</strong>
              </p>
              {selectedCorretor?.equipe && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Equipe atual:</span>
                  <EquipeBadge nome={selectedCorretor.equipe.nome} cor={selectedCorretor.equipe.cor} />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="equipe_select">Nova Equipe</Label>
                <Select value={selectedEquipeId} onValueChange={setSelectedEquipeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma equipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem equipe</SelectItem>
                    {equipes.map((equipe) => (
                      <SelectItem key={equipe.id} value={equipe.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: equipe.cor }}
                          />
                          {equipe.nome}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setMoveEquipeDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleMoveToEquipe} disabled={movingEquipe}>
                  {movingEquipe && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  <Users2 className="h-4 w-4 mr-2" />
                  Confirmar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>);
}
