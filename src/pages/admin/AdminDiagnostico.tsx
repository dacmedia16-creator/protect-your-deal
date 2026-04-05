import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { SuperAdminLayout } from "@/components/layouts/SuperAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  CheckCircle,
  CreditCard,
  Database,
  ExternalLink,
  Info,
  Loader2,
  Play,
  RefreshCw,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User,
  UserPlus,
  Webhook,
  Wrench,
  XCircle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Link } from "react-router-dom";

interface DiagnosticResult {
  name: string;
  status: "success" | "error" | "pending" | "info";
  message: string;
  details?: string;
}

interface UserDiagnostics {
  userId: string;
  email: string;
  hookRole: string | null;
  hookImobiliariaId: string | null;
  dbRole: string | null;
  dbImobiliariaId: string | null;
  profileExists: boolean;
  profileImobiliariaId: string | null;
  tests: DiagnosticResult[];
}

interface SystemAlert {
  id: string;
  type: "error" | "warning" | "info";
  title: string;
  description: string;
  affectedItems: number;
  actionLabel?: string;
  actionHref?: string;
  fixable?: boolean;
  fixOperation?: string;
  fixLabel?: string;
}

type HookInfo = { role: string | null; imobiliariaId: string | null };

type ImobiliariaOption = {
  id: string;
  nome: string;
};

// Asaas webhook test types
interface WebhookConfig {
  asaas_api_key_configured: boolean;
  asaas_api_key_prefix: string | null;
  sandbox_mode: boolean;
  webhook_url: string;
}

interface WebhookLog {
  id: string;
  source: string;
  event_type: string;
  payload: Record<string, unknown>;
  processed: boolean;
  error_message: string | null;
  created_at: string;
}

interface WebhookStats {
  total: number;
  processed: number;
  failed: number;
  by_event_type: Record<string, number>;
  last_event_at: string | null;
}

export default function AdminDiagnostico() {
  const { user } = useAuth();
  const { role, imobiliariaId, loading: roleLoading, refetch } = useUserRole();
  const { toast } = useToast();

  const [searchEmail, setSearchEmail] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentUserDiag, setCurrentUserDiag] = useState<UserDiagnostics | null>(null);
  const [searchedUserDiag, setSearchedUserDiag] = useState<UserDiagnostics | null>(null);
  const [isRunningCurrentTests, setIsRunningCurrentTests] = useState(false);

  const [selectedImobiliariaId, setSelectedImobiliariaId] = useState<string>("");
  const [backfillFichas, setBackfillFichas] = useState<boolean>(true);

  // System alerts state
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [isCheckingSystem, setIsCheckingSystem] = useState(false);
  const [fixingOperation, setFixingOperation] = useState<string | null>(null);

  // Asaas webhook test state
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig | null>(null);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [webhookStats, setWebhookStats] = useState<WebhookStats | null>(null);
  const [isLoadingWebhook, setIsLoadingWebhook] = useState(false);
  const [webhookAction, setWebhookAction] = useState<string | null>(null);

  const normalizedSearchEmail = useMemo(
    () => searchEmail.trim().toLowerCase(),
    [searchEmail]
  );

  const { data: imobiliarias, isLoading: loadingImobiliarias } = useQuery({
    queryKey: ["imobiliarias-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("imobiliarias")
        .select("id, nome")
        .eq("status", "ativo")
        .order("nome");

      if (error) throw error;
      return (data ?? []) as ImobiliariaOption[];
    },
  });

  const linkUserMutation = useMutation({
    mutationFn: async (payload: {
      userId: string;
      imobiliariaId: string;
      backfillFichas: boolean;
    }) => {
      const { data, error } = await supabase.functions.invoke("admin-vincular-usuario", {
        body: {
          user_id: payload.userId,
          imobiliaria_id: payload.imobiliariaId,
          backfill_fichas: payload.backfillFichas,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data as { success: true };
    },
    onSuccess: async (_, variables) => {
      toast({
        title: "Usuário vinculado",
        description: "Vínculo aplicado com sucesso.",
      });

      // Recarrega os diagnósticos do usuário pesquisado
      const refreshed = await runFullDiagnostics(variables.userId, searchedUserDiag?.email || "", null);
      setSearchedUserDiag(refreshed);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao vincular",
        description: error?.message ?? "Não foi possível vincular o usuário.",
      });
    },
  });

  // Run diagnostics for current user and system alerts on mount
  useEffect(() => {
    if (user && !roleLoading) {
      runDiagnosticsForCurrentUser();
      checkSystemInconsistencies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, roleLoading]);

  // Fix inconsistency mutation
  const fixInconsistencyMutation = useMutation({
    mutationFn: async (operation: string) => {
      setFixingOperation(operation);
      const { data, error } = await supabase.functions.invoke("admin-fix-inconsistencies", {
        body: { operation },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data as { success: boolean; message: string; affectedCount: number };
    },
    onSuccess: (data) => {
      toast({
        title: "Correção aplicada",
        description: data.message,
      });
      checkSystemInconsistencies();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao corrigir",
        description: error?.message ?? "Não foi possível aplicar a correção.",
      });
    },
    onSettled: () => {
      setFixingOperation(null);
    },
  });

  // Asaas webhook test functions
  const invokeWebhookTest = async (action: string) => {
    setIsLoadingWebhook(true);
    setWebhookAction(action);
    try {
      const { data, error } = await supabase.functions.invoke('asaas-webhook-test', {
        body: { action }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no teste de webhook",
        description: error?.message ?? "Erro desconhecido",
      });
      return null;
    } finally {
      setIsLoadingWebhook(false);
      setWebhookAction(null);
    }
  };

  const checkWebhookConfig = async () => {
    const data = await invokeWebhookTest('check-config');
    if (data?.success) {
      setWebhookConfig(data.config);
      toast({ title: "Configuração verificada", description: "Veja os detalhes abaixo." });
    }
  };

  const loadWebhookLogs = async () => {
    const data = await invokeWebhookTest('list-logs');
    if (data?.success) {
      setWebhookLogs(data.logs || []);
      toast({ title: "Logs carregados", description: `${data.count} evento(s) encontrado(s).` });
    }
  };

  const loadWebhookStats = async () => {
    const data = await invokeWebhookTest('stats');
    if (data?.success) {
      setWebhookStats(data.stats);
      toast({ title: "Estatísticas carregadas" });
    }
  };

  const simulatePayment = async () => {
    const data = await invokeWebhookTest('simulate-payment');
    if (data?.success) {
      toast({ title: "Evento simulado", description: data.message });
      await loadWebhookLogs();
    }
  };

  const clearOldLogs = async () => {
    const data = await invokeWebhookTest('clear-old-logs');
    if (data?.success) {
      toast({ title: "Logs limpos", description: `${data.deleted_count} log(s) removido(s).` });
      await loadWebhookLogs();
      await loadWebhookStats();
    }
  };

  // Check for system-wide inconsistencies
  const checkSystemInconsistencies = async () => {
    setIsCheckingSystem(true);
    const alerts: SystemAlert[] = [];

    try {
      // 1. Corretores/admins sem imobiliária
      const { count: corretoresSemImob } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .in("role", ["corretor", "imobiliaria_admin"])
        .is("imobiliaria_id", null);

      if (corretoresSemImob && corretoresSemImob > 0) {
        alerts.push({
          id: "corretor_sem_imobiliaria",
          type: "warning",
          title: "Corretores/Admins sem imobiliária",
          description: `${corretoresSemImob} usuário(s) com role corretor ou imobiliaria_admin não estão vinculados a nenhuma imobiliária.`,
          affectedItems: corretoresSemImob,
          actionLabel: "Ver corretores autônomos",
          actionHref: "/admin/autonomos",
          fixable: false, // Requires manual action to choose imobiliaria
        });
      }

      // 2. Super admins com imobiliária (incorreto)
      const { count: superAdminComImob } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "super_admin")
        .not("imobiliaria_id", "is", null);

      if (superAdminComImob && superAdminComImob > 0) {
        alerts.push({
          id: "super_admin_com_imobiliaria",
          type: "error",
          title: "Super admin com imobiliária vinculada",
          description: `${superAdminComImob} super admin(s) possuem imobiliaria_id preenchido, o que é incorreto.`,
          affectedItems: superAdminComImob,
          actionLabel: "Ver usuários",
          actionHref: "/admin/usuarios",
          fixable: true,
          fixOperation: "remove_super_admin_imobiliaria",
          fixLabel: "Remover vínculo",
        });
      }

      // 3. Fichas sem imobiliaria_id
      const { count: fichasSemImob } = await supabase
        .from("fichas_visita")
        .select("*", { count: "exact", head: true })
        .is("imobiliaria_id", null);

      if (fichasSemImob && fichasSemImob > 0) {
        alerts.push({
          id: "fichas_sem_imobiliaria",
          type: "warning",
          title: "Fichas órfãs",
          description: `${fichasSemImob} ficha(s) de visita não possuem imobiliaria_id, ficando invisíveis para admins de imobiliária.`,
          affectedItems: fichasSemImob,
          fixable: true,
          fixOperation: "backfill_orphan_fichas",
          fixLabel: "Corrigir fichas órfãs",
        });
      }

      // 4. Perfis com imobiliaria_id divergente de user_roles
      // Consulta profiles com imobiliaria_id preenchido
      const { data: profilesWithImob } = await supabase
        .from("profiles")
        .select("user_id, imobiliaria_id")
        .not("imobiliaria_id", "is", null);

      let divergencias = 0;
      if (profilesWithImob && profilesWithImob.length > 0) {
        for (const profile of profilesWithImob) {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("imobiliaria_id")
            .eq("user_id", profile.user_id)
            .maybeSingle();

          if (roleData && roleData.imobiliaria_id !== profile.imobiliaria_id) {
            divergencias++;
          }
        }
      }

      if (divergencias > 0) {
        alerts.push({
          id: "perfil_divergente",
          type: "error",
          title: "Divergência profile vs user_roles",
          description: `${divergencias} usuário(s) possuem imobiliaria_id diferente entre profiles e user_roles.`,
          affectedItems: divergencias,
          fixable: true,
          fixOperation: "sync_profiles",
          fixLabel: "Sincronizar perfis",
        });
      }

      // 5. Imobiliárias inativas com usuários ativos
      const { data: imobsInativas } = await supabase
        .from("imobiliarias")
        .select("id, nome")
        .eq("status", "inativo");

      if (imobsInativas && imobsInativas.length > 0) {
        let usuariosEmImobInativa = 0;
        for (const imob of imobsInativas) {
          const { count } = await supabase
            .from("user_roles")
            .select("*", { count: "exact", head: true })
            .eq("imobiliaria_id", imob.id);
          
          if (count && count > 0) {
            usuariosEmImobInativa += count;
          }
        }

        if (usuariosEmImobInativa > 0) {
          alerts.push({
            id: "imobiliaria_inativa_com_usuarios",
            type: "warning",
            title: "Imobiliárias inativas com usuários",
            description: `${usuariosEmImobInativa} usuário(s) estão vinculados a imobiliárias inativas.`,
            affectedItems: usuariosEmImobInativa,
            actionLabel: "Ver imobiliárias",
            actionHref: "/admin/imobiliarias",
            fixable: false, // Requires manual decision
          });
        }
      }

      // 6. Usuários com role mas sem perfil
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("user_id");

      if (rolesData && rolesData.length > 0) {
        let semPerfil = 0;
        for (const roleEntry of rolesData) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", roleEntry.user_id)
            .maybeSingle();

          if (!profileData) {
            semPerfil++;
          }
        }

        if (semPerfil > 0) {
          alerts.push({
            id: "usuario_sem_perfil",
            type: "error",
            title: "Usuários sem perfil",
            description: `${semPerfil} usuário(s) possuem role mas não têm registro na tabela profiles.`,
            affectedItems: semPerfil,
            fixable: true,
            fixOperation: "create_missing_profiles",
            fixLabel: "Criar perfis faltantes",
          });
        }
      }

    } catch (error) {
      console.error("Error checking system inconsistencies:", error);
    } finally {
      setSystemAlerts(alerts);
      setIsCheckingSystem(false);
    }
  };

  const runDiagnosticsForCurrentUser = async () => {
    if (!user) return;

    setIsRunningCurrentTests(true);
    try {
      const diagnostics = await runFullDiagnostics(user.id, user.email || "", {
        role,
        imobiliariaId,
      });
      setCurrentUserDiag(diagnostics);
    } catch (error) {
      console.error("Error running diagnostics:", error);
    } finally {
      setIsRunningCurrentTests(false);
    }
  };

  const runFullDiagnostics = async (
    userId: string,
    email: string,
    hookInfo: HookInfo | null
  ): Promise<UserDiagnostics> => {
    const tests: DiagnosticResult[] = [];

    // 1. Get role from user_roles table
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role, imobiliaria_id")
      .eq("user_id", userId)
      .maybeSingle();

    // 2. Get imobiliaria_id from backend function
    const { data: dbImobiliariaId, error: dbImobiliariaError } = await supabase.rpc(
      "get_user_imobiliaria",
      { _user_id: userId }
    );

    // 3. Check profile
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, imobiliaria_id")
      .eq("user_id", userId)
      .maybeSingle();

    const isSuperAdmin = roleData?.role === 'super_admin';

    // Test 1: Role exists
    tests.push({
      name: "Verificar role na tabela user_roles",
      status: roleData?.role ? "success" : "error",
      message: roleData?.role ? `Role: ${roleData.role}` : "Nenhum role encontrado",
      details: roleError?.message,
    });

    // Test 2: Imobiliaria linked via get_user_imobiliaria
    // Para super_admin, não ter imobiliaria_id é ESPERADO
    tests.push({
      name: "Verificar imobiliaria_id via get_user_imobiliaria()",
      status: isSuperAdmin 
        ? "info"
        : (dbImobiliariaId ? "success" : "error"),
      message: isSuperAdmin
        ? "N/A - Super admins não são vinculados a imobiliárias"
        : (dbImobiliariaId ? `ID: ${dbImobiliariaId}` : "Não vinculado a nenhuma imobiliária"),
      details: dbImobiliariaError?.message,
    });

    // Test 3: Profile exists
    tests.push({
      name: "Verificar perfil (profiles)",
      status: profileData ? "success" : "error",
      message: profileData ? "Perfil existe" : "Perfil não encontrado",
      details: profileError?.message,
    });

    // Test 4: Try to list fichas (SELECT permission)
    const { data: fichasData, error: fichasError } = await supabase
      .from("fichas_visita")
      .select("id")
      .limit(1);

    tests.push({
      name: "Permissão: Listar fichas (SELECT)",
      status: !fichasError ? "success" : "error",
      message: !fichasError
        ? `Acesso permitido (${fichasData?.length || 0} resultados)`
        : "Acesso negado",
      details: fichasError?.message,
    });

    // Test 5: Check if can theoretically insert (based on role and imobiliaria)
    // Super admins não criam fichas - não é erro
    const canInsert = !!(roleData?.role && dbImobiliariaId);
    tests.push({
      name: "Permissão: Criar ficha (INSERT - verificação)",
      status: isSuperAdmin 
        ? "info"
        : (canInsert ? "success" : "error"),
      message: isSuperAdmin
        ? "N/A - Super admins gerenciam, não criam fichas"
        : (canInsert 
            ? "Pré-requisitos atendidos (role + imobiliaria_id)" 
            : "Falta role ou imobiliaria_id para criar fichas"),
      details: (!canInsert && !isSuperAdmin)
        ? "A política RLS exige user_id = auth.uid() E imobiliaria_id = get_user_imobiliaria(auth.uid())"
        : undefined,
    });

    // Test 6: Consistency check between user_roles.imobiliaria_id and get_user_imobiliaria
    // Para super_admin, ambos null é consistente e esperado
    const bothNull = roleData?.imobiliaria_id === null && dbImobiliariaId === null;
    const isConsistent = roleData?.imobiliaria_id === dbImobiliariaId;
    tests.push({
      name: "Consistência: user_roles.imobiliaria_id vs get_user_imobiliaria()",
      status: isConsistent 
        ? (isSuperAdmin && bothNull ? "info" : "success") 
        : "error",
      message: isConsistent 
        ? (isSuperAdmin && bothNull ? "Consistente (ambos null, esperado para super_admin)" : "Valores consistentes")
        : "DIVERGÊNCIA DETECTADA!",
      details: !isConsistent
        ? `user_roles: ${roleData?.imobiliaria_id || "null"} | função: ${dbImobiliariaId || "null"}`
        : undefined,
    });

    return {
      userId,
      email,
      hookRole: hookInfo?.role ?? null,
      hookImobiliariaId: hookInfo?.imobiliariaId ?? null,
      dbRole: roleData?.role || null,
      dbImobiliariaId: dbImobiliariaId || null,
      profileExists: !!profileData,
      profileImobiliariaId: profileData?.imobiliaria_id || null,
      tests,
    };
  };

  const searchUser = async () => {
    if (!normalizedSearchEmail) {
      toast({
        variant: "destructive",
        title: "Digite um email",
        description: "Informe o email do usuário para pesquisar",
      });
      return;
    }

    setIsSearching(true);
    setSearchedUserDiag(null);
    setSelectedImobiliariaId("");

    try {
      const { data: usersData, error: usersError } = await supabase.functions.invoke(
        "admin-list-users"
      );

      if (usersError) throw usersError;

      const foundUser = usersData?.users?.find(
        (u: any) => u.email?.toLowerCase() === normalizedSearchEmail
      );

      if (!foundUser) {
        toast({
          variant: "destructive",
          title: "Usuário não encontrado",
          description: `Nenhum usuário com email "${normalizedSearchEmail}" foi encontrado`,
        });
        return;
      }

      const diagnostics = await runFullDiagnostics(foundUser.id, foundUser.email, null);
      setSearchedUserDiag(diagnostics);
    } catch (error: any) {
      console.error("Error searching user:", error);
      toast({
        variant: "destructive",
        title: "Erro ao pesquisar",
        description: error?.message ?? "Não foi possível pesquisar o usuário.",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const DiagnosticsCard = ({
    diag,
    title,
    showHookInfo,
  }: {
    diag: UserDiagnostics;
    title: string;
    showHookInfo: boolean;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{diag.email}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Info Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">User ID</p>
            <p className="font-mono text-xs break-all">{diag.userId}</p>
          </div>

          {showHookInfo && (
            <>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Role (hook)</p>
                <Badge variant={diag.hookRole ? "default" : "destructive"}>
                  {diag.hookRole || "null"}
                </Badge>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Imobiliária ID (hook)</p>
                <p className="font-mono text-xs break-all">{diag.hookImobiliariaId || "null"}</p>
              </div>
            </>
          )}

          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Role (DB)</p>
            <Badge variant={diag.dbRole ? "default" : "destructive"}>{diag.dbRole || "null"}</Badge>
          </div>

          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Imobiliária ID (DB)</p>
            <p className="font-mono text-xs break-all">{diag.dbImobiliariaId || "null"}</p>
          </div>

          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Perfil</p>
            <Badge variant={diag.profileExists ? "default" : "destructive"}>
              {diag.profileExists ? "Existe" : "Não existe"}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Test Results */}
        <div>
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <Database className="h-4 w-4" />
            Testes de Permissão
          </h4>
          <div className="space-y-3">
            {diag.tests.map((test, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  test.status === "success"
                    ? "bg-green-500/10 border-green-500/30"
                    : test.status === "error"
                      ? "bg-destructive/10 border-destructive/30"
                      : test.status === "info"
                        ? "bg-blue-500/10 border-blue-500/30"
                        : "bg-muted/50 border-border"
                }`}
              >
                <div className="flex items-start gap-3">
                  {test.status === "success" ? (
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  ) : test.status === "error" ? (
                    <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  ) : test.status === "info" ? (
                    <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                  ) : (
                    <Loader2 className="h-5 w-5 animate-spin shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{test.name}</p>
                    <p className="text-sm text-muted-foreground">{test.message}</p>
                    {test.details && (
                      <p className="text-xs text-destructive mt-1 font-mono">{test.details}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const canLinkSearchedUser = useMemo(() => {
    if (!searchedUserDiag) return false;
    if (searchedUserDiag.dbRole === "super_admin") return false;
    return true;
  }, [searchedUserDiag]);

  // System Alerts Section Component
  const SystemAlertsSection = () => {
    const errorCount = systemAlerts.filter((a) => a.type === "error").length;
    const warningCount = systemAlerts.filter((a) => a.type === "warning").length;
    const hasAlerts = systemAlerts.length > 0;

    const cardClasses = hasAlerts
      ? errorCount > 0
        ? "border-destructive/50 bg-destructive/5"
        : "border-amber-500/50 bg-amber-500/5"
      : "border-green-500/50 bg-green-500/5";

    const iconClasses = hasAlerts
      ? errorCount > 0
        ? "text-destructive"
        : "text-amber-500"
      : "text-green-500";

    return (
      <Card className={cardClasses}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {hasAlerts ? (
                <ShieldAlert className={`h-5 w-5 ${iconClasses}`} />
              ) : (
                <ShieldCheck className="h-5 w-5 text-green-500" />
              )}
              Alertas do Sistema
            </CardTitle>
            <div className="flex items-center gap-2">
              {hasAlerts && (
                <div className="flex gap-2">
                  {errorCount > 0 && (
                    <Badge variant="destructive">{errorCount} erro(s)</Badge>
                  )}
                  {warningCount > 0 && (
                    <Badge className="bg-amber-500 text-white hover:bg-amber-600">
                      {warningCount} aviso(s)
                    </Badge>
                  )}
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={checkSystemInconsistencies}
                disabled={isCheckingSystem}
              >
                {isCheckingSystem ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <CardDescription>
            {hasAlerts
              ? "Foram detectadas inconsistências que requerem atenção"
              : "Nenhuma inconsistência detectada no sistema"}
          </CardDescription>
        </CardHeader>
        {hasAlerts && (
          <CardContent className="space-y-3">
            {systemAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${
                  alert.type === "error"
                    ? "bg-destructive/10 border-destructive/30"
                    : alert.type === "warning"
                      ? "bg-amber-500/10 border-amber-500/30"
                      : "bg-blue-500/10 border-blue-500/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  {alert.type === "error" ? (
                    <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  ) : alert.type === "warning" ? (
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{alert.title}</p>
                      <Badge variant="outline" className="text-xs">
                        {alert.affectedItems} item(ns)
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {alert.actionHref && (
                        <Link
                          to={alert.actionHref}
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          {alert.actionLabel || "Ver detalhes"}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                      {alert.fixable && alert.fixOperation && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={fixingOperation !== null}
                            >
                              {fixingOperation === alert.fixOperation ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                <Wrench className="h-4 w-4 mr-1" />
                              )}
                              {alert.fixLabel || "Corrigir"}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar correção</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação irá corrigir {alert.affectedItems} item(ns). 
                                <br />
                                <strong>{alert.title}</strong>: {alert.description}
                                <br /><br />
                                Deseja continuar?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => fixInconsistencyMutation.mutate(alert.fixOperation!)}
                              >
                                Confirmar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    );
  };

  return (<div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Diagnóstico de Usuário
            </h1>
            <p className="text-muted-foreground">
              Verifique roles, permissões e configurações de usuários
            </p>
          </div>
          <Button
            variant="outline"
            onClick={async () => {
              await refetch();
              runDiagnosticsForCurrentUser();
              checkSystemInconsistencies();
            }}
            disabled={isRunningCurrentTests || isCheckingSystem}
          >
            {isRunningCurrentTests || isCheckingSystem ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Atualizar
          </Button>
        </div>

        {/* System Alerts */}
        <SystemAlertsSection />

        {/* Asaas Webhook Test Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5 text-green-600" />
                Diagnóstico Webhook Asaas
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                Pagamentos
              </Badge>
            </div>
            <CardDescription>
              Verifique se o webhook de pagamentos está funcionando corretamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={checkWebhookConfig}
                disabled={isLoadingWebhook}
              >
                {webhookAction === 'check-config' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Settings className="h-4 w-4 mr-2" />
                )}
                Verificar Configuração
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadWebhookLogs}
                disabled={isLoadingWebhook}
              >
                {webhookAction === 'list-logs' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                Ver Logs
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadWebhookStats}
                disabled={isLoadingWebhook}
              >
                {webhookAction === 'stats' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                Estatísticas
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={simulatePayment}
                disabled={isLoadingWebhook}
              >
                {webhookAction === 'simulate-payment' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Simular Pagamento
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isLoadingWebhook}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Logs Antigos
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Limpar logs antigos?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação irá remover todos os logs de webhook com mais de 30 dias.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={clearOldLogs}>
                      Confirmar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Config Display */}
            {webhookConfig && (
              <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Configuração Atual
                </h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    {webhookConfig.asaas_api_key_configured ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span>
                      API Key: {webhookConfig.asaas_api_key_configured 
                        ? webhookConfig.asaas_api_key_prefix 
                        : 'Não configurada'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-500" />
                    <span>Modo: {webhookConfig.sandbox_mode ? 'Sandbox' : 'Produção'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-xs break-all">{webhookConfig.webhook_url}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Display */}
            {webhookStats && (
              <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Estatísticas
                </h4>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="text-center p-3 rounded bg-background">
                    <p className="text-2xl font-bold">{webhookStats.total}</p>
                    <p className="text-xs text-muted-foreground">Total de eventos</p>
                  </div>
                  <div className="text-center p-3 rounded bg-green-500/10">
                    <p className="text-2xl font-bold text-green-600">{webhookStats.processed}</p>
                    <p className="text-xs text-muted-foreground">Processados</p>
                  </div>
                  <div className="text-center p-3 rounded bg-destructive/10">
                    <p className="text-2xl font-bold text-destructive">{webhookStats.failed}</p>
                    <p className="text-xs text-muted-foreground">Falharam</p>
                  </div>
                </div>
                {Object.keys(webhookStats.by_event_type).length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Por tipo de evento:</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(webhookStats.by_event_type).map(([event, count]) => (
                        <Badge key={event} variant="outline" className="text-xs">
                          {event}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {webhookStats.last_event_at && (
                  <p className="text-xs text-muted-foreground">
                    Último evento: {new Date(webhookStats.last_event_at).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            )}

            {/* Logs Display */}
            {webhookLogs.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Últimos Logs ({webhookLogs.length})
                </h4>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {webhookLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-3 rounded-lg border text-sm ${
                        log.processed
                          ? 'bg-green-500/5 border-green-500/30'
                          : 'bg-amber-500/5 border-amber-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant={log.processed ? 'default' : 'secondary'} className="text-xs">
                          {log.event_type || 'unknown'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {log.processed ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                        )}
                        <span>{log.processed ? 'Processado' : 'Pendente'}</span>
                        <span className="text-muted-foreground">• {log.source}</span>
                      </div>
                      {log.error_message && (
                        <p className="text-xs text-destructive mt-1">{log.error_message}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!webhookConfig && !webhookStats && webhookLogs.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <Webhook className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Clique em um dos botões acima para começar o diagnóstico</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current User Diagnostics */}
        {isRunningCurrentTests ? (
          <Card>
            <CardContent className="py-12 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Executando diagnósticos...</p>
            </CardContent>
          </Card>
        ) : currentUserDiag ? (
          <DiagnosticsCard diag={currentUserDiag} title="Usuário Atual (Você)" showHookInfo />
        ) : null}

        <Separator />

        {/* Search Other User */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Pesquisar Outro Usuário
            </CardTitle>
            <CardDescription>
              Digite o email de um usuário para ver seus diagnósticos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="searchEmail" className="sr-only">
                  Email
                </Label>
                <Input
                  id="searchEmail"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchUser()}
                />
              </div>
              <Button onClick={searchUser} disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="ml-2 hidden sm:inline">Pesquisar</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Searched User Diagnostics */}
        {searchedUserDiag && (
          <>
            <DiagnosticsCard diag={searchedUserDiag} title="Usuário Pesquisado" showHookInfo={false} />

            {canLinkSearchedUser && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Ação rápida: vincular à imobiliária
                  </CardTitle>
                  <CardDescription>
                    Use isto quando o usuário estiver com <code className="bg-muted px-1 rounded">imobiliaria_id</code> nulo (o que causa erro de RLS ao criar ficha).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Imobiliária</Label>
                      <Select value={selectedImobiliariaId} onValueChange={setSelectedImobiliariaId}>
                        <SelectTrigger disabled={loadingImobiliarias}>
                          <SelectValue placeholder={loadingImobiliarias ? "Carregando..." : "Selecione..."} />
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

                    <div className="space-y-2">
                      <Label>Backfill</Label>
                      <div className="flex items-center gap-2 rounded-md border p-3">
                        <Checkbox
                          id="backfillFichas"
                          checked={backfillFichas}
                          onCheckedChange={(v) => setBackfillFichas(Boolean(v))}
                        />
                        <Label htmlFor="backfillFichas" className="text-sm font-normal">
                          Atualizar fichas antigas deste usuário com <code className="bg-muted px-1 rounded">imobiliaria_id</code> nulo
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Recomendado para não “sumir” fichas em relatórios de admin de imobiliária.
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      if (!selectedImobiliariaId) {
                        toast({
                          variant: "destructive",
                          title: "Selecione uma imobiliária",
                          description: "Escolha uma imobiliária antes de vincular.",
                        });
                        return;
                      }
                      linkUserMutation.mutate({
                        userId: searchedUserDiag.userId,
                        imobiliariaId: selectedImobiliariaId,
                        backfillFichas,
                      });
                    }}
                    disabled={!selectedImobiliariaId || linkUserMutation.isPending}
                  >
                    {linkUserMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    Vincular usuário
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Help Section */}
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              Dicas de Resolução
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <div>
              <strong>Role não encontrado:</strong> O usuário precisa ter um registro na tabela{" "}
              <code className="bg-muted px-1 rounded">user_roles</code> com role válido (corretor, imobiliaria_admin, super_admin).
            </div>
            <div>
              <strong>Imobiliária não vinculada:</strong> O campo{" "}
              <code className="bg-muted px-1 rounded">imobiliaria_id</code> na tabela{" "}
              <code className="bg-muted px-1 rounded">user_roles</code> precisa estar preenchido para corretores e admins de imobiliária.
            </div>
            <div>
              <strong>Erro ao criar ficha:</strong> Verifique se o usuário tem role E imobiliaria_id preenchidos. A política RLS exige ambos.
            </div>
            <div>
              <strong>Divergência detectada:</strong> Os valores de imobiliaria_id devem ser iguais entre{" "}
              <code className="bg-muted px-1 rounded">user_roles.imobiliaria_id</code> e o retorno de{" "}
              <code className="bg-muted px-1 rounded">get_user_imobiliaria()</code>.
            </div>
          </CardContent>
        </Card>
      </div>);
}

