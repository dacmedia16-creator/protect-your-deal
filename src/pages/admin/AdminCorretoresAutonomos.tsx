import { useState } from "react";
import { formatPhone } from "@/lib/phone";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SuperAdminLayout } from "@/components/layouts/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  Search, 
  MoreVertical, 
  Link as LinkIcon, 
  KeyRound, 
  Trash2,
  UserCircle,
  FileText,
  UserPlus,
  CreditCard,
  Power,
  ClipboardList
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AnimatedContent, AnimatedList, AnimatedItem } from "@/components/AnimatedContent";

interface CorretorAutonomo {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile: {
    nome: string;
    telefone?: string;
    creci?: string;
  } | null;
  email?: string;
  stats: {
    fichas: number;
    fichasConfirmadas: number;
  };
  assinatura?: {
    id: string;
    status: string;
    plano_nome: string;
  } | null;
  survey_enabled?: boolean;
}

interface Plano {
  id: string;
  nome: string;
  valor_mensal: number;
}

interface Imobiliaria {
  id: string;
  nome: string;
}

export default function AdminCorretoresAutonomos() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Link to imobiliaria dialog
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [corretorToLink, setCorretorToLink] = useState<CorretorAutonomo | null>(null);
  const [selectedImobiliariaId, setSelectedImobiliariaId] = useState<string>("");
  const [backfillFichas, setBackfillFichas] = useState(true);
  const [isLinking, setIsLinking] = useState(false);

  // Delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [corretorToDelete, setCorretorToDelete] = useState<CorretorAutonomo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset password dialog
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [corretorToReset, setCorretorToReset] = useState<CorretorAutonomo | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetAction, setResetAction] = useState<"set_password" | "send_reset_email">("send_reset_email");
  const [isResetting, setIsResetting] = useState(false);

  // Create autonomous corretor dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newCorretor, setNewCorretor] = useState({
    nome: "",
    email: "",
    senha: "",
    telefone: "",
    creci: "",
  });

  // Assign plan dialog
  const [isPlanoDialogOpen, setIsPlanoDialogOpen] = useState(false);
  const [corretorToAssign, setCorretorToAssign] = useState<CorretorAutonomo | null>(null);
  const [selectedPlanoId, setSelectedPlanoId] = useState("");
  const [isAssigningPlano, setIsAssigningPlano] = useState(false);

  // Toggle subscription status
  const [isTogglingStatus, setIsTogglingStatus] = useState<string | null>(null);

  // Toggle survey feature
  const [isTogglingSurvey, setIsTogglingSurvey] = useState<string | null>(null);

  // Fetch corretores autônomos
  const { data: corretores, isLoading, refetch } = useQuery({
    queryKey: ["admin-corretores-autonomos"],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      
      // Fetch user_roles where imobiliaria_id is NULL and role is corretor
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("id, user_id, role, created_at")
        .is("imobiliaria_id", null)
        .eq("role", "corretor")
        .order("created_at", { ascending: false });

      if (rolesError) throw rolesError;

      if (!userRoles || userRoles.length === 0) {
        return [];
      }

      const userIds = userRoles.map((ur) => ur.user_id);

      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, nome, telefone, creci")
        .in("user_id", userIds);

      if (profilesError) throw profilesError;

      // Fetch emails via edge function
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

      // Fetch stats for each user
      const statsPromises = userIds.map(async (userId) => {
        const [fichasResult, fichasConfirmadasResult] = await Promise.all([
          supabase.from("fichas_visita").select("id", { count: "exact", head: true }).eq("user_id", userId),
          supabase.from("fichas_visita").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "confirmado"),
        ]);

        return {
          userId,
          fichas: fichasResult.count || 0,
          fichasConfirmadas: fichasConfirmadasResult.count || 0,
        };
      });

      const stats = await Promise.all(statsPromises);
      const statsMap = new Map(stats.map((s) => [s.userId, s]));

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      // Fetch subscriptions for these users
      const { data: assinaturas } = await supabase
        .from("assinaturas")
        .select("id, user_id, status, plano:planos!assinaturas_plano_id_fkey(nome)")
        .in("user_id", userIds);

      const assinaturaMap = new Map(
        assinaturas?.map((a) => [
          a.user_id,
          {
            id: a.id,
            status: a.status,
            plano_nome: (a.plano as any)?.nome || "Plano desconhecido",
          },
        ]) || []
      );

      // Fetch user feature flags for survey
      const { data: userFlags } = await supabase
        .from("user_feature_flags")
        .select("user_id, enabled")
        .in("user_id", userIds)
        .eq("feature_key", "post_visit_survey");

      const flagsMap = new Map(
        userFlags?.map((f) => [f.user_id, f.enabled]) || []
      );

      return userRoles.map((ur) => ({
        id: ur.id,
        user_id: ur.user_id,
        role: ur.role,
        created_at: ur.created_at,
        profile: profileMap.get(ur.user_id) || null,
        email: emailMap.get(ur.user_id) || null,
        stats: statsMap.get(ur.user_id) || { fichas: 0, fichasConfirmadas: 0 },
        assinatura: assinaturaMap.get(ur.user_id) || null,
        survey_enabled: flagsMap.get(ur.user_id) ?? false,
      })) as CorretorAutonomo[];
    },
  });

  // Fetch imobiliarias for linking
  const { data: imobiliarias } = useQuery({
    queryKey: ["admin-imobiliarias-for-link"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("imobiliarias")
        .select("id, nome")
        .eq("status", "ativo")
        .order("nome");
      if (error) throw error;
      return data as Imobiliaria[];
    },
  });

  // Fetch individual plans (max_corretores = 1)
  const { data: planosIndividuais } = useQuery({
    queryKey: ["admin-planos-individuais"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planos")
        .select("id, nome, valor_mensal")
        .eq("ativo", true)
        .eq("max_corretores", 1)
        .order("valor_mensal");
      if (error) throw error;
      return data as Plano[];
    },
  });

  const filteredCorretores = corretores?.filter((corretor) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      corretor.profile?.nome?.toLowerCase().includes(searchLower) ||
      corretor.email?.toLowerCase().includes(searchLower)
    );
  });

  const handleLinkToImobiliaria = async () => {
    if (!corretorToLink || !selectedImobiliariaId) {
      toast.error("Selecione uma imobiliária");
      return;
    }

    setIsLinking(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("admin-vincular-usuario", {
        body: {
          user_id: corretorToLink.user_id,
          imobiliaria_id: selectedImobiliariaId,
          backfill_fichas: backfillFichas,
        },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (response.error || response.data?.error) {
        throw new Error(response.data?.error || response.error?.message || "Erro ao vincular usuário");
      }

      const backfillMessage = response.data?.backfill?.updated > 0 
        ? ` (${response.data.backfill.updated} ficha(s) atualizada(s))`
        : "";

      toast.success(`Corretor vinculado com sucesso${backfillMessage}`);
      setIsLinkDialogOpen(false);
      setCorretorToLink(null);
      setSelectedImobiliariaId("");
      setBackfillFichas(true);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (error: any) {
      toast.error(error.message || "Erro ao vincular corretor");
    } finally {
      setIsLinking(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!corretorToDelete) return;

    setIsDeleting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("admin-delete-user", {
        body: { user_id: corretorToDelete.user_id },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (response.error || response.data?.error) {
        throw new Error(response.data?.error || response.error?.message || "Erro ao excluir usuário");
      }

      toast.success("Corretor excluído com sucesso");
      setIsDeleteDialogOpen(false);
      setCorretorToDelete(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir corretor");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!corretorToReset) return;

    if (resetAction === "set_password" && newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsResetting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("admin-reset-password", {
        body: {
          user_id: corretorToReset.user_id,
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
      setCorretorToReset(null);
    } catch (error: any) {
      toast.error(error.message || "Erro ao redefinir senha");
    } finally {
      setIsResetting(false);
    }
  };

  const openLinkDialog = (corretor: CorretorAutonomo) => {
    setCorretorToLink(corretor);
    setSelectedImobiliariaId("");
    setBackfillFichas(true);
    setIsLinkDialogOpen(true);
  };

  const openPlanoDialog = (corretor: CorretorAutonomo) => {
    setCorretorToAssign(corretor);
    setSelectedPlanoId(corretor.assinatura ? "" : "");
    setIsPlanoDialogOpen(true);
  };

  const handleToggleAssinatura = async (corretor: CorretorAutonomo) => {
    if (!corretor.assinatura) {
      toast.error("Corretor não possui assinatura vinculada");
      return;
    }

    setIsTogglingStatus(corretor.user_id);
    try {
      const novoStatus = corretor.assinatura.status === "ativa" ? "suspensa" : "ativa";
      
      const { error } = await supabase
        .from("assinaturas")
        .update({ status: novoStatus })
        .eq("id", corretor.assinatura.id);

      if (error) throw error;

      toast.success(
        novoStatus === "ativa" 
          ? "Assinatura ativada com sucesso!" 
          : "Assinatura suspensa com sucesso!"
      );
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao alterar status da assinatura");
    } finally {
      setIsTogglingStatus(null);
    }
  };

  const handleToggleSurvey = async (corretor: CorretorAutonomo) => {
    setIsTogglingSurvey(corretor.user_id);
    try {
      const newValue = !corretor.survey_enabled;
      
      const { error } = await supabase
        .from('user_feature_flags')
        .upsert({
          user_id: corretor.user_id,
          feature_key: 'post_visit_survey',
          enabled: newValue,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,feature_key',
        });

      if (error) throw error;

      toast.success(
        newValue
          ? 'Pesquisa Pós-Visita habilitada!'
          : 'Pesquisa Pós-Visita desabilitada!'
      );
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao alterar feature');
    } finally {
      setIsTogglingSurvey(null);
    }
  };

  const handleAssignPlano = async () => {
    if (!corretorToAssign || !selectedPlanoId) {
      toast.error("Selecione um plano");
      return;
    }

    setIsAssigningPlano(true);
    try {
      // Check if subscription already exists
      const { data: existing } = await supabase
        .from("assinaturas")
        .select("id")
        .eq("user_id", corretorToAssign.user_id)
        .maybeSingle();

      if (existing) {
        // UPDATE existing subscription
        const { error } = await supabase
          .from("assinaturas")
          .update({
            plano_id: selectedPlanoId,
            status: "ativa",
            data_inicio: new Date().toISOString().split("T")[0],
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // INSERT new subscription
        const { error } = await supabase
          .from("assinaturas")
          .insert({
            user_id: corretorToAssign.user_id,
            plano_id: selectedPlanoId,
            status: "ativa",
            data_inicio: new Date().toISOString().split("T")[0],
          });

        if (error) throw error;
      }

      toast.success("Plano vinculado com sucesso!");
      setIsPlanoDialogOpen(false);
      setCorretorToAssign(null);
      setSelectedPlanoId("");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao vincular plano");
    } finally {
      setIsAssigningPlano(false);
    }
  };

  const handleCreateAutonomo = async () => {
    if (!newCorretor.nome || !newCorretor.email || !newCorretor.senha) {
      toast.error("Nome, email e senha são obrigatórios");
      return;
    }

    if (newCorretor.senha.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsCreating(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("admin-create-corretor", {
        body: {
          nome: newCorretor.nome,
          email: newCorretor.email,
          senha: newCorretor.senha,
          telefone: newCorretor.telefone || undefined,
          creci: newCorretor.creci || undefined,
          autonomo: true,
        },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (response.error || response.data?.error) {
        throw new Error(response.data?.error || response.error?.message || "Erro ao criar corretor");
      }

      toast.success("Corretor autônomo criado com sucesso!");
      setIsCreateDialogOpen(false);
      setNewCorretor({ nome: "", email: "", senha: "", telefone: "", creci: "" });
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar corretor");
    } finally {
      setIsCreating(false);
    }
  };

  const renderDropdownMenu = (corretor: CorretorAutonomo, onClick?: (e: React.MouseEvent) => void) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={onClick}>
        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover">
        <DropdownMenuItem onClick={() => openPlanoDialog(corretor)}>
          <CreditCard className="h-4 w-4 mr-2" />
          {corretor.assinatura ? "Alterar Plano" : "Vincular Plano"}
        </DropdownMenuItem>
        {corretor.assinatura && (
          <DropdownMenuItem 
            onClick={() => handleToggleAssinatura(corretor)}
            disabled={isTogglingStatus === corretor.user_id}
          >
            <Power className="h-4 w-4 mr-2" />
            {corretor.assinatura.status === "ativa" ? "Desativar Assinatura" : "Ativar Assinatura"}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => openLinkDialog(corretor)}>
          <LinkIcon className="h-4 w-4 mr-2" />
          Vincular a Imobiliária
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {
          setCorretorToReset(corretor);
          setIsResetDialogOpen(true);
        }}>
          <KeyRound className="h-4 w-4 mr-2" />
          Redefinir Senha
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="text-destructive"
          onClick={() => {
            setCorretorToDelete(corretor);
            setIsDeleteDialogOpen(true);
          }}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const getAssinaturaBadge = (corretor: CorretorAutonomo) => {
    if (!corretor.assinatura) {
      return (
        <Badge variant="outline" className="text-muted-foreground flex-shrink-0">
          Sem plano
        </Badge>
      );
    }
    return (
      <Badge 
        variant={corretor.assinatura.status === "ativa" ? "default" : "secondary"}
        className={`flex-shrink-0 ${corretor.assinatura.status === "ativa" ? "bg-green-600" : ""}`}
      >
        {corretor.assinatura.status === "ativa" ? "Ativa" : "Suspensa"}
      </Badge>
    );
  };

  return (<div className="space-y-6">
        {/* Responsive Header */}
        <AnimatedContent>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Corretores Autônomos</h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Corretores sem vínculo com imobiliária
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="outline" className="text-sm md:text-lg px-3 md:px-4 py-1 md:py-2 bg-amber-500/10 text-amber-600 border-amber-500/30">
                <UserCircle className="h-4 md:h-5 w-4 md:w-5 mr-2" />
                {corretores?.length || 0} autônomos
              </Badge>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full md:w-auto">
                <UserPlus className="h-4 w-4 mr-2" />
                Novo Corretor
              </Button>
            </div>
          </div>
        </AnimatedContent>

        {/* Search Card */}
        <AnimatedContent delay={0.1}>
          <Card>
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-base md:text-lg">Buscar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>
        </AnimatedContent>

        {/* Mobile Skeleton */}
        {isLoading && (
          <div className="space-y-3 md:hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Desktop Skeleton */}
        {isLoading && (
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Corretor</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Assinatura</TableHead>
                    <TableHead className="text-center">Pesquisa</TableHead>
                    <TableHead className="text-center">Fichas</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
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
                      <TableCell>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-36" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-6 w-16 mx-auto rounded" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Mobile Cards View */}
        {!isLoading && (
          <AnimatedList className="space-y-3 md:hidden">
            {filteredCorretores?.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhum corretor autônomo encontrado
                </CardContent>
              </Card>
            ) : (
              filteredCorretores?.map((corretor) => (
                <AnimatedItem key={corretor.id}>
                  <Card 
                    className="cursor-pointer transition-all hover:shadow-md active:bg-muted/30"
                    onClick={() => navigate(`/admin/autonomos/${corretor.user_id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                          <UserCircle className="h-5 w-5 text-amber-600" />
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold truncate">
                              {corretor.profile?.nome || "Sem nome"}
                            </p>
                            {getAssinaturaBadge(corretor)}
                          </div>
                          
                          {/* CRECI */}
                          {corretor.profile?.creci && (
                            <p className="text-xs text-muted-foreground">
                              CRECI: {corretor.profile.creci}
                            </p>
                          )}
                          
                          {/* Plano */}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CreditCard className="h-3 w-3" />
                            <span>{corretor.assinatura?.plano_nome || "Nenhum plano"}</span>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        {renderDropdownMenu(corretor, (e) => e.stopPropagation())}
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedItem>
              ))
            )}
          </AnimatedList>
        )}

        {/* Desktop Table View */}
        {!isLoading && (
          <AnimatedContent delay={0.2} className="hidden md:block">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Corretor</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Assinatura</TableHead>
                      <TableHead className="text-center">Pesquisa</TableHead>
                      <TableHead className="text-center">Fichas</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCorretores?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Nenhum corretor autônomo encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCorretores?.map((corretor) => (
                        <TableRow key={corretor.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                                <UserCircle className="h-5 w-5 text-amber-600" />
                              </div>
                              <div>
                                <button
                                  onClick={() => navigate(`/admin/autonomos/${corretor.user_id}`)}
                                  className="font-medium hover:underline hover:text-primary text-left"
                                >
                                  {corretor.profile?.nome || "Sem nome"}
                                </button>
                                {corretor.profile?.creci && (
                                  <p className="text-xs text-muted-foreground">CRECI: {corretor.profile.creci}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{corretor.email || "-"}</p>
                            <p className="text-xs text-muted-foreground">{corretor.profile?.telefone || "-"}</p>
                          </TableCell>
                          <TableCell>
                            {corretor.assinatura ? (
                              <Badge 
                                variant={corretor.assinatura.status === "ativa" ? "default" : "secondary"}
                                className={corretor.assinatura.status === "ativa" ? "bg-green-600" : ""}
                              >
                                {corretor.assinatura.status === "ativa" ? "✓" : "⏳"} {corretor.assinatura.plano_nome}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                Sem plano
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <button
                              onClick={() => handleToggleSurvey(corretor)}
                              disabled={isTogglingSurvey === corretor.user_id}
                              className={`inline-flex items-center justify-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                                corretor.survey_enabled
                                  ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                              } ${isTogglingSurvey === corretor.user_id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <ClipboardList className="h-3 w-3" />
                              {isTogglingSurvey === corretor.user_id ? '...' : corretor.survey_enabled ? 'Ativa' : 'Inativa'}
                            </button>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-1">
                              <Badge variant="secondary" className="gap-1">
                                <FileText className="h-3 w-3" />
                                {corretor.stats.fichas}
                              </Badge>
                              {corretor.stats.fichasConfirmadas > 0 && (
                                <span className="text-xs text-green-600">
                                  {corretor.stats.fichasConfirmadas} confirmada(s)
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(corretor.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          </TableCell>
                          <TableCell className="text-right">
                            {renderDropdownMenu(corretor)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </AnimatedContent>
        )}
      </div>

      {/* Link to Imobiliaria Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular a Imobiliária</DialogTitle>
            <DialogDescription>
              Vincule o corretor <strong>{corretorToLink?.profile?.nome}</strong> a uma imobiliária.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Selecione a Imobiliária</Label>
              <Select value={selectedImobiliariaId} onValueChange={setSelectedImobiliariaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha uma imobiliária" />
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
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="backfill" 
                checked={backfillFichas}
                onCheckedChange={(checked) => setBackfillFichas(checked as boolean)}
              />
              <Label htmlFor="backfill" className="text-sm font-normal">
                Vincular fichas existentes à imobiliária selecionada
              </Label>
            </div>
            
            {corretorToLink && corretorToLink.stats.fichas > 0 && (
              <p className="text-sm text-muted-foreground">
                Este corretor possui {corretorToLink.stats.fichas} ficha(s) que podem ser vinculadas.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleLinkToImobiliaria} disabled={isLinking || !selectedImobiliariaId}>
              {isLinking ? "Vinculando..." : "Vincular"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
            <DialogDescription>
              Escolha como redefinir a senha de <strong>{corretorToReset?.profile?.nome}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Ação</Label>
              <Select value={resetAction} onValueChange={(v) => setResetAction(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="send_reset_email">Enviar email de recuperação</SelectItem>
                  <SelectItem value="set_password">Definir nova senha manualmente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {resetAction === "set_password" && (
              <div className="space-y-2">
                <Label>Nova Senha</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o corretor <strong>{corretorToDelete?.profile?.nome}</strong>?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Autonomous Corretor Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Corretor Autônomo</DialogTitle>
            <DialogDescription>
              Crie um corretor sem vínculo com imobiliária
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={newCorretor.nome}
                onChange={(e) => setNewCorretor({ ...newCorretor, nome: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={newCorretor.email}
                onChange={(e) => setNewCorretor({ ...newCorretor, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Senha *</Label>
              <Input
                type="password"
                value={newCorretor.senha}
                onChange={(e) => setNewCorretor({ ...newCorretor, senha: e.target.value })}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={newCorretor.telefone}
                  onChange={(e) => setNewCorretor({ ...newCorretor, telefone: formatPhone(e.target.value) })}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>
              <div className="space-y-2">
                <Label>CRECI</Label>
                <Input
                  value={newCorretor.creci}
                  onChange={(e) => setNewCorretor({ ...newCorretor, creci: e.target.value })}
                  placeholder="CRECI"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateAutonomo} disabled={isCreating}>
              {isCreating ? "Criando..." : "Criar Corretor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Plan Dialog */}
      <Dialog open={isPlanoDialogOpen} onOpenChange={setIsPlanoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {corretorToAssign?.assinatura ? "Alterar Plano" : "Vincular Plano"}
            </DialogTitle>
            <DialogDescription>
              {corretorToAssign?.assinatura 
                ? `Altere o plano do corretor ${corretorToAssign?.profile?.nome}. Plano atual: ${corretorToAssign.assinatura.plano_nome}`
                : `Vincule o corretor ${corretorToAssign?.profile?.nome} a um plano de assinatura individual.`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Selecione o Plano</Label>
              <Select value={selectedPlanoId} onValueChange={setSelectedPlanoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um plano" />
                </SelectTrigger>
                <SelectContent>
                  {planosIndividuais?.map((plano) => (
                    <SelectItem key={plano.id} value={plano.id}>
                      {plano.nome} - R$ {plano.valor_mensal.toFixed(2).replace(".", ",")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(!planosIndividuais || planosIndividuais.length === 0) && (
              <p className="text-sm text-muted-foreground">
                Nenhum plano individual disponível. Crie um plano com max_corretores = 1.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPlanoDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAssignPlano} 
              disabled={isAssigningPlano || !selectedPlanoId}
            >
              {isAssigningPlano ? "Vinculando..." : "Vincular Plano"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>);
}
