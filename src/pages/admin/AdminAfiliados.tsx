import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SuperAdminLayout } from "@/components/layouts/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, UserX, UserCheck, Users, Ticket, DollarSign, KeyRound, Loader2, Lock, Coins, CoinsIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { invokeWithRetry } from "@/lib/invokeWithRetry";
import { AnimatedContent, AnimatedList, AnimatedItem } from "@/components/AnimatedContent";

interface Afiliado {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  pix_chave: string | null;
  ativo: boolean;
  comissao_ativa: boolean;
  created_at: string;
  user_id: string | null;
  indicado_por: string | null;
  total_cupons?: number;
  total_usos?: number;
  comissao_pendente?: number;
  indicado_por_nome?: string;
}

export default function AdminAfiliados() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAfiliado, setEditingAfiliado] = useState<Afiliado | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    pix_chave: "",
    indicado_por: "" as string,
  });
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedAfiliadoForPassword, setSelectedAfiliadoForPassword] = useState<Afiliado | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const { data: afiliados, isLoading } = useQuery({
    queryKey: ["admin-afiliados"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("afiliados")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch stats for each afiliado
      const afiliadosWithStats = await Promise.all(
        (data || []).map(async (afiliado) => {
          // Count cupons
          const { count: totalCupons } = await supabase
            .from("cupons")
            .select("*", { count: "exact", head: true })
            .eq("afiliado_id", afiliado.id);

          // Sum uses and pending commissions
          const { data: cuponsData } = await supabase
            .from("cupons")
            .select("id")
            .eq("afiliado_id", afiliado.id);

          let totalUsos = 0;
          let comissaoPendente = 0;

          if (cuponsData && cuponsData.length > 0) {
            const cupomIds = cuponsData.map((c) => c.id);
            
            const { data: usosData } = await supabase
              .from("cupons_usos")
              .select("valor_comissao, comissao_paga")
              .in("cupom_id", cupomIds);

            if (usosData) {
              totalUsos = usosData.length;
              comissaoPendente = usosData
                .filter((u) => !u.comissao_paga)
                .reduce((sum, u) => sum + Number(u.valor_comissao), 0);
            }
          }

          return {
            ...afiliado,
            total_cupons: totalCupons || 0,
            total_usos: totalUsos,
            comissao_pendente: comissaoPendente,
          };
        })
      );

      // Enrich with indicado_por name
      const afiliadoMap = new Map(afiliadosWithStats.map(a => [a.id, a.nome]));
      for (const af of afiliadosWithStats) {
        if (af.indicado_por) {
          (af as any).indicado_por_nome = afiliadoMap.get(af.indicado_por) || null;
        }
      }

      return afiliadosWithStats as Afiliado[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("afiliados").insert({
        nome: data.nome,
        email: data.email,
        telefone: data.telefone || null,
        pix_chave: data.pix_chave || null,
        indicado_por: data.indicado_por || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-afiliados"] });
      toast({ title: "Afiliado criado com sucesso!" });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar afiliado",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("afiliados")
        .update({
          nome: data.nome,
          email: data.email,
          telefone: data.telefone || null,
          pix_chave: data.pix_chave || null,
          indicado_por: data.indicado_por || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-afiliados"] });
      toast({ title: "Afiliado atualizado com sucesso!" });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar afiliado",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from("afiliados")
        .update({ ativo })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-afiliados"] });
      toast({ title: "Status atualizado!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const criarAcessoMutation = useMutation({
    mutationFn: async (afiliadoId: string) => {
      const { data, error } = await invokeWithRetry<{ success: boolean; message: string }>(
        "admin-criar-acesso-afiliado",
        { body: { afiliado_id: afiliadoId } }
      );
      if (error) throw error;
      if (!data?.success) throw new Error(data?.message || "Erro desconhecido");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-afiliados"] });
      toast({ title: "Acesso criado!", description: data.message });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar acesso",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      const { data, error } = await invokeWithRetry<{ success: boolean; message: string }>(
        "admin-reset-password",
        { body: { user_id: userId, action: "set_password", new_password: password } }
      );
      if (error) throw error;
      if (!data?.success) throw new Error(data?.message || "Erro desconhecido");
      return data;
    },
    onSuccess: () => {
      toast({ title: "Senha alterada com sucesso!" });
      setPasswordDialogOpen(false);
      setNewPassword("");
      setSelectedAfiliadoForPassword(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao alterar senha",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleComissaoMutation = useMutation({
    mutationFn: async ({ id, comissao_ativa }: { id: string; comissao_ativa: boolean }) => {
      const { error } = await supabase
        .from("afiliados")
        .update({ comissao_ativa })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-afiliados"] });
      toast({ 
        title: variables.comissao_ativa ? "Comissão ativada!" : "Comissão desativada!",
        description: variables.comissao_ativa 
          ? "O afiliado receberá comissões em novos pagamentos." 
          : "O afiliado não receberá mais comissões."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao alterar comissão",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({ nome: "", email: "", telefone: "", pix_chave: "", indicado_por: "" });
    setEditingAfiliado(null);
  };

  const handleEdit = (afiliado: Afiliado) => {
    setEditingAfiliado(afiliado);
    setFormData({
      nome: afiliado.nome,
      email: afiliado.email,
      telefone: afiliado.telefone || "",
      pix_chave: afiliado.pix_chave || "",
      indicado_por: afiliado.indicado_por || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAfiliado) {
      updateMutation.mutate({ id: editingAfiliado.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Afiliados</h1>
            <p className="text-muted-foreground">
              Gerencie os afiliados do programa de indicação
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Afiliado
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingAfiliado ? "Editar Afiliado" : "Novo Afiliado"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone/WhatsApp</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pix_chave">Chave PIX</Label>
                  <Input
                    id="pix_chave"
                    value={formData.pix_chave}
                    onChange={(e) => setFormData({ ...formData, pix_chave: e.target.value })}
                    placeholder="CPF, Email, Telefone ou Chave aleatória"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="indicado_por">Indicado por</Label>
                  <Select
                    value={formData.indicado_por}
                    onValueChange={(value) => setFormData({ ...formData, indicado_por: value === "none" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhum (afiliado direto)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum (afiliado direto)</SelectItem>
                      {afiliados
                        ?.filter(a => a.id !== editingAfiliado?.id)
                        .map((a) => (
                          <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingAfiliado ? "Salvar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Lista de Afiliados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 md:p-6">
            {isLoading ? (
              <>
                {/* Mobile skeleton */}
                <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
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
                          <Skeleton className="h-5 w-24" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {/* Desktop skeleton */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                        <TableHead><Skeleton className="h-4 w-32" /></TableHead>
                        <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                        <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                        <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                        <TableHead><Skeleton className="h-4 w-12" /></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : !afiliados || afiliados.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum afiliado cadastrado
              </div>
            ) : (
              <>
                {/* Mobile View - Cards */}
                <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
                  {afiliados.map((afiliado) => (
                    <Card key={afiliado.id} className="transition-all hover:shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{afiliado.nome}</p>
                            <p className="text-sm text-muted-foreground truncate">{afiliado.email}</p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Badge variant={afiliado.ativo ? "default" : "secondary"}>
                                {afiliado.ativo ? "Ativo" : "Inativo"}
                              </Badge>
                              <Badge variant="outline" className="gap-1">
                                <Ticket className="h-3 w-3" />
                                {afiliado.total_cupons} cupons
                              </Badge>
                              {afiliado.comissao_pendente && afiliado.comissao_pendente > 0 && (
                                <Badge variant="secondary" className="gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  R$ {afiliado.comissao_pendente.toFixed(2)}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(afiliado)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => toggleStatusMutation.mutate({
                                id: afiliado.id,
                                ativo: !afiliado.ativo,
                              })}
                            >
                              {afiliado.ativo ? (
                                <UserX className="h-4 w-4 text-destructive" />
                              ) : (
                                <UserCheck className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Desktop View - Table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead className="text-center">Cupons</TableHead>
                        <TableHead className="text-center">Usos</TableHead>
                        <TableHead>Indicado por</TableHead>
                        <TableHead className="text-right">Comissão Pendente</TableHead>
                        <TableHead className="text-center">Comissão</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {afiliados.map((afiliado) => (
                        <TableRow key={afiliado.id}>
                          <TableCell className="font-medium">{afiliado.nome}</TableCell>
                          <TableCell>{afiliado.email}</TableCell>
                          <TableCell>{afiliado.telefone || "-"}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="gap-1">
                              <Ticket className="h-3 w-3" />
                              {afiliado.total_cupons}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">{afiliado.total_usos}</TableCell>
                          <TableCell>
                            {afiliado.indicado_por_nome ? (
                              <Badge variant="outline" className="gap-1">
                                <Users className="h-3 w-3" />
                                {afiliado.indicado_por_nome}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {afiliado.comissao_pendente && afiliado.comissao_pendente > 0 ? (
                              <Badge variant="secondary" className="gap-1">
                                <DollarSign className="h-3 w-3" />
                                R$ {afiliado.comissao_pendente.toFixed(2)}
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Switch
                                checked={afiliado.comissao_ativa}
                                onCheckedChange={(checked) =>
                                  toggleComissaoMutation.mutate({
                                    id: afiliado.id,
                                    comissao_ativa: checked,
                                  })
                                }
                                disabled={toggleComissaoMutation.isPending}
                              />
                              <Coins className={`h-4 w-4 ${afiliado.comissao_ativa ? 'text-green-600' : 'text-muted-foreground'}`} />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={afiliado.ativo ? "default" : "secondary"}>
                              {afiliado.ativo ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(afiliado)}
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleStatusMutation.mutate({
                                  id: afiliado.id,
                                  ativo: !afiliado.ativo,
                                })}
                                title={afiliado.ativo ? "Desativar" : "Ativar"}
                              >
                                {afiliado.ativo ? (
                                  <UserX className="h-4 w-4 text-destructive" />
                                ) : (
                                  <UserCheck className="h-4 w-4 text-green-600" />
                                )}
                              </Button>
                              {!afiliado.user_id && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => criarAcessoMutation.mutate(afiliado.id)}
                                  disabled={criarAcessoMutation.isPending}
                                  title="Criar acesso ao painel"
                                >
                                  {criarAcessoMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <KeyRound className="h-4 w-4 text-blue-600" />
                                  )}
                                </Button>
                              )}
                              {afiliado.user_id && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setSelectedAfiliadoForPassword(afiliado);
                                      setPasswordDialogOpen(true);
                                    }}
                                    title="Alterar senha"
                                  >
                                    <Lock className="h-4 w-4 text-orange-600" />
                                  </Button>
                                  <Badge variant="outline" className="text-xs ml-1">
                                    Acesso ativo
                                  </Badge>
                                </>
                              )}
                            </div>
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

        {/* Dialog de Alteração de Senha */}
        <Dialog open={passwordDialogOpen} onOpenChange={(open) => {
          setPasswordDialogOpen(open);
          if (!open) {
            setNewPassword("");
            setSelectedAfiliadoForPassword(null);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Alterar Senha do Afiliado</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Alterar senha para: <strong>{selectedAfiliadoForPassword?.nome}</strong> ({selectedAfiliadoForPassword?.email})
              </p>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={() => {
                    if (selectedAfiliadoForPassword?.user_id) {
                      resetPasswordMutation.mutate({
                        userId: selectedAfiliadoForPassword.user_id,
                        password: newPassword
                      });
                    }
                  }}
                  disabled={newPassword.length < 6 || resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending ? "Salvando..." : "Salvar Senha"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  );
}
