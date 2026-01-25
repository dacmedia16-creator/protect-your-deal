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
import { Check, DollarSign, Clock, User, Ticket, Copy, FileText, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, getYear, getMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Afiliado {
  id: string;
  nome: string;
  email: string;
  pix_chave: string | null;
}

interface CupomUso {
  id: string;
  cupom_id: string;
  assinatura_id: string;
  imobiliaria_id: string | null;
  user_id: string | null;
  valor_original: number;
  valor_desconto: number;
  valor_comissao: number;
  comissao_paga: boolean;
  comissao_paga_em: string | null;
  observacao_pagamento: string | null;
  created_at: string;
  cupons: {
    codigo: string;
    afiliado_id: string;
    afiliados: {
      id: string;
      nome: string;
      email: string;
      pix_chave: string | null;
    };
  };
  imobiliarias?: { nome: string } | null;
}

// Gerar lista de meses para filtro (últimos 12 meses + todos)
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

export default function AdminComissoes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filtroAfiliado, setFiltroAfiliado] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedComissaoId, setSelectedComissaoId] = useState<string | null>(null);
  const [observacao, setObservacao] = useState("");

  const monthOptions = useMemo(() => generateMonthOptions(), []);

  const { data: afiliados } = useQuery({
    queryKey: ["afiliados-lista"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("afiliados")
        .select("id, nome, email, pix_chave")
        .order("nome");
      if (error) throw error;
      return data as Afiliado[];
    },
  });

  const { data: comissoes, isLoading } = useQuery({
    queryKey: ["admin-comissoes", filtroAfiliado, filtroStatus, filtroPeriodo],
    queryFn: async () => {
      let query = supabase
        .from("cupons_usos")
        .select(`
          *,
          cupons(codigo, afiliado_id, afiliados(id, nome, email, pix_chave)),
          imobiliarias(nome)
        `)
        .order("created_at", { ascending: false });

      if (filtroStatus === "pendente") {
        query = query.eq("comissao_paga", false);
      } else if (filtroStatus === "pago") {
        query = query.eq("comissao_paga", true);
      }

      // Filtro por período
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

      // Filter by afiliado if needed
      let filtered = data as CupomUso[];
      if (filtroAfiliado !== "todos") {
        filtered = filtered.filter(
          (c) => c.cupons?.afiliados?.id === filtroAfiliado
        );
      }

      return filtered;
    },
  });

  const marcarPagoMutation = useMutation({
    mutationFn: async ({ id, observacao }: { id: string; observacao: string }) => {
      const { error } = await supabase
        .from("cupons_usos")
        .update({
          comissao_paga: true,
          comissao_paga_em: new Date().toISOString(),
          observacao_pagamento: observacao.trim() || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-comissoes"] });
      queryClient.invalidateQueries({ queryKey: ["admin-afiliados"] });
      toast({ title: "Comissão marcada como paga!" });
      setDialogOpen(false);
      setSelectedComissaoId(null);
      setObservacao("");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao marcar como pago",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleMarcarPago = (id: string) => {
    setSelectedComissaoId(id);
    setObservacao("");
    setDialogOpen(true);
  };

  const confirmarPagamento = () => {
    if (selectedComissaoId) {
      marcarPagoMutation.mutate({ id: selectedComissaoId, observacao });
    }
  };

  const totalPendente = comissoes
    ?.filter((c) => !c.comissao_paga)
    .reduce((sum, c) => sum + Number(c.valor_comissao), 0) || 0;

  const totalPago = comissoes
    ?.filter((c) => c.comissao_paga)
    .reduce((sum, c) => sum + Number(c.valor_comissao), 0) || 0;

  const copyPixKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({ title: "Chave PIX copiada!" });
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Comissões</h1>
            <p className="text-muted-foreground">
              Gerencie as comissões dos afiliados
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Comissões Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                <span className="text-2xl font-bold">
                  R$ {totalPendente.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Comissões Pagas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">
                  R$ {totalPago.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Usos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">
                  {comissoes?.length || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="w-[200px]">
            <Select value={filtroAfiliado} onValueChange={setFiltroAfiliado}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por afiliado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os afiliados</SelectItem>
                {afiliados?.map((afiliado) => (
                  <SelectItem key={afiliado.id} value={afiliado.id}>
                    {afiliado.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-[200px]">
            <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
              <SelectTrigger>
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os períodos</SelectItem>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-[200px]">
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Registro de Comissões
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 md:p-6">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando...
              </div>
            ) : !comissoes || comissoes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma comissão encontrada
              </div>
            ) : (
              <>
                {/* Mobile View - Cards */}
                <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
                  {comissoes.map((comissao) => (
                    <Card key={comissao.id} className="transition-all hover:shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{comissao.cupons?.afiliados?.nome || "-"}</span>
                              {comissao.comissao_paga ? (
                                <Badge variant="default" className="bg-green-600">
                                  <Check className="h-3 w-3 mr-1" />
                                  Pago
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pendente
                                </Badge>
                              )}
                            </div>
                            <code className="bg-muted px-2 py-0.5 rounded font-mono text-xs">
                              {comissao.cupons?.codigo || "-"}
                            </code>
                            <p className="text-sm text-muted-foreground mt-1">
                              {comissao.imobiliarias?.nome || "Corretor Autônomo"}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-sm font-medium">
                                R$ {Number(comissao.valor_comissao).toFixed(2)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({format(new Date(comissao.created_at), "dd/MM/yyyy", { locale: ptBR })})
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {!comissao.comissao_paga && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarcarPago(comissao.id)}
                                disabled={marcarPagoMutation.isPending}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Pagar
                              </Button>
                            )}
                            {comissao.cupons?.afiliados?.pix_chave && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                                onClick={() => copyPixKey(comissao.cupons.afiliados.pix_chave!)}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copiar PIX
                              </Button>
                            )}
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
                        <TableHead>Data</TableHead>
                        <TableHead>Afiliado</TableHead>
                        <TableHead>Cupom</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="text-right">Valor Original</TableHead>
                        <TableHead className="text-right">Desconto</TableHead>
                        <TableHead className="text-right">Comissão</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comissoes.map((comissao) => (
                        <TableRow key={comissao.id}>
                          <TableCell>
                            {format(new Date(comissao.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {comissao.cupons?.afiliados?.nome || "-"}
                              </span>
                              {comissao.cupons?.afiliados?.pix_chave && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                                  onClick={() => copyPixKey(comissao.cupons.afiliados.pix_chave!)}
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copiar PIX
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="bg-muted px-2 py-1 rounded font-mono text-xs">
                              {comissao.cupons?.codigo || "-"}
                            </code>
                          </TableCell>
                          <TableCell>
                            {comissao.imobiliarias?.nome || "Corretor Autônomo"}
                          </TableCell>
                          <TableCell className="text-right">
                            R$ {Number(comissao.valor_original).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            - R$ {Number(comissao.valor_desconto).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            R$ {Number(comissao.valor_comissao).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {comissao.comissao_paga ? (
                              <Badge variant="default" className="bg-green-600">
                                <Check className="h-3 w-3 mr-1" />
                                Pago
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <Clock className="h-3 w-3 mr-1" />
                                Pendente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {!comissao.comissao_paga && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarcarPago(comissao.id)}
                                disabled={marcarPagoMutation.isPending}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Marcar Pago
                              </Button>
                            )}
                            {comissao.comissao_paga && (
                              <div className="flex flex-col gap-1">
                                {comissao.comissao_paga_em && (
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(comissao.comissao_paga_em), "dd/MM/yyyy", { locale: ptBR })}
                                  </span>
                                )}
                                {comissao.observacao_pagamento && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    {comissao.observacao_pagamento}
                                  </span>
                                )}
                              </div>
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

        {/* Dialog para adicionar observação ao marcar como pago */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Marcar Comissão como Paga</DialogTitle>
              <DialogDescription>
                Adicione uma observação opcional sobre este pagamento (ex: número do comprovante, data do PIX, etc.)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="observacao">Observação (opcional)</Label>
                <Textarea
                  id="observacao"
                  placeholder="Ex: PIX realizado em 13/01/2026 - Comprovante #12345"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={confirmarPagamento}
                disabled={marcarPagoMutation.isPending}
              >
                <Check className="h-4 w-4 mr-2" />
                Confirmar Pagamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  );
}
