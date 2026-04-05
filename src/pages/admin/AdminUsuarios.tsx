import { useState, useMemo } from "react";
import { getRoleBadgeVariant, roleLabels } from '@/lib/statusColors';
import { formatPhone, unformatPhone } from "@/lib/phone";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_URL } from "@/lib/appConfig";
import { SuperAdminLayout } from "@/components/layouts/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
import { Search, KeyRound, Mail, Users, MoreVertical, Trash2, Edit, UserPlus, Phone, Building2, IdCard, Copy, Check, CheckCircle2, MessageCircle, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { UserAvatar } from "@/components/UserAvatar";
import { PasswordInput } from "@/components/PasswordInput";
import { generatePassword } from "@/lib/password";
import { AnimatedContent, AnimatedStatsGrid, AnimatedStatCard, AnimatedList, AnimatedItem } from "@/components/AnimatedContent";

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

type SortColumn = 'nome' | 'email' | 'created_at';
type SortDirection = 'asc' | 'desc';

export default function AdminUsuarios() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [imobiliariaFilter, setImobiliariaFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Sorting state
  const [sortColumn, setSortColumn] = useState<SortColumn>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
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
    email: "",
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

  // Success dialog
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [createdUser, setCreatedUser] = useState<{ email: string; password: string; nome: string; telefone?: string } | null>(null);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

  // Fetch all users with their roles and emails
  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      
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

      const userIds = userRoles.map((ur: any) => ur.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, nome, telefone, creci, ativo")
        .in("user_id", userIds);

      if (profilesError) throw profilesError;

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
      imobiliariaFilter === "all" ||
      (imobiliariaFilter === "autonomos" && user.imobiliaria_id === null) ||
      user.imobiliaria_id === imobiliariaFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "ativo" && user.profile?.ativo !== false) ||
      (statusFilter === "inativo" && user.profile?.ativo === false);
    return matchesSearch && matchesRole && matchesImobiliaria && matchesStatus;
  });

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const sortedUsers = useMemo(() => {
    if (!filteredUsers) return [];
    
    return [...filteredUsers].sort((a, b) => {
      let valueA: string | number;
      let valueB: string | number;
      
      switch (sortColumn) {
        case 'nome':
          valueA = a.profile?.nome?.toLowerCase() || '';
          valueB = b.profile?.nome?.toLowerCase() || '';
          break;
        case 'email':
          valueA = a.email?.toLowerCase() || '';
          valueB = b.email?.toLowerCase() || '';
          break;
        case 'created_at':
          valueA = new Date(a.created_at).getTime();
          valueB = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }
      
      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredUsers, sortColumn, sortDirection]);

  const SortableTableHead = ({ column, label }: { column: SortColumn; label: string }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 transition-colors select-none"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortColumn === column ? (
          sortDirection === 'asc' ? (
            <ArrowUp className="h-4 w-4 text-primary" />
          ) : (
            <ArrowDown className="h-4 w-4 text-primary" />
          )
        ) : (
          <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />
        )}
      </div>
    </TableHead>
  );

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
      email: user.email || "",
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
          telefone: editForm.telefone ? unformatPhone(editForm.telefone) : undefined,
          creci: editForm.creci || undefined,
          email: editForm.email !== userToEdit.email ? editForm.email : undefined,
          role: editForm.role !== userToEdit.role ? editForm.role : undefined,
          imobiliaria_id: editForm.imobiliaria_id !== userToEdit.imobiliaria_id ? editForm.imobiliaria_id : undefined,
        },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (response.error || response.data?.error) {
        let errorMsg = response.data?.error || "Erro ao atualizar usuário";
        if (!response.data?.error && response.error) {
          try {
            const ctx = (response.error as any)?.context;
            if (ctx instanceof Response) {
              const parsed = await ctx.json();
              errorMsg = parsed.error || errorMsg;
            }
          } catch {}
        }
        throw new Error(errorMsg);
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
          telefone: createForm.telefone ? unformatPhone(createForm.telefone) : undefined,
          creci: createForm.creci || undefined,
          role: createForm.role,
          imobiliaria_id: createForm.imobiliaria_id,
        },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (response.error || response.data?.error) {
        let errorMsg = response.data?.error || "Erro ao criar usuário";
        if (!response.data?.error && response.error) {
          try {
            const ctx = (response.error as any)?.context;
            if (ctx instanceof Response) {
              const parsed = await ctx.json();
              errorMsg = parsed.error || errorMsg;
            }
          } catch {}
        }
        throw new Error(errorMsg);
      }

      // Show success dialog
      setCreatedUser({
        email: createForm.email,
        password: createForm.password,
        nome: createForm.nome,
        telefone: createForm.telefone || undefined,
      });
      setIsCreateDialogOpen(false);
      setIsSuccessDialogOpen(true);
      
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

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copiado!");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSendWhatsApp = async () => {
    if (!createdUser?.telefone) {
      toast.error("Usuário não possui telefone cadastrado");
      return;
    }

    setIsSendingWhatsApp(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const message = `Olá ${createdUser.nome}! 🎉\n\nSua conta foi criada com sucesso!\n\n📧 *Email:* ${createdUser.email}\n🔑 *Senha:* ${createdUser.password}\n\nAcesse: ${APP_URL}\n\nRecomendamos que você altere sua senha após o primeiro acesso.`;

      const response = await supabase.functions.invoke("send-whatsapp", {
        body: {
          action: "send-text",
          phone: createdUser.telefone,
          message,
          channel: 'default',
        },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (response.error || response.data?.error) {
        throw new Error(response.data?.error || response.error?.message || "Erro ao enviar WhatsApp");
      }

      toast.success("Credenciais enviadas por WhatsApp!");
    } catch (error: any) {
      console.error("Erro ao enviar WhatsApp:", error);
      toast.error(error.message || "Erro ao enviar WhatsApp");
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  const openCreateWithPassword = () => {
    setCreateForm({
      email: "",
      password: generatePassword(12),
      nome: "",
      telefone: "",
      creci: "",
      role: "corretor",
      imobiliaria_id: "",
    });
    setIsCreateDialogOpen(true);
  };

  const handleToggleStatus = async (user: UserWithRole) => {
    if (user.role === "super_admin") return;
    
    setTogglingUserId(user.user_id);
    try {
      const newStatus = user.profile?.ativo === false ? true : false;
      
      // If deactivating, also clear phone to free it for reuse
      const updateData: { ativo: boolean; telefone?: null } = { ativo: newStatus };
      if (!newStatus) {
        updateData.telefone = null;
      }
      
      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", user.user_id);

      if (error) throw error;

      toast.success(newStatus ? "Usuário ativado" : "Usuário desativado (telefone liberado)");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao alterar status");
    } finally {
      setTogglingUserId(null);
    }
  };

  // Using getRoleBadgeVariant from lib/statusColors

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

  return (<>
    <div className="space-y-6">
        {/* Header - Responsive */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Usuários</h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Gerencie todos os usuários do sistema
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button onClick={openCreateWithPassword} className="w-full md:w-auto">
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-muted-foreground" />
                <div className="text-right">
                  <span className="text-2xl font-bold">{users?.length || 0}</span>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
              <Separator orientation="vertical" className="h-10" />
              <div className="text-right">
                <span className="text-xl font-bold text-green-600">
                  {users?.filter(u => u.profile?.ativo !== false).length || 0}
                </span>
                <p className="text-xs text-muted-foreground">Ativos</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-muted-foreground">
                  {users?.filter(u => u.profile?.ativo === false).length || 0}
                </span>
                <p className="text-xs text-muted-foreground">Inativos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Stats */}
        <div className="grid grid-cols-3 gap-3 md:hidden">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-lg font-bold">{users?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div>
              <p className="text-lg font-bold text-green-600">
                {users?.filter(u => u.profile?.ativo !== false).length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Ativos</p>
            </div>
          </Card>
          <Card className="p-3">
            <div>
              <p className="text-lg font-bold text-muted-foreground">
                {users?.filter(u => u.profile?.ativo === false).length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Inativos</p>
            </div>
          </Card>
        </div>

        {/* Filters Card */}
        <Card>
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="text-base md:text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 md:flex-row md:gap-4">
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
                  <SelectItem value="autonomos">Autônomos (sem imobiliária)</SelectItem>
                  {imobiliarias?.map((imob) => (
                    <SelectItem key={imob.id} value={imob.id}>
                      {imob.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="inativo">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Mobile View - Cards */}
        <div className="space-y-3 md:hidden">
          {isLoading ? (
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-5 w-20 rounded-full" />
                        </div>
                        <Skeleton className="h-3 w-40" />
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : sortedUsers?.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhum usuário encontrado
              </CardContent>
            </Card>
          ) : (
            sortedUsers?.map((user) => (
              <Card
                key={user.id}
                className="cursor-pointer transition-all hover:shadow-md active:bg-muted/30"
                onClick={() => openEditDialog(user)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <UserAvatar 
                      name={user.profile?.nome} 
                      role={user.role}
                      size="md"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold truncate">
                          {user.profile?.nome || "Sem nome"}
                        </p>
                        <Badge variant={getRoleBadgeVariant(user.role)} className="flex-shrink-0">
                          {getRoleLabel(user.role)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email || "-"}
                      </p>
                      <div className="flex items-center gap-3 text-xs flex-wrap">
                        {user.imobiliaria?.nome && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate max-w-[150px]">{user.imobiliaria.nome}</span>
                          </span>
                        )}
                        {user.profile?.creci && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <IdCard className="h-3 w-3" />
                            {user.profile.creci}
                          </span>
                        )}
                        <span className={user.profile?.ativo !== false 
                          ? 'text-green-600 font-medium' 
                          : 'text-muted-foreground'}>
                          {user.profile?.ativo !== false ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 flex-shrink-0"
                          disabled={user.role === "super_admin"}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(user);
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(user);
                          }}
                          disabled={user.role === "super_admin" || togglingUserId === user.user_id}
                        >
                          <Switch className="h-4 w-4 mr-2" />
                          {user.profile?.ativo !== false ? 'Desativar' : 'Ativar'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(user);
                            setNewPassword(generatePassword(12));
                            setIsResetDialogOpen(true);
                          }}
                        >
                          <KeyRound className="h-4 w-4 mr-2" />
                          Redefinir Senha
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUserToDelete(user);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Desktop View - Table */}
        <Card className="hidden md:block">
          <CardContent className="p-0">
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead column="nome" label="Usuário" />
                    <SortableTableHead column="email" label="Email" />
                    <TableHead>Role</TableHead>
                    <TableHead>Imobiliária</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Status</TableHead>
                    <SortableTableHead column="created_at" label="Criado em" />
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-3 w-16" />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded ml-auto" /></TableCell>
                        </TableRow>
                      ))}
                    </>
                  ) : sortedUsers?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedUsers?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <UserAvatar 
                              name={user.profile?.nome} 
                              role={user.role}
                              size="sm"
                            />
                            <div>
                              <p className="font-medium">{user.profile?.nome || "Sem nome"}</p>
                              {user.profile?.creci && (
                                <p className="text-xs text-muted-foreground">CRECI: {user.profile.creci}</p>
                              )}
                            </div>
                          </div>
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
                          {user.profile?.telefone ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground cursor-default">
                                  <Phone className="h-3 w-3" />
                                  <span>{user.profile.telefone}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{user.profile.telefone}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={user.profile?.ativo !== false}
                              onCheckedChange={() => handleToggleStatus(user)}
                              disabled={user.role === "super_admin" || togglingUserId === user.user_id}
                            />
                            <span className={`text-xs ${user.profile?.ativo !== false ? 'text-green-600' : 'text-muted-foreground'}`}>
                              {user.profile?.ativo !== false ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
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
                            <DropdownMenuContent align="end" className="bg-popover">
                              <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setNewPassword(generatePassword(12));
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
            </TooltipProvider>
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
              <div className="space-y-2">
                <Label>Nova Senha</Label>
                <PasswordInput
                  value={newPassword}
                  onChange={setNewPassword}
                  showGenerator={true}
                  showStrength={true}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {userToEdit && (
                <UserAvatar name={userToEdit.profile?.nome} role={userToEdit.role} size="md" />
              )}
              Editar Usuário
            </DialogTitle>
            <DialogDescription>
              Altere os dados do usuário
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Email de Login */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Mail className="h-4 w-4" />
                Credenciais de Acesso
              </div>
              <div className="space-y-2">
                <Label>Email de Login</Label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>

            <Separator />

            {/* Dados Pessoais */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <IdCard className="h-4 w-4" />
                Dados Pessoais
              </div>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={editForm.nome}
                    onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                </div>
              </div>
            </div>

            <Separator />

            {/* Permissões */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Building2 className="h-4 w-4" />
                Permissões
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                      <SelectValue placeholder="Selecione" />
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Novo Usuário
            </DialogTitle>
            <DialogDescription>
              Crie um novo usuário vinculado a uma imobiliária
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Credenciais */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <KeyRound className="h-4 w-4" />
                Credenciais de Acesso
              </div>
              <div className="grid gap-4">
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
                  <Label>Senha *</Label>
                  <PasswordInput
                    value={createForm.password}
                    onChange={(v) => setCreateForm({ ...createForm, password: v })}
                    showGenerator={true}
                    showStrength={true}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Dados Pessoais */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <IdCard className="h-4 w-4" />
                Dados Pessoais
              </div>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    value={createForm.nome}
                    onChange={(e) => setCreateForm({ ...createForm, nome: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                </div>
              </div>
            </div>

            <Separator />

            {/* Permissões */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Building2 className="h-4 w-4" />
                Permissões
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                      <SelectValue placeholder="Selecione" />
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

      {/* Success Dialog */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Usuário Criado com Sucesso!
            </DialogTitle>
            <DialogDescription>
              Anote as credenciais de acesso do usuário
            </DialogDescription>
          </DialogHeader>

          {createdUser && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Nome</p>
                    <p className="font-medium">{createdUser.nome}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{createdUser.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleCopy(createdUser.email, "email")}
                  >
                    {copiedField === "email" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Senha</p>
                    <p className="font-mono font-medium">{createdUser.password}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleCopy(createdUser.password, "password")}
                  >
                    {copiedField === "password" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleCopy(`Email: ${createdUser.email}\nSenha: ${createdUser.password}`, "all")}
                >
                  {copiedField === "all" ? (
                    <>
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar
                    </>
                  )}
                </Button>
                <Button
                  variant="default"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleSendWhatsApp}
                  disabled={!createdUser.telefone || isSendingWhatsApp}
                  title={!createdUser.telefone ? "Usuário sem telefone cadastrado" : "Enviar credenciais por WhatsApp"}
                >
                  {isSendingWhatsApp ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      WhatsApp
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsSuccessDialogOpen(false)}>
              Fechar
            </Button>
            <Button onClick={() => {
              setIsSuccessDialogOpen(false);
              openCreateWithPassword();
            }}>
              <UserPlus className="h-4 w-4 mr-2" />
              Criar Outro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog></>
      </>);
}
