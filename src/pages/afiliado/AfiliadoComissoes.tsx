import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AfiliadoLayout } from "@/components/layouts/AfiliadoLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, CheckCircle, Clock, Download, Filter, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

function generateMonthOptions() {
  const options = [];
  for (let i = 0; i < 12; i++) {
    const date = subMonths(new Date(), i);
    options.push({
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM 'de' yyyy", { locale: ptBR }),
    });
  }
  return options;
}

export default function AfiliadoComissoes() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [tipoFilter, setTipoFilter] = useState<string>("todos");
  const [periodoFilter, setPeriodoFilter] = useState<string>("todos");

  const monthOptions = generateMonthOptions();

  // Buscar dados do afiliado
  const { data: afiliado } = useQuery({
    queryKey: ["afiliado-dados", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("afiliados")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Buscar cupons do afiliado
  const { data: cupons } = useQuery({
    queryKey: ["afiliado-cupons", afiliado?.id],
    queryFn: async () => {
      if (!afiliado) return [];
      
      const { data, error } = await supabase
        .from("cupons")
        .select("id")
        .eq("afiliado_id", afiliado.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!afiliado,
  });

  // Buscar todas as comissões
  const { data: comissoes, isLoading } = useQuery({
    queryKey: ["afiliado-comissoes", cupons, statusFilter, tipoFilter, periodoFilter],
    queryFn: async () => {
      if (!cupons || cupons.length === 0) return [];
      
      const cupomIds = cupons.map((c) => c.id);
      
      let query = supabase
        .from("cupons_usos")
        .select(`
          *,
          cupom:cupons (codigo, comissao_percentual),
          imobiliaria:imobiliarias (nome),
          assinatura:assinaturas (
            plano:planos!assinaturas_plano_id_fkey (nome, valor_mensal)
          )
        `)
        .in("cupom_id", cupomIds)
        .order("created_at", { ascending: false });

      // Filtro de status
      if (statusFilter === "pago") {
        query = query.eq("comissao_paga", true);
      } else if (statusFilter === "pendente") {
        query = query.eq("comissao_paga", false);
      }

      // Filtro de período
      if (periodoFilter !== "todos") {
        const [year, month] = periodoFilter.split("-");
        const startDate = startOfMonth(new Date(parseInt(year), parseInt(month) - 1));
        const endDate = endOfMonth(startDate);
        query = query
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      let result = data || [];
      
      // Filter by tipo
      if (tipoFilter !== "todos") {
        result = result.filter((c: any) => (c.tipo_comissao || 'direta') === tipoFilter);
      }
      
      return result;
    },
    enabled: !!cupons && cupons.length > 0,
  });

  // Cálculos
  const totalPendente = comissoes?.filter((c) => !c.comissao_paga).reduce((sum, c) => sum + Number(c.valor_comissao), 0) || 0;
  const totalPago = comissoes?.filter((c) => c.comissao_paga).reduce((sum, c) => sum + Number(c.valor_comissao), 0) || 0;

  // Exportar CSV
  const handleExportCSV = () => {
    if (!comissoes || comissoes.length === 0) return;

    const headers = ["Data", "Cliente", "Cupom", "Valor Original", "Desconto", "Comissão", "Status", "Data Pagamento"];
    const rows = comissoes.map((c) => [
      format(new Date(c.created_at), "dd/MM/yyyy"),
      c.imobiliaria?.nome || "-",
      c.cupom?.codigo || "-",
      `R$ ${Number(c.valor_original).toFixed(2)}`,
      `R$ ${Number(c.valor_desconto).toFixed(2)}`,
      `R$ ${Number(c.valor_comissao).toFixed(2)}`,
      c.comissao_paga ? "Pago" : "Pendente",
      c.comissao_paga_em ? format(new Date(c.comissao_paga_em), "dd/MM/yyyy") : "-",
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `comissoes_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AfiliadoLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Minhas Comissões</h1>
            <p className="text-muted-foreground">
              Histórico completo de comissões
            </p>
          </div>
          <Button onClick={handleExportCSV} disabled={!comissoes || comissoes.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        {/* Cards de Resumo */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                R$ {totalPendente.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {totalPago.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Período</label>
                <Select value={periodoFilter} onValueChange={setPeriodoFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os períodos" />
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
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Tipo</label>
                <Select value={tipoFilter} onValueChange={setTipoFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="direta">Direta</SelectItem>
                    <SelectItem value="indireta">Indireta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Comissões */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Histórico de Comissões
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : !comissoes || comissoes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma comissão encontrada
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Cupom</TableHead>
                      <TableHead className="text-right">Valor Original</TableHead>
                      <TableHead className="text-right">Desconto</TableHead>
                      <TableHead className="text-right">Comissão</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Pagamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comissoes.map((comissao) => (
                      <TableRow key={comissao.id}>
                        <TableCell>
                          {format(new Date(comissao.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{comissao.imobiliaria?.nome || "-"}</TableCell>
                        <TableCell className="font-mono">{comissao.cupom?.codigo}</TableCell>
                        <TableCell className="text-right">
                          R$ {Number(comissao.valor_original).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {Number(comissao.valor_desconto).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          R$ {Number(comissao.valor_comissao).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {comissao.comissao_paga ? (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
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
                          {comissao.comissao_paga_em 
                            ? format(new Date(comissao.comissao_paga_em), "dd/MM/yyyy", { locale: ptBR })
                            : "-"
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AfiliadoLayout>
  );
}