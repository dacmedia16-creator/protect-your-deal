import { useState } from "react";
import { formatPhone } from "@/lib/phone";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Search, KeyRound, Mail, Users, MoreVertical, Trash2, Edit, Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

export default function AdminUsuarios() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [imobiliariaFilter, setImobiliariaFilter] = useState<string>("all");
  
  // Reset password dialog
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resetAction, setResetAction] = useState<"set_password" | "send_reset_email">("send_reset_email");
  const [isResetting, setIsResetting] = useState(false);

  // Delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithRole | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserWithRole | null>(null);
  const [editForm, setEditForm] = useState({
    nome: "",
    telefone: "",
    creci: "",
    role: "",
    imobiliaria_id: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  // Create dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    nome: "",
    telefone: "",
    creci: "",
    role: "corretor",
    imobiliaria_id: "",
  });
  const [isCreating, setIsCreating] = useState(false);

  // Fetch all users with their roles and emails
  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      
      // Fetch user_roles with imobiliarias
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select(`
          id,
          user_id,
          role,
          imobiliaria_id,
          created_at,
          imobiliarias(nome)
        `)
        .order("created_at", { ascending: false });

      if (rolesError) throw rolesError;

      // Fetch profiles
      const userIds = userRoles.map((ur: any) => ur.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, nome, telefone, creci")
        .in("user_id", userIds);

      if (profilesError) throw profilesError;

      // Fetch emails from auth.users via edge function
      let emailMap = new Map<string, string>();
      try {
        const { data: usersData, error: usersError } = await supabase.functions.invoke("admin-list-users", {
          headers: {
            Authorization: `Bearer ${sessionData.session?.access_token}`,
          },
        });

        if (!usersError && usersData?.users) {
          emailMap = new Map(usersData.users.map((u: any) => [u.id, u.email]));
        }
      } catch (e) {
        console.error("Error fetching user emails:", e);
      }

      // Create maps for quick lookup
      const profileMap = new Map(profiles?.map((p: any) => [p.user_id, p]) || []);

      return userRoles.map((ur: any) => ({
        id: ur.id,
        user_id: ur.user_id,
        role: ur.role,
        imobiliaria_id: ur.imobiliaria_id,
        created_at: ur.created_at,
        profile: profileMap.get(ur.user_id) || null,
        imobiliaria: ur.imobiliarias,
        email: emailMap.get(ur.user_id) || null,
      })) as UserWithRole[];
    },
  });

  // Fetch imobiliarias for filter
  const { data: imobiliarias } = useQuery({
    queryKey: ["admin-imobiliarias-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("imobiliarias")
        .select("id, nome")
        .order("nome");
      if (error) throw error;
      return data as Imobiliaria[];
    },
  });

  const filteredUsers = users?.filter((user) => {
    const matchesSearch =
      user.profile?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.user_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesImobiliaria =
      imobiliariaFilter === "all" || user.imobiliaria_id === imobiliariaFilter;
    return matchesSearch && matchesRole && matchesImobiliaria;
  });

  const handleResetPassword = async () => {
    if (!selectedUser) return;

    if (resetAction === "set_password" && newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsResetting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("admin-reset-password", {
        body: {
          user_id: selectedUser.user_id,
          action: resetAction,
          new_password: resetAction === "set_password" ? newPassword : undefined,
        },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success(
        resetAction === "set_password"
          ? "Senha redefinida com sucesso"
          : "Link de recuperação gerado com sucesso"
      );
      setIsResetDialogOpen(false);
      setNewPassword("");
      setSelectedUser(null);
    } catch (error: any) {
      toast.error(error.message || "Erro ao redefinir senha");
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("admin-delete-user", {
        body: { user_id: userToDelete.user_id },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (response.error || response.data?.error) {
        throw new Error(response.data?.error || response.error?.message || "Erro ao excluir usuário");
      }

      toast.success("Usuário excluído com sucesso");
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir usuário");
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditDialog = (user: UserWithRole) => {
    setUserToEdit(user);
    setEditForm({
      nome: user.profile?.nome || "",
      telefone: user.profile?.telefone || "",
      creci: user.profile?.creci || "",
      role: user.role,
      imobiliaria_id: user.imobiliaria_id || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleEditUser = async () => {
    if (!userToEdit) return;

    setIsEditing(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("admin-update-user", {
        body: {
          user_id: userToEdit.user_id,
          nome: editForm.nome || undefined,
          telefone: editForm.telefone || undefined,
          creci: editForm.creci || undefined,
          role: editForm.role !== userToEdit.role ? editForm.role : undefined,
          imobiliaria_id: editForm.imobiliaria_id !== userToEdit.imobiliaria_id ? editForm.imobiliaria_id : undefined,
        },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (response.error || response.data?.error) {
        throw new Error(response.data?.error || response.error?.message || "Erro ao atualizar usuário");
      }

      toast.success("Usuário atualizado com sucesso");
      setIsEditDialogOpen(false);
      setUserToEdit(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar usuário");
    } finally {
      setIsEditing(false);
    }
  };

  const handleCreateUser = async () => {
    if (!createForm.email || !createForm.password || !createForm.nome || !createForm.imobiliaria_id) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (createForm.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsCreating(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("admin-create-user", {
        body: {
          email: createForm.email,
          password: createForm.password,
          nome: createForm.nome,
          telefone: createForm.telefone || undefined,
          creci: createForm.creci || undefined,
          role: createForm.role,
          imobiliaria_id: createForm.imobiliaria_id,
        },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (response.error || response.data?.error) {
        throw new Error(response.data?.error || response.error?.message || "Erro ao criar usuário");
      }

      toast.success("Usuário criado com sucesso");
      setIsCreateDialogOpen(false);
      setCreateForm({
        email: "",
        password: "",
        nome: "",
        telefone: "",
        creci: "",
        role: "corretor",
        imobiliaria_id: "",
      });
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar usuário");
    } finally {
      setIsCreating(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "super_admin":
        return "destructive";
      case "imobiliaria_admin":
        return "default";
      default:
        return "secondary";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "super_admin":
        return "Super Admin";
      case "imobiliaria_admin":
        return "Admin Imobiliária";
      case "corretor":
        return "Corretor";
      default:
        return role;
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
            <p className="text-muted-foreground">
              Gerencie todos os usuários do sistema
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-muted-foreground" />
              <span className="text-2xl font-bold">{users?.length || 0}</span>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filtrar por role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as roles</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="imobiliaria_admin">Admin Imobiliária</SelectItem>
                  <SelectItem value="corretor">Corretor</SelectItem>
                </SelectContent>
              </Select>
              <Select value={imobiliariaFilter} onValueChange={setImobiliariaFilter}>
                <SelectTrigger className="w-full md:w-[250px]">
                  <SelectValue placeholder="Filtrar por imobiliária" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as imobiliárias</SelectItem>
                  {imobiliarias?.map((imob) => (
                    <SelectItem key={imob.id} value={imob.id}>
                      {imob.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Imobiliária</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <p className="font-medium">{user.profile?.nome || "Sem nome"}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground">
                          {user.email || "-"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.imobiliaria?.nome || (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(user.created_at), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={user.role === "super_admin"}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(user)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setIsResetDialogOpen(true);
                              }}
                            >
                              <KeyRound className="h-4 w-4 mr-2" />
                              Redefinir Senha
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setUserToDelete(user);
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
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Reset Password Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
            <DialogDescription>
              Escolha como deseja redefinir a senha do usuário{" "}
              <strong>{selectedUser?.profile?.nome}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={resetAction === "send_reset_email" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setResetAction("send_reset_email")}
              >
                <Mail className="h-4 w-4 mr-2" />
                Enviar Email
              </Button>
              <Button
                variant={resetAction === "set_password" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setResetAction("set_password")}
              >
                <KeyRound className="h-4 w-4 mr-2" />
                Definir Senha
              </Button>
            </div>

            {resetAction === "set_password" && (
              <div>
                <Input
                  type="password"
                  placeholder="Nova senha (mínimo 6 caracteres)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>
              Cancelar
            </Button>
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
              Tem certeza que deseja excluir o usuário{" "}
              <strong>{userToDelete?.profile?.nome}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Altere os dados do usuário <strong>{userToEdit?.profile?.nome}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={editForm.nome}
                onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={editForm.telefone}
                onChange={(e) => setEditForm({ ...editForm, telefone: formatPhone(e.target.value) })}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>
            <div className="space-y-2">
              <Label>CRECI</Label>
              <Input
                value={editForm.creci}
                onChange={(e) => setEditForm({ ...editForm, creci: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corretor">Corretor</SelectItem>
                  <SelectItem value="imobiliaria_admin">Admin Imobiliária</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Imobiliária</Label>
              <Select value={editForm.imobiliaria_id} onValueChange={(v) => setEditForm({ ...editForm, imobiliaria_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma imobiliária" />
                </SelectTrigger>
                <SelectContent>
                  {imobiliarias?.map((imob) => (
                    <SelectItem key={imob.id} value={imob.id}>
                      {imob.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditUser} disabled={isEditing}>
              {isEditing ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
            <DialogDescription>
              Crie um novo usuário vinculado a uma imobiliária
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Senha *</Label>
              <Input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={createForm.nome}
                onChange={(e) => setCreateForm({ ...createForm, nome: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={createForm.telefone}
                onChange={(e) => setCreateForm({ ...createForm, telefone: formatPhone(e.target.value) })}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>
            <div className="space-y-2">
              <Label>CRECI</Label>
              <Input
                value={createForm.creci}
                onChange={(e) => setCreateForm({ ...createForm, creci: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select value={createForm.role} onValueChange={(v) => setCreateForm({ ...createForm, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corretor">Corretor</SelectItem>
                  <SelectItem value="imobiliaria_admin">Admin Imobiliária</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Imobiliária *</Label>
              <Select value={createForm.imobiliaria_id} onValueChange={(v) => setCreateForm({ ...createForm, imobiliaria_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma imobiliária" />
                </SelectTrigger>
                <SelectContent>
                  {imobiliarias?.map((imob) => (
                    <SelectItem key={imob.id} value={imob.id}>
                      {imob.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateUser} disabled={isCreating}>
              {isCreating ? "Criando..." : "Criar Usuário"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  );
}
