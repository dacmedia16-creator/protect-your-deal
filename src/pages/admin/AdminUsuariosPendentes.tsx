import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { UserPlus, Loader2, AlertCircle, CheckCircle2, Trash2, Building2, Building } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPhone } from '@/lib/phone';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PendingUser {
  user_id: string;
  role: string;
  created_at: string;
  profile: { nome: string; telefone: string | null } | null;
  email: string | null;
}

type OrgType = 'imobiliaria' | 'construtora';

export default function AdminUsuariosPendentes() {
  const queryClient = useQueryClient();
  const [selectedOrgs, setSelectedOrgs] = useState<Record<string, string>>({});
  const [selectedTypes, setSelectedTypes] = useState<Record<string, OrgType>>({});
  const [userToDelete, setUserToDelete] = useState<PendingUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [linkingUserId, setLinkingUserId] = useState<string | null>(null);

  const { data: pendingUsers, isLoading: loadingUsers } = useQuery({
    queryKey: ['pending-users'],
    queryFn: async () => {
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, created_at')
        .is('imobiliaria_id', null)
        .is('construtora_id', null)
        .neq('role', 'super_admin');

      if (rolesError) throw rolesError;
      if (!roles || roles.length === 0) return [];

      const userIds = roles.map(r => r.user_id);

      const { data: assinaturasAutonomas } = await supabase
        .from('assinaturas')
        .select('user_id')
        .in('user_id', userIds)
        .is('imobiliaria_id', null)
        .is('construtora_id', null);

      const autonomosComAssinatura = new Set(
        assinaturasAutonomas?.map(a => a.user_id) || []
      );

      const rolesPendentes = roles.filter(r => !autonomosComAssinatura.has(r.user_id));
      if (rolesPendentes.length === 0) return [];

      const pendingUserIds = rolesPendentes.map(r => r.user_id);

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, nome, telefone')
        .in('user_id', pendingUserIds);

      if (profilesError) throw profilesError;

      const { data: usersData, error: usersError } = await supabase.functions.invoke('admin-list-users');
      if (usersError) throw usersError;

      const users = usersData?.users || [];

      return rolesPendentes.map(role => {
        const profile = profiles?.find(p => p.user_id === role.user_id);
        const authUser = users.find((u: any) => u.id === role.user_id);
        return {
          user_id: role.user_id,
          role: role.role,
          created_at: role.created_at,
          profile: profile || null,
          email: authUser?.email || null,
        } as PendingUser;
      });
    },
  });

  const { data: imobiliarias, isLoading: loadingImobiliarias } = useQuery({
    queryKey: ['imobiliarias-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('imobiliarias')
        .select('id, nome')
        .eq('status', 'ativo')
        .order('nome');
      if (error) throw error;
      return data;
    },
  });

  const { data: construtoras, isLoading: loadingConstrutoras } = useQuery({
    queryKey: ['construtoras-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('construtoras')
        .select('id, nome')
        .eq('status', 'ativo')
        .order('nome');
      if (error) throw error;
      return data;
    },
  });

  const linkUserMutation = useMutation({
    mutationFn: async ({ userId, orgId, orgType }: { userId: string; orgId: string; orgType: OrgType }) => {
      const body = orgType === 'construtora'
        ? { user_id: userId, construtora_id: orgId }
        : { user_id: userId, imobiliaria_id: orgId };

      const { data, error } = await supabase.functions.invoke('admin-vincular-usuario', { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success('Usuário vinculado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      setSelectedOrgs(prev => { const u = { ...prev }; delete u[variables.userId]; return u; });
      setSelectedTypes(prev => { const u = { ...prev }; delete u[variables.userId]; return u; });
      setLinkingUserId(null);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao vincular usuário: ${error.message}`);
      setLinkingUserId(null);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('admin-delete-user', { body: { user_id: userId } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success('Usuário excluído com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      setUserToDelete(null);
      setIsDeleting(false);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir usuário: ${error.message}`);
      setIsDeleting(false);
    },
  });

  const handleDelete = () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    deleteUserMutation.mutate(userToDelete.user_id);
  };

  const handleLink = (userId: string) => {
    const orgId = selectedOrgs[userId];
    const orgType = selectedTypes[userId] || 'imobiliaria';
    if (!orgId) {
      toast.error('Selecione uma organização');
      return;
    }
    setLinkingUserId(userId);
    linkUserMutation.mutate({ userId, orgId, orgType });
  };

  const getOrgType = (userId: string): OrgType => selectedTypes[userId] || 'imobiliaria';

  const isLoading = loadingUsers || loadingImobiliarias || loadingConstrutoras;

  return (<><div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Usuários Pendentes</h1>
          <p className="text-muted-foreground mt-1">Usuários que precisam ser vinculados a uma organização</p>
        </div>

        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <AlertCircle className="h-5 w-5" />
              O que são usuários pendentes?
            </CardTitle>
          </CardHeader>
          <CardContent className="text-amber-700 dark:text-amber-300 text-sm">
            <p>
              Usuários pendentes são aqueles que deveriam estar vinculados a uma imobiliária ou construtora,
              mas ainda não foram associados. <strong>Corretores autônomos não aparecem aqui</strong>.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Usuários Aguardando Vínculo
            </CardTitle>
            <CardDescription>{pendingUsers?.length || 0} usuário(s) pendente(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {[1,2,3,4,5,6,7].map(i => <TableHead key={i}><Skeleton className="h-4 w-20" /></TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[1,2,3].map(i => (
                      <TableRow key={i}>
                        {[1,2,3,4,5,6,7].map(j => <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : !pendingUsers || pendingUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-lg font-medium">Nenhum usuário pendente</p>
                <p className="text-muted-foreground text-sm mt-1">Todos os usuários estão associados a uma organização</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Organização</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.map((user) => {
                      const orgType = getOrgType(user.user_id);
                      const orgList = orgType === 'construtora' ? construtoras : imobiliarias;

                      return (<>
                        <TableRow key={user.user_id}>
                          <TableCell className="font-medium">{user.profile?.nome || 'Sem nome'}</TableCell>
                          <TableCell>{user.email || 'N/A'}</TableCell>
                          <TableCell>{user.profile?.telefone ? formatPhone(user.profile.telefone) : 'N/A'}</TableCell>
                          <TableCell>{format(new Date(user.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</TableCell>
                          <TableCell className="min-w-[140px]">
                            <Select
                              value={orgType}
                              onValueChange={(value: OrgType) => {
                                setSelectedTypes(prev => ({ ...prev, [user.user_id]: value }));
                                setSelectedOrgs(prev => { const u = { ...prev }; delete u[user.user_id]; return u; });
                              }}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="imobiliaria">
                                  <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> Imobiliária</span>
                                </SelectItem>
                                <SelectItem value="construtora">
                                  <span className="flex items-center gap-1.5"><Building className="h-3.5 w-3.5" /> Construtora</span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="min-w-[200px]">
                            <Select
                              value={selectedOrgs[user.user_id] || ''}
                              onValueChange={(value) => setSelectedOrgs(prev => ({ ...prev, [user.user_id]: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent>
                                {orgList?.map((org) => (
                                  <SelectItem key={org.id} value={org.id}>{org.nome}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleLink(user.user_id)}
                                disabled={!selectedOrgs[user.user_id] || linkingUserId === user.user_id}
                              >
                                {linkingUserId === user.user_id ? (
                                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Vinculando...</>
                                ) : (
                                  <><UserPlus className="h-4 w-4 mr-2" />Vincular</>
                                )}
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => setUserToDelete(user)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Tem certeza que deseja excluir o usuário <strong>{userToDelete?.profile?.nome || userToDelete?.email || 'Sem nome'}</strong>?</p>
              <p className="text-destructive font-medium">Esta ação é irreversível.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Excluindo...</> : <><Trash2 className="h-4 w-4 mr-2" />Excluir</>}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </>);
}
