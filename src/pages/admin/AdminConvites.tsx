import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SuperAdminLayout } from "@/components/layouts/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Mail, MoreVertical, RefreshCw, XCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface Convite {
  id: string;
  email: string;
  nome: string;
  role: string;
  status: string;
  token: string;
  imobiliaria_id: string;
  expira_em: string;
  aceito_em: string | null;
  created_at: string;
  imobiliaria?: {
    nome: string;
  } | null;
}

export default function AdminConvites() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch convites
  const { data: convites, isLoading, refetch } = useQuery({
    queryKey: ["admin-convites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("convites")
        .select(`
          *,
          imobiliarias(nome)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((c: any) => ({
        ...c,
        imobiliaria: c.imobiliarias,
      })) as Convite[];
    },
  });

  const filteredConvites = convites?.filter((convite) => {
    const matchesSearch =
      convite.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      convite.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      convite.imobiliaria?.nome?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || convite.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCancelConvite = async (convite: Convite) => {
    try {
      const { error } = await supabase
        .from("convites")
        .update({ status: "cancelado" })
        .eq("id", convite.id);

      if (error) throw error;

      toast.success("Convite cancelado");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao cancelar convite");
    }
  };

  const handleResendConvite = async (convite: Convite) => {
    try {
      // Update expiration date to extend the invite
      const newExpiration = new Date();
      newExpiration.setDate(newExpiration.getDate() + 7);

      const { error } = await supabase
        .from("convites")
        .update({
          status: "pendente",
          expira_em: newExpiration.toISOString(),
        })
        .eq("id", convite.id);

      if (error) throw error;

      toast.success("Convite renovado por mais 7 dias");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao reenviar convite");
    }
  };

  const getStatusBadgeVariant = (status: string, expiraEm: string) => {
    if (status === "aceito") return "default";
    if (status === "cancelado") return "outline";
    if (new Date(expiraEm) < new Date()) return "destructive";
    return "secondary";
  };

  const getStatusLabel = (status: string, expiraEm: string) => {
    if (status === "aceito") return "Aceito";
    if (status === "cancelado") return "Cancelado";
    if (new Date(expiraEm) < new Date()) return "Expirado";
    return "Pendente";
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
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
            <h1 className="text-3xl font-bold tracking-tight">Convites</h1>
            <p className="text-muted-foreground">
              Gerencie todos os convites do sistema
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-8 w-8 text-muted-foreground" />
            <span className="text-2xl font-bold">{convites?.length || 0}</span>
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
                  placeholder="Buscar por email, nome ou imobiliária..."
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
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="aceito">Aceito</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
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
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-5 w-16" />
                        </div>
                        <Skeleton className="h-4 w-48" />
                        <div className="flex gap-2">
                          <Skeleton className="h-5 w-20" />
                          <Skeleton className="h-5 w-28" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              ) : filteredConvites?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum convite encontrado
                </div>
              ) : (
                filteredConvites?.map((convite) => (
                  <Card 
                    key={convite.id}
                    className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
                    onClick={() => navigate(`/admin/imobiliarias/${convite.imobiliaria_id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{convite.nome}</p>
                          <p className="text-sm text-muted-foreground truncate">{convite.email}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">{getRoleLabel(convite.role)}</Badge>
                            <Badge variant={getStatusBadgeVariant(convite.status, convite.expira_em)}>
                              {getStatusLabel(convite.status, convite.expira_em)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {convite.imobiliaria?.nome || "-"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(convite.expira_em), "dd/MM", { locale: ptBR })}
                          </div>
                          {convite.status !== "aceito" && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem onClick={() => handleResendConvite(convite)}>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Renovar
                                </DropdownMenuItem>
                                {convite.status === "pendente" && (
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleCancelConvite(convite)}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Cancelar
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
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
                    <TableHead>Email</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Imobiliária</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expira em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                        </TableRow>
                      ))}
                    </>
                  ) : filteredConvites?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhum convite encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredConvites?.map((convite) => (
                      <TableRow key={convite.id}>
                        <TableCell>
                          <p className="font-medium">{convite.email}</p>
                        </TableCell>
                        <TableCell>{convite.nome}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{getRoleLabel(convite.role)}</Badge>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() =>
                              navigate(`/admin/imobiliarias/${convite.imobiliaria_id}`)
                            }
                            className="hover:underline"
                          >
                            {convite.imobiliaria?.nome || "-"}
                          </button>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(convite.status, convite.expira_em)}>
                            {getStatusLabel(convite.status, convite.expira_em)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(convite.expira_em), "dd/MM/yyyy", {
                              locale: ptBR,
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={convite.status === "aceito"}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {convite.status !== "aceito" && (
                                <DropdownMenuItem onClick={() => handleResendConvite(convite)}>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Renovar Convite
                                </DropdownMenuItem>
                              )}
                              {convite.status === "pendente" && (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleCancelConvite(convite)}
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
    </SuperAdminLayout>
  );
}
