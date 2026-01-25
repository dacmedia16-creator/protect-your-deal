import { useState, useMemo } from "react";
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
import { Search, CreditCard, MoreVertical, Play, Pause, XCircle, Edit, Plus, Building2, User } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface Plano {
  id: string;
  nome: string;
  valor_mensal: number;
}

interface Imobiliaria {
  id: string;
  nome: string;
}

interface UserProfile {
  nome: string;
  user_id: string;
}

interface Assinatura {
  id: string;
  imobiliaria_id: string | null;
  user_id: string | null;
  plano_id: string;
  status: string;
  data_inicio: string;
  data_fim: string | null;
  proxima_cobranca: string | null;
  created_at: string;
  imobiliaria?: Imobiliaria | null;
  plano?: Plano | null;
  user?: UserProfile | null;
}

export default function AdminAssinaturas() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Edit dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [assinaturaToEdit, setAssinaturaToEdit] = useState<Assinatura | null>(null);
  const [editForm, setEditForm] = useState({
    plano_id: "",
    status: "",
    data_inicio: "",
    data_fim: "",
    proxima_cobranca: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  // Create dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    imobiliaria_id: "",
    plano_id: "",
    status: "ativa",
    data_inicio: new Date().toISOString().split("T")[0],
  });
  const [isCreating, setIsCreating] = useState(false);

  // Fetch assinaturas
  const { data: assinaturas, isLoading, refetch } = useQuery({
    queryKey: ["admin-assinaturas"],
    queryFn: async () => {
      // Buscar assinaturas com imobiliárias e planos
      const { data, error } = await supabase
        .from("assinaturas")
        .select(`
          *,
          imobiliarias(id, nome),
          planos!assinaturas_plano_id_fkey(id, nome, valor_mensal)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Para assinaturas com user_id, buscar os profiles
      const userIds = data
        .filter((a: any) => a.user_id && !a.imobiliaria_id)
        .map((a: any) => a.user_id);

      let userProfiles: Record<string, UserProfile> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("nome, user_id")
          .in("user_id", userIds);
        
        if (profiles) {
          userProfiles = profiles.reduce((acc: Record<string, UserProfile>, p: any) => {
            acc[p.user_id] = p;
            return acc;
          }, {});
        }
      }

      return data.map((a: any) => ({
        ...a,
        imobiliaria: a.imobiliarias,
        plano: a.planos,
        user: a.user_id ? userProfiles[a.user_id] || null : null,
      })) as Assinatura[];
    },
  });

  // Fetch planos
  const { data: planos } = useQuery({
    queryKey: ["admin-planos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planos")
        .select("id, nome, valor_mensal")
        .eq("ativo", true)
        .order("valor_mensal");
      if (error) throw error;
      return data as Plano[];
    },
  });

  // Fetch imobiliarias
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

  // Get imobiliarias without active subscriptions
  const imobiliariasWithoutSubscription = imobiliarias?.filter((imob) => {
    return !assinaturas?.some((a) => a.imobiliaria_id === imob.id && a.status === "ativa");
  });

  const filteredAssinaturas = assinaturas?.filter((assinatura) => {
    const nomeDisplay = assinatura.imobiliaria?.nome || assinatura.user?.nome || "";
    const matchesSearch = searchTerm === "" || 
      nomeDisplay.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || assinatura.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = useMemo(() => {
    if (!assinaturas) return {} as Record<string, number>;
    return assinaturas.reduce((acc, assinatura) => {
      acc[assinatura.status] = (acc[assinatura.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [assinaturas]);

  const openEditDialog = (assinatura: Assinatura) => {
    setAssinaturaToEdit(assinatura);
    setEditForm({
      plano_id: assinatura.plano_id,
      status: assinatura.status,
      data_inicio: assinatura.data_inicio,
      data_fim: assinatura.data_fim || "",
      proxima_cobranca: assinatura.proxima_cobranca || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleEditAssinatura = async () => {
    if (!assinaturaToEdit) return;

    setIsEditing(true);
    try {
      const { error } = await supabase
        .from("assinaturas")
        .update({
          plano_id: editForm.plano_id,
          status: editForm.status,
          data_inicio: editForm.data_inicio,
          data_fim: editForm.data_fim || null,
          proxima_cobranca: editForm.proxima_cobranca || null,
        })
        .eq("id", assinaturaToEdit.id);

      if (error) throw error;

      toast.success("Assinatura atualizada com sucesso");
      setIsEditDialogOpen(false);
      setAssinaturaToEdit(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar assinatura");
    } finally {
      setIsEditing(false);
    }
  };

  const handleCreateAssinatura = async () => {
    if (!createForm.imobiliaria_id || !createForm.plano_id) {
      toast.error("Selecione a imobiliária e o plano");
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await supabase.from("assinaturas").insert({
        imobiliaria_id: createForm.imobiliaria_id,
        plano_id: createForm.plano_id,
        status: createForm.status,
        data_inicio: createForm.data_inicio,
      });

      if (error) throw error;

      toast.success("Assinatura criada com sucesso");
      setIsCreateDialogOpen(false);
      setCreateForm({
        imobiliaria_id: "",
        plano_id: "",
        status: "ativa",
        data_inicio: new Date().toISOString().split("T")[0],
      });
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar assinatura");
    } finally {
      setIsCreating(false);
    }
  };

  const handleChangeStatus = async (assinatura: Assinatura, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("assinaturas")
        .update({ status: newStatus })
        .eq("id", assinatura.id);

      if (error) throw error;

      toast.success(`Assinatura ${newStatus === "ativa" ? "ativada" : newStatus === "suspensa" ? "suspensa" : "cancelada"} com sucesso`);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao alterar status");
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ativa":
        return "default";
      case "trial":
      case "gratuito":
        return "secondary";
      case "suspensa":
      case "pendente":
        return "destructive";
      case "cancelada":
      case "desativada":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ativa":
        return "Ativa";
      case "trial":
        return "Trial";
      case "gratuito":
        return "Gratuito";
      case "suspensa":
        return "Suspensa";
      case "pendente":
        return "Pendente";
      case "cancelada":
        return "Cancelada";
      case "desativada":
        return "Desativada";
      default:
        return status;
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Assinaturas</h1>
            <p className="text-muted-foreground">
              Gerencie todas as assinaturas do sistema
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Assinatura
            </Button>
            <div className="flex items-center gap-2">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
              <span className="text-2xl font-bold">{assinaturas?.length || 0}</span>
            </div>
          </div>
        </div>

        {/* Status Counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <Card 
            className={`cursor-pointer transition-colors hover:bg-accent ${statusFilter === 'ativa' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'ativa' ? 'all' : 'ativa')}
          >
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{statusCounts.ativa || 0}</p>
              <p className="text-xs text-muted-foreground">Ativas</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-colors hover:bg-accent ${statusFilter === 'trial' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'trial' ? 'all' : 'trial')}
          >
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-blue-500">{statusCounts.trial || 0}</p>
              <p className="text-xs text-muted-foreground">Trial</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-colors hover:bg-accent ${statusFilter === 'gratuito' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'gratuito' ? 'all' : 'gratuito')}
          >
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-purple-500">{statusCounts.gratuito || 0}</p>
              <p className="text-xs text-muted-foreground">Gratuito</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-colors hover:bg-accent ${statusFilter === 'pendente' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'pendente' ? 'all' : 'pendente')}
          >
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-yellow-600">{statusCounts.pendente || 0}</p>
              <p className="text-xs text-muted-foreground">Pendente</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-colors hover:bg-accent ${statusFilter === 'suspensa' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'suspensa' ? 'all' : 'suspensa')}
          >
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-orange-500">{statusCounts.suspensa || 0}</p>
              <p className="text-xs text-muted-foreground">Suspensa</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-colors hover:bg-accent ${statusFilter === 'cancelada' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'cancelada' ? 'all' : 'cancelada')}
          >
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-red-500">{statusCounts.cancelada || 0}</p>
              <p className="text-xs text-muted-foreground">Cancelada</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-colors hover:bg-accent ${statusFilter === 'desativada' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'desativada' ? 'all' : 'desativada')}
          >
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-gray-500">{statusCounts.desativada || 0}</p>
              <p className="text-xs text-muted-foreground">Desativada</p>
            </CardContent>
          </Card>
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
                  placeholder="Buscar por imobiliária ou corretor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="gratuito">Gratuito</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="suspensa">Suspensa</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                  <SelectItem value="desativada">Desativada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0 md:p-0">
            {/* Mobile View - Cards */}
            <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando...
                </div>
              ) : filteredAssinaturas?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma assinatura encontrada
                </div>
              ) : (
                filteredAssinaturas?.map((assinatura) => (
                  <Card 
                    key={assinatura.id}
                    className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
                    onClick={() => {
                      if (assinatura.imobiliaria_id) {
                        navigate(`/admin/imobiliarias/${assinatura.imobiliaria_id}`);
                      } else if (assinatura.user_id) {
                        navigate(`/admin/autonomos/${assinatura.user_id}`);
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {assinatura.imobiliaria_id ? (
                              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                            ) : (
                              <User className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                            <p className="font-medium truncate">
                              {assinatura.imobiliaria?.nome || assinatura.user?.nome || "-"}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Plano: {assinatura.plano?.nome || "-"}
                          </p>
                          {assinatura.proxima_cobranca && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Próx. cobrança: {format(new Date(assinatura.proxima_cobranca), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={getStatusBadgeVariant(assinatura.status)}>
                            {getStatusLabel(assinatura.status)}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem onClick={() => openEditDialog(assinatura)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {assinatura.status !== "ativa" && (
                                <DropdownMenuItem onClick={() => handleChangeStatus(assinatura, "ativa")}>
                                  <Play className="h-4 w-4 mr-2" />
                                  Ativar
                                </DropdownMenuItem>
                              )}
                              {assinatura.status === "ativa" && (
                                <DropdownMenuItem onClick={() => handleChangeStatus(assinatura, "suspensa")}>
                                  <Pause className="h-4 w-4 mr-2" />
                                  Suspender
                                </DropdownMenuItem>
                              )}
                              {assinatura.status !== "cancelada" && (
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleChangeStatus(assinatura, "cancelada")}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancelar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Desktop View - Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titular</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Próx. Cobrança</TableHead>
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
                  ) : filteredAssinaturas?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhuma assinatura encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAssinaturas?.map((assinatura) => (
                      <TableRow key={assinatura.id}>
                        <TableCell>
                          {assinatura.imobiliaria_id ? (
                            <button
                              onClick={() => navigate(`/admin/imobiliarias/${assinatura.imobiliaria_id}`)}
                              className="font-medium hover:underline text-left flex items-center gap-2"
                            >
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              {assinatura.imobiliaria?.nome || "-"}
                            </button>
                          ) : assinatura.user_id ? (
                            <button
                              onClick={() => navigate(`/admin/autonomos/${assinatura.user_id}`)}
                              className="font-medium hover:underline text-left flex items-center gap-2"
                            >
                              <User className="h-4 w-4 text-muted-foreground" />
                              {assinatura.user?.nome || "-"}
                            </button>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{assinatura.plano?.nome || "-"}</span>
                            {assinatura.plano?.valor_mensal && (
                              <span className="text-xs text-muted-foreground">
                                R$ {assinatura.plano.valor_mensal.toFixed(2)}/mês
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(assinatura.status)}>
                            {getStatusLabel(assinatura.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(assinatura.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {assinatura.proxima_cobranca
                            ? format(new Date(assinatura.proxima_cobranca), "dd/MM/yyyy", { locale: ptBR })
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(assinatura)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {assinatura.status !== "ativa" && (
                                <DropdownMenuItem onClick={() => handleChangeStatus(assinatura, "ativa")}>
                                  <Play className="h-4 w-4 mr-2" />
                                  Ativar
                                </DropdownMenuItem>
                              )}
                              {assinatura.status === "ativa" && (
                                <DropdownMenuItem onClick={() => handleChangeStatus(assinatura, "suspensa")}>
                                  <Pause className="h-4 w-4 mr-2" />
                                  Suspender
                                </DropdownMenuItem>
                              )}
                              {assinatura.status !== "cancelada" && (
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleChangeStatus(assinatura, "cancelada")}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancelar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Assinatura Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Assinatura</DialogTitle>
            <DialogDescription>
              Altere os dados da assinatura de{" "}
              <strong>{assinaturaToEdit?.imobiliaria?.nome || assinaturaToEdit?.user?.nome || "Corretor Autônomo"}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Plano</Label>
              <Select
                value={editForm.plano_id}
                onValueChange={(v) => setEditForm({ ...editForm, plano_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  {planos?.map((plano) => (
                    <SelectItem key={plano.id} value={plano.id}>
                      {plano.nome} - R$ {plano.valor_mensal.toFixed(2)}/mês
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(v) => setEditForm({ ...editForm, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="gratuito">Gratuito</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="suspensa">Suspensa</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                  <SelectItem value="desativada">Desativada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Input
                type="date"
                value={editForm.data_inicio}
                onChange={(e) => setEditForm({ ...editForm, data_inicio: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Fim (opcional)</Label>
              <Input
                type="date"
                value={editForm.data_fim}
                onChange={(e) => setEditForm({ ...editForm, data_fim: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Próxima Cobrança (opcional)</Label>
              <Input
                type="date"
                value={editForm.proxima_cobranca}
                onChange={(e) => setEditForm({ ...editForm, proxima_cobranca: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditAssinatura} disabled={isEditing}>
              {isEditing ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Assinatura Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Assinatura</DialogTitle>
            <DialogDescription>Crie uma nova assinatura para uma imobiliária</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Imobiliária *</Label>
              <Select
                value={createForm.imobiliaria_id}
                onValueChange={(v) => setCreateForm({ ...createForm, imobiliaria_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma imobiliária" />
                </SelectTrigger>
                <SelectContent>
                  {imobiliariasWithoutSubscription?.map((imob) => (
                    <SelectItem key={imob.id} value={imob.id}>
                      {imob.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Plano *</Label>
              <Select
                value={createForm.plano_id}
                onValueChange={(v) => setCreateForm({ ...createForm, plano_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  {planos?.map((plano) => (
                    <SelectItem key={plano.id} value={plano.id}>
                      {plano.nome} - R$ {plano.valor_mensal.toFixed(2)}/mês
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={createForm.status}
                onValueChange={(v) => setCreateForm({ ...createForm, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Input
                type="date"
                value={createForm.data_inicio}
                onChange={(e) => setCreateForm({ ...createForm, data_inicio: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateAssinatura} disabled={isCreating}>
              {isCreating ? "Criando..." : "Criar Assinatura"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  );
}
