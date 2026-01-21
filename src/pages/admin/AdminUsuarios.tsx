import { useState } from "react";
import { formatPhone } from "@/lib/phone";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { APP_URL } from "@/lib/appConfig";
import { SuperAdminLayout } from "@/components/layouts/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Search, 
  KeyRound, 
  Users, 
  MoreVertical, 
  Trash2, 
  Edit, 
  UserPlus, 
  Building2, 
  Copy, 
  CheckCircle2, 
  MessageCircle, 
  Loader2,
  Shield,
  User,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { UserAvatar } from "@/components/UserAvatar";
import { PasswordInput } from "@/components/PasswordInput";
import { generatePassword } from "@/lib/password";
import { RoleBadge } from "@/components/RoleBadge";

interface UserWithRole {
  id: string;
  user_id: string;
  role: string;
  imobiliaria_id: string | null;
  created_at: string;
  profile: {
    nome: string;
    telefone?: string;
    creci?: string;
    ativo?: boolean;
  } | null;
  imobiliaria: {
    nome: string;
  } | null;
  email?: string;
}

interface Imobiliaria {
  id: string;
  nome: string;
}

interface UserGroup {
  id: string;
  type: 'super_admin' | 'imobiliaria' | 'corretor_autonomo';
  name: string;
  users: UserWithRole[];
  count: number;
}

function groupUsers(users: UserWithRole[]): UserGroup[] {
  const superAdmins: UserWithRole[] = [];
  const imobiliariaGroups = new Map<string, UserWithRole[]>();
  const autonomos: UserWithRole[] = [];

  users.forEach(user => {
    if (user.role === 'super_admin') {
      superAdmins.push(user);
    } else if (user.imobiliaria_id && user.imobiliaria?.nome) {
      const existing = imobiliariaGroups.get(user.imobiliaria_id) || [];
      existing.push(user);
      imobiliariaGroups.set(user.imobiliaria_id, existing);
    } else {
      autonomos.push(user);
    }
  });

  const groups: UserGroup[] = [];

  if (superAdmins.length > 0) {
    groups.push({
      id: 'super_admins',
      type: 'super_admin',
      name: 'Super Administradores',
      users: superAdmins.sort((a, b) => 
        (a.profile?.nome || '').localeCompare(b.profile?.nome || '')
      ),
      count: superAdmins.length,
    });
  }

  const imobiliariaEntries = Array.from(imobiliariaGroups.entries())
    .map(([id, groupUsers]) => ({
      id,
      type: 'imobiliaria' as const,
      name: groupUsers[0].imobiliaria?.nome || 'Sem nome',
      users: groupUsers.sort((a, b) => 
        (a.profile?.nome || '').localeCompare(b.profile?.nome || '')
      ),
      count: groupUsers.length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  groups.push(...imobiliariaEntries);

  if (autonomos.length > 0) {
    groups.push({
      id: 'autonomos',
      type: 'corretor_autonomo',
      name: 'Corretores Autônomos',
      users: autonomos.sort((a, b) => 
        (a.profile?.nome || '').localeCompare(b.profile?.nome || '')
      ),
      count: autonomos.length,
    });
  }

  return groups;
}

export default function AdminUsuarios() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Reset password dialog
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resetAction, setResetAction] = useState<"set_password" | "send_reset_email">("send_reset_email");
  const [isResetting, setIsResetting] = useState(false);

  // Delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    nome: "",
    telefone: "",
    role: "",
    imobiliaria_id: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  // Create dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: "",
    nome: "",
    telefone: "",
    role: "corretor",
    imobiliaria_id: "",
    password: "",
  });
  const [isCreating, setIsCreating] = useState(false);

  // Success dialog
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
    nome: string;
  } | null>(null);

  // Toggle status state
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

  // Fetch users
  const { data: users = [], isLoading, error, refetch } = useQuery({
    queryKey: ["admin-usuarios"],
    queryFn: async () => {
      // Verificar se o usuário está autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuário não autenticado. Faça login novamente.");
      }

      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select(`
          id,
          user_id,
          role,
          imobiliaria_id,
          created_at,
          imobiliarias (
            nome
          )
        `)
        .order("created_at", { ascending: false });

      if (rolesError) {
        console.error("Erro ao buscar roles:", rolesError);
        throw rolesError;
      }
      
      console.log(`AdminUsuarios: Encontrados ${userRoles?.length || 0} user_roles`);

      const userIds = userRoles?.map(u => u.user_id) || [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, nome, telefone, creci, ativo")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const { data: emailsData } = await supabase.functions.invoke("admin-get-corretores-emails", {
        body: { userIds }
      });

      const emailMap = new Map(
        emailsData?.emails?.map((e: { id: string; email: string }) => [e.id, e.email]) || []
      );

      return (userRoles || []).map(user => ({
        ...user,
        profile: profileMap.get(user.user_id) || null,
        imobiliaria: user.imobiliarias,
        email: emailMap.get(user.user_id) || "Email não encontrado",
      })) as UserWithRole[];
    },
  });

  // Fetch imobiliarias for selects
  const { data: imobiliarias = [] } = useQuery({
    queryKey: ["admin-imobiliarias-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("imobiliarias")
        .select("id, nome")
        .order("nome");

      if (error) throw error;
      return data as Imobiliaria[];
    },
  });

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.profile?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.imobiliaria?.nome?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "ativo" && user.profile?.ativo !== false) ||
      (statusFilter === "inativo" && user.profile?.ativo === false);

    return matchesSearch && matchesStatus;
  });

  // Group filtered users
  const groups = groupUsers(filteredUsers);

  // Calculate stats
  const totalUsers = users.length;
  const imobiliariasCount = new Set(users.filter(u => u.imobiliaria_id).map(u => u.imobiliaria_id)).size;
  const autonomosCount = users.filter(u => !u.imobiliaria_id && u.role !== 'super_admin').length;
  const ativosCount = users.filter(u => u.profile?.ativo !== false).length;
  const inativosCount = users.filter(u => u.profile?.ativo === false).length;

  const handleResetPassword = async () => {
    if (!selectedUser) return;

    setIsResetting(true);
    try {
      if (resetAction === "set_password") {
        if (!newPassword || newPassword.length < 6) {
          toast.error("A senha deve ter pelo menos 6 caracteres");
          return;
        }
        const { error } = await supabase.functions.invoke("admin-reset-password", {
          body: { userId: selectedUser.user_id, newPassword }
        });
        if (error) throw error;
        toast.success("Senha alterada com sucesso!");
      } else {
        const { error } = await supabase.functions.invoke("admin-reset-password", {
          body: { userId: selectedUser.user_id, sendEmail: true }
        });
        if (error) throw error;
        toast.success("Email de recuperação enviado!");
      }
      setIsResetDialogOpen(false);
      setNewPassword("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao redefinir senha");
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("admin-delete-user", {
        body: { userId: selectedUser.user_id }
      });
      if (error) throw error;
      toast.success("Usuário excluído com sucesso!");
      setIsDeleteDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir usuário");
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditDialog = (user: UserWithRole) => {
    setSelectedUser(user);
    setEditForm({
      nome: user.profile?.nome || "",
      telefone: user.profile?.telefone || "",
      role: user.role,
      imobiliaria_id: user.imobiliaria_id || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    setIsEditing(true);
    try {
      const { error } = await supabase.functions.invoke("admin-update-user", {
        body: {
          userId: selectedUser.user_id,
          nome: editForm.nome,
          telefone: editForm.telefone,
          role: editForm.role,
          imobiliariaId: editForm.imobiliaria_id || null,
        }
      });
      if (error) throw error;
      toast.success("Usuário atualizado com sucesso!");
      setIsEditDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar usuário");
    } finally {
      setIsEditing(false);
    }
  };

  const openCreateDialog = () => {
    setCreateForm({
      email: "",
      nome: "",
      telefone: "",
      role: "corretor",
      imobiliaria_id: "",
      password: generatePassword(),
    });
    setIsCreateDialogOpen(true);
  };

  const handleCreateUser = async () => {
    if (!createForm.email || !createForm.nome || !createForm.password) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await supabase.functions.invoke("admin-create-user", {
        body: {
          email: createForm.email,
          nome: createForm.nome,
          telefone: createForm.telefone,
          role: createForm.role,
          imobiliariaId: createForm.imobiliaria_id || null,
          password: createForm.password,
        }
      });
      if (error) throw error;
      
      setIsCreateDialogOpen(false);
      setCreatedCredentials({
        email: createForm.email,
        password: createForm.password,
        nome: createForm.nome,
      });
      setIsSuccessDialogOpen(true);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar usuário");
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleStatus = async (user: UserWithRole) => {
    setTogglingUserId(user.user_id);
    try {
      const newStatus = user.profile?.ativo === false ? true : false;
      const { error } = await supabase
        .from("profiles")
        .update({ ativo: !newStatus })
        .eq("id", user.user_id);
      if (error) throw error;
      toast.success("Status atualizado!");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar status");
    } finally {
      setTogglingUserId(null);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const handleSendWhatsApp = () => {
    if (!createdCredentials) return;
    const message = `Olá ${createdCredentials.nome}!\n\nSeu acesso ao Protect Your Deal foi criado:\n\n📧 Email: ${createdCredentials.email}\n🔑 Senha: ${createdCredentials.password}\n\nAcesse: ${APP_URL}/auth`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const getGroupIcon = (type: UserGroup['type']) => {
    switch (type) {
      case 'super_admin':
        return <Shield className="h-5 w-5 text-red-500" />;
      case 'imobiliaria':
        return <Building2 className="h-5 w-5 text-blue-500" />;
      case 'corretor_autonomo':
        return <User className="h-5 w-5 text-orange-500" />;
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Usuários</h1>
            <p className="text-muted-foreground">Gerencie todos os usuários do sistema</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Imobiliárias</CardTitle>
              <Building2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{imobiliariasCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Autônomos</CardTitle>
              <User className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{autonomosCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativos</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{ativosCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inativos</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">{inativosCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou imobiliária..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="inativo">Inativos</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={openCreateDialog}>
            <UserPlus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        </div>

        {/* User Groups Accordion */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <p className="text-destructive font-medium">Erro ao carregar usuários</p>
              <p className="text-muted-foreground text-sm mt-2 text-center max-w-md">
                {error instanceof Error ? error.message : "Erro desconhecido. Verifique sua conexão."}
              </p>
              <Button onClick={() => refetch()} className="mt-4">
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        ) : groups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum usuário encontrado</p>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" className="space-y-2">
            {groups.map((group) => (
              <AccordionItem key={group.id} value={group.id} className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-3 w-full">
                    {getGroupIcon(group.type)}
                    <span className="font-medium">{group.name}</span>
                    <Badge variant="secondary" className="ml-auto mr-2">
                      {group.count} usuário{group.count !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuário</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Contato</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Criado em</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <UserAvatar
                                  name={user.profile?.nome || user.email || ""}
                                  size="sm"
                                />
                                <div>
                                  <p className="font-medium">{user.profile?.nome || 'Sem nome'}</p>
                                  {user.profile?.creci && (
                                    <p className="text-xs text-muted-foreground">CRECI: {user.profile.creci}</p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{user.email}</TableCell>
                            <TableCell>
                              <RoleBadge role={user.role as any} />
                            </TableCell>
                            <TableCell>{formatPhone(user.profile?.telefone) || '-'}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={user.profile?.ativo !== false}
                                  onCheckedChange={() => handleToggleStatus(user)}
                                  disabled={togglingUserId === user.user_id}
                                />
                                <span className={user.profile?.ativo !== false ? 'text-green-600' : 'text-muted-foreground'}>
                                  {user.profile?.ativo !== false ? 'Ativo' : 'Inativo'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedUser(user);
                                    setIsResetDialogOpen(true);
                                  }}>
                                    <KeyRound className="h-4 w-4 mr-2" />
                                    Redefinir Senha
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setIsDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        {/* Reset Password Dialog */}
        <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Redefinir Senha</DialogTitle>
              <DialogDescription>
                Escolha como redefinir a senha de {selectedUser?.profile?.nome || selectedUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Método</Label>
                <Select value={resetAction} onValueChange={(v: any) => setResetAction(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="send_reset_email">Enviar email de recuperação</SelectItem>
                    <SelectItem value="set_password">Definir nova senha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {resetAction === "set_password" && (
                <div className="space-y-2">
                  <Label>Nova Senha</Label>
                  <div className="flex gap-2">
                  <PasswordInput 
                    value={newPassword} 
                    onChange={(value) => setNewPassword(value)} 
                    placeholder="Digite a nova senha" 
                  />
                    <Button type="button" variant="outline" onClick={() => setNewPassword(generatePassword())}>
                      Gerar
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleResetPassword} disabled={isResetting}>
                {isResetting ? "Processando..." : "Confirmar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete User Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o usuário {selectedUser?.profile?.nome || selectedUser?.email}? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteUser} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {isDeleting ? "Excluindo..." : "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>Editar informações de {selectedUser?.email}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input 
                  value={editForm.nome} 
                  onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })} 
                  placeholder="Nome completo" 
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input 
                  value={editForm.telefone} 
                  onChange={(e) => setEditForm({ ...editForm, telefone: e.target.value })} 
                  placeholder="(00) 00000-0000" 
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corretor">Corretor</SelectItem>
                    <SelectItem value="admin_imobiliaria">Admin Imobiliária</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Imobiliária</Label>
                <Select 
                  value={editForm.imobiliaria_id || "none"} 
                  onValueChange={(v) => setEditForm({ ...editForm, imobiliaria_id: v === "none" ? "" : v })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma (Autônomo)</SelectItem>
                    {imobiliarias.map((imob) => (
                      <SelectItem key={imob.id} value={imob.id}>{imob.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleEditUser} disabled={isEditing}>
                {isEditing ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create User Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Usuário</DialogTitle>
              <DialogDescription>Criar um novo usuário no sistema</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input 
                  type="email" 
                  value={createForm.email} 
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} 
                  placeholder="email@exemplo.com" 
                />
              </div>
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input 
                  value={createForm.nome} 
                  onChange={(e) => setCreateForm({ ...createForm, nome: e.target.value })} 
                  placeholder="Nome completo" 
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input 
                  value={createForm.telefone} 
                  onChange={(e) => setCreateForm({ ...createForm, telefone: e.target.value })} 
                  placeholder="(00) 00000-0000" 
                />
              </div>
              <div className="space-y-2">
                <Label>Senha *</Label>
                <div className="flex gap-2">
                <PasswordInput 
                  value={createForm.password} 
                  onChange={(value) => setCreateForm({ ...createForm, password: value })} 
                  placeholder="Senha" 
                />
                  <Button type="button" variant="outline" onClick={() => setCreateForm({ ...createForm, password: generatePassword() })}>
                    Gerar
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={createForm.role} onValueChange={(v) => setCreateForm({ ...createForm, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corretor">Corretor</SelectItem>
                    <SelectItem value="admin_imobiliaria">Admin Imobiliária</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Imobiliária</Label>
                <Select 
                  value={createForm.imobiliaria_id || "none"} 
                  onValueChange={(v) => setCreateForm({ ...createForm, imobiliaria_id: v === "none" ? "" : v })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma (Autônomo)</SelectItem>
                    {imobiliarias.map((imob) => (
                      <SelectItem key={imob.id} value={imob.id}>{imob.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateUser} disabled={isCreating}>
                {isCreating ? "Criando..." : "Criar Usuário"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Success Dialog */}
        <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-green-600">Usuário Criado!</DialogTitle>
              <DialogDescription>O usuário foi criado com sucesso. Copie as credenciais abaixo:</DialogDescription>
            </DialogHeader>
            {createdCredentials && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-mono">{createdCredentials.email}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleCopy(createdCredentials.email, "Email")}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Senha</p>
                      <p className="font-mono">{createdCredentials.password}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleCopy(createdCredentials.password, "Senha")}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => handleCopy(`Email: ${createdCredentials.email}\nSenha: ${createdCredentials.password}`, "Credenciais")}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Tudo
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={handleSendWhatsApp}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Enviar WhatsApp
                  </Button>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setIsSuccessDialogOpen(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  );
}
