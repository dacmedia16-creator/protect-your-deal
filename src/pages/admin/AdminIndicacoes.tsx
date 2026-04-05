import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SuperAdminLayout } from "@/components/layouts/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Check, DollarSign, Clock, Users, Calendar, ArrowUpRight, Percent } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfMonth, endOfMonth, subMonths, getYear, getMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Indicacao {
  id: string;
  codigo: string;
  indicador_user_id: string;
  indicado_user_id: string | null;
  tipo_indicado: string;
  tipo_comissao_indicacao: string;
  comissao_percentual: number;
  valor_comissao: number | null;
  comissao_paga: boolean;
  comissao_paga_em: string | null;
  observacao_pagamento: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

const generateMonthOptions = () => {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const date = subMonths(now, i);
    const value = `${getYear(date)}-${String(getMonth(date) + 1).padStart(2, '0')}`;
    const label = format(date, "MMMM yyyy", { locale: ptBR });
    options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return options;
};

export default function AdminIndicacoes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filtroTipoComissao, setFiltroTipoComissao] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [observacao, setObservacao] = useState("");

  const monthOptions = useMemo(() => generateMonthOptions(), []);

  // Fetch indicações (only converted ones, not placeholders)
  const { data: indicacoes, isLoading } = useQuery({
    queryKey: ["admin-indicacoes", filtroTipoComissao, filtroStatus, filtroPeriodo],
    queryFn: async () => {
      let query = supabase
        .from("indicacoes_corretor")
        .select("*")
        .neq("status", "pendente")
        .order("created_at", { ascending: false });

      if (filtroStatus === "pendente") {
        query = query.eq("comissao_paga", false);
      } else if (filtroStatus === "pago") {
        query = query.eq("comissao_paga", true);
      }

      if (filtroTipoComissao !== "todos") {
        query = query.eq("tipo_comissao_indicacao", filtroTipoComissao);
      }

      if (filtroPeriodo !== "todos") {
        const [year, month] = filtroPeriodo.split("-").map(Number);
        const startDate = startOfMonth(new Date(year, month - 1));
        const endDate = endOfMonth(new Date(year, month - 1));
        query = query
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Indicacao[];
    },
  });

  // Fetch profiles for name resolution
  const userIds = useMemo(() => {
    if (!indicacoes) return [];
    const ids = new Set<string>();
    indicacoes.forEach((i) => {
      ids.add(i.indicador_user_id);
      if (i.indicado_user_id) ids.add(i.indicado_user_id);
    });
    return Array.from(ids);
  }, [indicacoes]);

  const { data: profiles } = useQuery({
    queryKey: ["admin-indicacoes-profiles", userIds],
    queryFn: async () => {
      if (userIds.length === 0) return {};
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, nome, email")
        .in("user_id", userIds);
      if (error) throw error;
      const map: Record<string, { nome: string; email: string | null }> = {};
      data?.forEach((p) => { map[p.user_id] = { nome: p.nome, email: p.email }; });
      return map;
    },
    enabled: userIds.length > 0,
  });

  const marcarPagoMutation = useMutation({
    mutationFn: async ({ id, observacao }: { id: string; observacao: string }) => {
      const { error } = await supabase
        .from("indicacoes_corretor")
        .update({
          comissao_paga: true,
          comissao_paga_em: new Date().toISOString(),
          observacao_pagamento: observacao.trim() || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-indicacoes"] });
      toast({ title: "Comissão marcada como paga!" });
      setDialogOpen(false);
      setSelectedId(null);
      setObservacao("");
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao marcar como pago", description: error.message, variant: "destructive" });
    },
  });

  const handleMarcarPago = (id: string) => {
    setSelectedId(id);
    setObservacao("");
    setDialogOpen(true);
  };

  const confirmarPagamento = () => {
    if (selectedId) {
      marcarPagoMutation.mutate({ id: selectedId, observacao });
    }
  };

  const totalPendente = indicacoes
    ?.filter((i) => !i.comissao_paga && i.valor_comissao)
    .reduce((sum, i) => sum + Number(i.valor_comissao), 0) || 0;

  const totalPago = indicacoes
    ?.filter((i) => i.comissao_paga && i.valor_comissao)
    .reduce((sum, i) => sum + Number(i.valor_comissao), 0) || 0;

  const getNome = (userId: string | null) => {
    if (!userId || !profiles) return "—";
    return profiles[userId]?.nome || "Desconhecido";
  };

  const getTipoComissaoBadge = (tipo: string) => {
    if (tipo === "primeira_mensalidade") {
      return <Badge variant="outline" className="text-xs gap-1"><DollarSign className="h-3 w-3" />1ª Mensalidade</Badge>;
    }
    return <Badge variant="outline" className="text-xs gap-1"><Percent className="h-3 w-3" />Percentual</Badge>;
  };

  return (<div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Indicações</h1>
          <p className="text-muted-foreground">Gerencie as comissões de indicação de corretores</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Comissões Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                <span className="text-2xl font-bold">R$ {totalPendente.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Comissões Pagas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">R$ {totalPago.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Indicações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{indicacoes?.length || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="w-[200px]">
            <Select value={filtroTipoComissao} onValueChange={setFiltroTipoComissao}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de comissão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="percentual">Percentual</SelectItem>
                <SelectItem value="primeira_mensalidade">1ª Mensalidade</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-[200px]">
            <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
              <SelectTrigger>
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os períodos</SelectItem>
                {monthOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-[200px]">
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5" />
              Registro de Indicações
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 md:p-6">
            {isLoading ? (
              <>
                <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}><CardContent className="p-4 space-y-3">
                      <Skeleton className="h-5 w-28" />
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-4 w-20" />
                    </CardContent></Card>
                  ))}
                </div>
                <div className="hidden md:block">
                  <Table><TableHeader><TableRow>
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => <TableHead key={i}><Skeleton className="h-4 w-20" /></TableHead>)}
                  </TableRow></TableHeader><TableBody>
                    {[1, 2, 3].map((i) => <TableRow key={i}>
                      {[1, 2, 3, 4, 5, 6, 7].map((j) => <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>)}
                    </TableRow>)}
                  </TableBody></Table>
                </div>
              </>
            ) : !indicacoes || indicacoes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Nenhuma indicação encontrada</div>
            ) : (
              <>
                {/* Mobile */}
                <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
                  {indicacoes.map((ind) => (
                    <Card key={ind.id} className="transition-all hover:shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-medium">{getNome(ind.indicador_user_id)}</span>
                              {ind.comissao_paga ? (
                                <Badge variant="default" className="bg-green-600"><Check className="h-3 w-3 mr-1" />Pago</Badge>
                              ) : (
                                <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>
                              )}
                            </div>
                            <code className="bg-muted px-2 py-0.5 rounded font-mono text-xs">{ind.codigo}</code>
                            <p className="text-sm text-muted-foreground mt-1">
                              Indicou: {getNome(ind.indicado_user_id)} ({ind.tipo_indicado})
                            </p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {getTipoComissaoBadge(ind.tipo_comissao_indicacao)}
                              <span className="text-sm font-medium">
                                R$ {Number(ind.valor_comissao || 0).toFixed(2)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(ind.created_at), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            </div>
                          </div>
                          {!ind.comissao_paga && ind.valor_comissao && Number(ind.valor_comissao) > 0 && (
                            <Button variant="outline" size="sm" onClick={() => handleMarcarPago(ind.id)} disabled={marcarPagoMutation.isPending}>
                              <Check className="h-4 w-4 mr-1" />Pagar
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Desktop */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Indicador</TableHead>
                        <TableHead>Indicado</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Tipo Comissão</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {indicacoes.map((ind) => (
                        <TableRow key={ind.id}>
                          <TableCell>
                            <code className="bg-muted px-2 py-0.5 rounded font-mono text-xs">{ind.codigo}</code>
                          </TableCell>
                          <TableCell className="font-medium">{getNome(ind.indicador_user_id)}</TableCell>
                          <TableCell>{getNome(ind.indicado_user_id)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {ind.tipo_indicado === "corretor" ? "Corretor" : "Imobiliária"}
                            </Badge>
                          </TableCell>
                          <TableCell>{getTipoComissaoBadge(ind.tipo_comissao_indicacao)}</TableCell>
                          <TableCell className="font-medium">
                            R$ {Number(ind.valor_comissao || 0).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {ind.comissao_paga ? (
                              <Badge variant="default" className="bg-green-600"><Check className="h-3 w-3 mr-1" />Pago</Badge>
                            ) : (
                              <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(ind.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            {!ind.comissao_paga && ind.valor_comissao && Number(ind.valor_comissao) > 0 && (
                              <Button variant="outline" size="sm" onClick={() => handleMarcarPago(ind.id)} disabled={marcarPagoMutation.isPending}>
                                <Check className="h-4 w-4 mr-1" />Pagar
                              </Button>
                            )}
                            {ind.comissao_paga && ind.observacao_pagamento && (
                              <span className="text-xs text-muted-foreground" title={ind.observacao_pagamento}>📝</span>
                            )}
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

        {/* Payment Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Pagamento</DialogTitle>
              <DialogDescription>Marcar esta comissão de indicação como paga.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="observacao">Observação (opcional)</Label>
                <Textarea
                  id="observacao"
                  placeholder="Ex: Pago via PIX em dd/mm/aaaa"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={confirmarPagamento} disabled={marcarPagoMutation.isPending}>
                <Check className="h-4 w-4 mr-2" />
                {marcarPagoMutation.isPending ? "Salvando..." : "Confirmar Pagamento"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>);
}
