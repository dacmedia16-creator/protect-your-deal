import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SuperAdminLayout } from '@/components/layouts/SuperAdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { UserPlus, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatPhone } from '@/lib/phone';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PendingUser {
  user_id: string;
  role: string;
  created_at: string;
  profile: {
    nome: string;
    telefone: string | null;
  } | null;
  email: string | null;
}

export default function AdminUsuariosPendentes() {
  const queryClient = useQueryClient();
  const [selectedImobiliarias, setSelectedImobiliarias] = useState<Record<string, string>>({});
  const [linkingUserId, setLinkingUserId] = useState<string | null>(null);

  // Fetch pending users (corretores without imobiliaria_id)
  const { data: pendingUsers, isLoading: loadingUsers } = useQuery({
    queryKey: ['pending-users'],
    queryFn: async () => {
      // First get user_roles without imobiliaria_id
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, created_at')
        .is('imobiliaria_id', null)
        .neq('role', 'super_admin');

      if (rolesError) throw rolesError;
      if (!roles || roles.length === 0) return [];

      // Get profiles for these users
      const userIds = roles.map(r => r.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, nome, telefone')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Get emails using admin function
      const { data: usersData, error: usersError } = await supabase.functions.invoke('admin-list-users');
      
      if (usersError) throw usersError;

      const users = usersData?.users || [];

      // Combine data
      return roles.map(role => {
        const profile = profiles?.find(p => p.user_id === role.user_id);
        const authUser = users.find((u: any) => u.id === role.user_id);
        
        return {
          user_id: role.user_id,
          role: role.role,
          created_at: role.created_at,
          profile: profile || null,
          email: authUser?.email || null
        } as PendingUser;
      });
    }
  });

  // Fetch imobiliarias
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
    }
  });

  // Mutation to link user to imobiliaria
  const linkUserMutation = useMutation({
    mutationFn: async ({ userId, imobiliariaId }: { userId: string; imobiliariaId: string }) => {
      const { data, error } = await supabase.functions.invoke('admin-vincular-usuario', {
        body: { user_id: userId, imobiliaria_id: imobiliariaId }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success('Usuário vinculado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      setSelectedImobiliarias(prev => {
        const updated = { ...prev };
        delete updated[variables.userId];
        return updated;
      });
      setLinkingUserId(null);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao vincular usuário: ${error.message}`);
      setLinkingUserId(null);
    }
  });

  const handleLink = (userId: string) => {
    const imobiliariaId = selectedImobiliarias[userId];
    if (!imobiliariaId) {
      toast.error('Selecione uma imobiliária');
      return;
    }
    
    setLinkingUserId(userId);
    linkUserMutation.mutate({ userId, imobiliariaId });
  };

  const isLoading = loadingUsers || loadingImobiliarias;

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Usuários Pendentes
          </h1>
          <p className="text-muted-foreground mt-1">
            Usuários que precisam ser vinculados a uma imobiliária
          </p>
        </div>

        {/* Info Card */}
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <AlertCircle className="h-5 w-5" />
              O que são usuários pendentes?
            </CardTitle>
          </CardHeader>
          <CardContent className="text-amber-700 dark:text-amber-300 text-sm">
            <p>
              Usuários pendentes são aqueles que possuem uma conta e um papel (corretor) atribuído, 
              mas ainda não foram vinculados a nenhuma imobiliária. Isso pode acontecer quando:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Um usuário criou uma conta fora do fluxo normal de convite</li>
              <li>Houve um problema durante o registro da imobiliária</li>
              <li>O usuário foi migrado de um sistema legado</li>
            </ul>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Usuários Aguardando Vínculo
            </CardTitle>
            <CardDescription>
              {pendingUsers?.length || 0} usuário(s) pendente(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !pendingUsers || pendingUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-lg font-medium">Nenhum usuário pendente</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Todos os usuários estão vinculados a uma imobiliária
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead>Imobiliária</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell className="font-medium">
                          {user.profile?.nome || 'Sem nome'}
                        </TableCell>
                        <TableCell>
                          {user.email || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {user.profile?.telefone ? formatPhone(user.profile.telefone) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {format(new Date(user.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="min-w-[200px]">
                          <Select
                            value={selectedImobiliarias[user.user_id] || ''}
                            onValueChange={(value) => 
                              setSelectedImobiliarias(prev => ({ ...prev, [user.user_id]: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              {imobiliarias?.map((imob) => (
                                <SelectItem key={imob.id} value={imob.id}>
                                  {imob.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleLink(user.user_id)}
                            disabled={!selectedImobiliarias[user.user_id] || linkingUserId === user.user_id}
                          >
                            {linkingUserId === user.user_id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Vinculando...
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Vincular
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}
