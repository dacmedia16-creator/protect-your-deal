import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, TicketX, Ticket, Percent, DollarSign, Calendar, Hash } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AnimatedContent, AnimatedList, AnimatedItem } from "@/components/AnimatedContent";

interface Afiliado {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
}

interface Cupom {
  id: string;
  codigo: string;
  afiliado_id: string;
  tipo_desconto: "percentual" | "fixo";
  valor_desconto: number;
  comissao_percentual: number;
  valido_ate: string | null;
  max_usos: number | null;
  usos_atuais: number;
  ativo: boolean;
  created_at: string;
  afiliados?: { nome: string };
}

export default function AdminCupons() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCupom, setEditingCupom] = useState<Cupom | null>(null);
  const [formData, setFormData] = useState({
    codigo: "",
    afiliado_id: "",
    tipo_desconto: "percentual" as "percentual" | "fixo",
    valor_desconto: "",
    comissao_percentual: "",
    valido_ate: "",
    max_usos: "",
  });

  const { data: afiliados } = useQuery({
    queryKey: ["afiliados-ativos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("afiliados")
        .select("id, nome, email, ativo")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data as Afiliado[];
    },
  });

  const { data: cupons, isLoading } = useQuery({
    queryKey: ["admin-cupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cupons")
        .select("*, afiliados(nome)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Cupom[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("cupons").insert({
        codigo: data.codigo.toUpperCase().trim(),
        afiliado_id: data.afiliado_id,
        tipo_desconto: data.tipo_desconto,
        valor_desconto: parseFloat(data.valor_desconto),
        comissao_percentual: parseFloat(data.comissao_percentual),
        valido_ate: data.valido_ate || null,
        max_usos: data.max_usos ? parseInt(data.max_usos) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cupons"] });
      toast({ title: "Cupom criado com sucesso!" });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar cupom",
        description: error.message.includes("unique") 
          ? "Este código de cupom já existe" 
          : error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("cupons")
        .update({
          codigo: data.codigo.toUpperCase().trim(),
          afiliado_id: data.afiliado_id,
          tipo_desconto: data.tipo_desconto,
          valor_desconto: parseFloat(data.valor_desconto),
          comissao_percentual: parseFloat(data.comissao_percentual),
          valido_ate: data.valido_ate || null,
          max_usos: data.max_usos ? parseInt(data.max_usos) : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cupons"] });
      toast({ title: "Cupom atualizado com sucesso!" });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar cupom",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from("cupons")
        .update({ ativo })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cupons"] });
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

  const resetForm = () => {
    setFormData({
      codigo: "",
      afiliado_id: "",
      tipo_desconto: "percentual",
      valor_desconto: "",
      comissao_percentual: "",
      valido_ate: "",
      max_usos: "",
    });
    setEditingCupom(null);
  };

  const handleEdit = (cupom: Cupom) => {
    setEditingCupom(cupom);
    setFormData({
      codigo: cupom.codigo,
      afiliado_id: cupom.afiliado_id,
      tipo_desconto: cupom.tipo_desconto,
      valor_desconto: cupom.valor_desconto.toString(),
      comissao_percentual: cupom.comissao_percentual.toString(),
      valido_ate: cupom.valido_ate || "",
      max_usos: cupom.max_usos?.toString() || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCupom) {
      updateMutation.mutate({ id: editingCupom.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isExpired = (valido_ate: string | null) => {
    if (!valido_ate) return false;
    return new Date(valido_ate) < new Date();
  };

  const isLimitReached = (cupom: Cupom) => {
    if (!cupom.max_usos) return false;
    return cupom.usos_atuais >= cupom.max_usos;
  };

  return (<div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Cupons de Desconto</h1>
            <p className="text-muted-foreground">
              Gerencie os cupons de desconto do programa de afiliados
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Cupom
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCupom ? "Editar Cupom" : "Novo Cupom"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código do Cupom *</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                    placeholder="Ex: JOAO10"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="afiliado">Afiliado *</Label>
                  <Select
                    value={formData.afiliado_id}
                    onValueChange={(value) => setFormData({ ...formData, afiliado_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o afiliado" />
                    </SelectTrigger>
                    <SelectContent>
                      {afiliados?.map((afiliado) => (
                        <SelectItem key={afiliado.id} value={afiliado.id}>
                          {afiliado.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo_desconto">Tipo de Desconto *</Label>
                    <Select
                      value={formData.tipo_desconto}
                      onValueChange={(value: "percentual" | "fixo") => 
                        setFormData({ ...formData, tipo_desconto: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentual">Percentual (%)</SelectItem>
                        <SelectItem value="fixo">Valor Fixo (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="valor_desconto">
                      Valor {formData.tipo_desconto === "percentual" ? "(%)" : "(R$)"} *
                    </Label>
                    <Input
                      id="valor_desconto"
                      type="number"
                      step={formData.tipo_desconto === "percentual" ? "1" : "0.01"}
                      min="0"
                      max={formData.tipo_desconto === "percentual" ? "100" : undefined}
                      value={formData.valor_desconto}
                      onChange={(e) => setFormData({ ...formData, valor_desconto: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comissao_percentual">Comissão do Afiliado (%) *</Label>
                  <Input
                    id="comissao_percentual"
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={formData.comissao_percentual}
                    onChange={(e) => setFormData({ ...formData, comissao_percentual: e.target.value })}
                    placeholder="Ex: 20"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="valido_ate">Válido até</Label>
                    <Input
                      id="valido_ate"
                      type="date"
                      value={formData.valido_ate}
                      onChange={(e) => setFormData({ ...formData, valido_ate: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="max_usos">Limite de Usos</Label>
                    <Input
                      id="max_usos"
                      type="number"
                      min="1"
                      value={formData.max_usos}
                      onChange={(e) => setFormData({ ...formData, max_usos: e.target.value })}
                      placeholder="Ilimitado"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingCupom ? "Salvar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Lista de Cupons
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
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-6 w-20" />
                          <Skeleton className="h-5 w-14" />
                        </div>
                        <Skeleton className="h-4 w-32" />
                        <div className="flex gap-2">
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-5 w-20" />
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
                        <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                        <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                        <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                        <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                        <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                        <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                        <TableHead><Skeleton className="h-4 w-12" /></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-14" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : !cupons || cupons.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum cupom cadastrado
              </div>
            ) : (
              <>
                {/* Mobile View - Cards */}
                <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
                  {cupons.map((cupom) => (
                    <Card key={cupom.id} className="transition-all hover:shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <code className="bg-muted px-2 py-1 rounded font-mono text-sm font-bold">
                                {cupom.codigo}
                              </code>
                              {!cupom.ativo ? (
                                <Badge variant="secondary">Inativo</Badge>
                              ) : isExpired(cupom.valido_ate) ? (
                                <Badge variant="destructive">Expirado</Badge>
                              ) : isLimitReached(cupom) ? (
                                <Badge variant="secondary">Limite</Badge>
                              ) : (
                                <Badge variant="default">Ativo</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{cupom.afiliados?.nome || "-"}</p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Badge variant="outline" className="gap-1">
                                {cupom.tipo_desconto === "percentual" ? (
                                  <>
                                    <Percent className="h-3 w-3" />
                                    {cupom.valor_desconto}%
                                  </>
                                ) : (
                                  <>
                                    <DollarSign className="h-3 w-3" />
                                    R$ {Number(cupom.valor_desconto).toFixed(2)}
                                  </>
                                )}
                              </Badge>
                              <Badge variant="secondary">
                                {cupom.comissao_percentual}% comissão
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Hash className="h-3 w-3" />
                                {cupom.usos_atuais}{cupom.max_usos && `/${cupom.max_usos}`}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(cupom)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => toggleStatusMutation.mutate({
                                id: cupom.id,
                                ativo: !cupom.ativo,
                              })}
                            >
                              {cupom.ativo ? (
                                <TicketX className="h-4 w-4 text-destructive" />
                              ) : (
                                <Ticket className="h-4 w-4 text-green-600" />
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
                        <TableHead>Código</TableHead>
                        <TableHead>Afiliado</TableHead>
                        <TableHead>Desconto</TableHead>
                        <TableHead>Comissão</TableHead>
                        <TableHead>Validade</TableHead>
                        <TableHead className="text-center">Usos</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cupons.map((cupom) => (
                        <TableRow key={cupom.id}>
                          <TableCell>
                            <code className="bg-muted px-2 py-1 rounded font-mono text-sm">
                              {cupom.codigo}
                            </code>
                          </TableCell>
                          <TableCell>{cupom.afiliados?.nome || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="gap-1">
                              {cupom.tipo_desconto === "percentual" ? (
                                <>
                                  <Percent className="h-3 w-3" />
                                  {cupom.valor_desconto}%
                                </>
                              ) : (
                                <>
                                  <DollarSign className="h-3 w-3" />
                                  R$ {Number(cupom.valor_desconto).toFixed(2)}
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {cupom.comissao_percentual}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {cupom.valido_ate ? (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span className={isExpired(cupom.valido_ate) ? "text-destructive" : ""}>
                                  {format(new Date(cupom.valido_ate), "dd/MM/yyyy")}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Sem limite</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Hash className="h-3 w-3" />
                              {cupom.usos_atuais}
                              {cupom.max_usos && (
                                <span className="text-muted-foreground">/ {cupom.max_usos}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {!cupom.ativo ? (
                              <Badge variant="secondary">Inativo</Badge>
                            ) : isExpired(cupom.valido_ate) ? (
                              <Badge variant="destructive">Expirado</Badge>
                            ) : isLimitReached(cupom) ? (
                              <Badge variant="secondary">Limite atingido</Badge>
                            ) : (
                              <Badge variant="default">Ativo</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(cupom)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleStatusMutation.mutate({
                                  id: cupom.id,
                                  ativo: !cupom.ativo,
                                })}
                              >
                                {cupom.ativo ? (
                                  <TicketX className="h-4 w-4 text-destructive" />
                                ) : (
                                  <Ticket className="h-4 w-4 text-green-600" />
                                )}
                              </Button>
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
      </div>);
}
