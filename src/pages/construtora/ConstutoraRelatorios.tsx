import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, CalendarIcon, Download, FileText, CheckCircle, TrendingUp, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { isFichaConfirmada } from '@/lib/fichaStatus';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from 'recharts';

const STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'completo', label: 'Completo' },
  { value: 'finalizado_parcial', label: 'Finalizado Parcial' },
];

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(210, 70%, 55%)',
  'hsl(150, 60%, 45%)',
  'hsl(280, 60%, 55%)',
  'hsl(30, 80%, 55%)',
  'hsl(340, 65%, 50%)',
  'hsl(190, 70%, 45%)',
];

export default function ConstutoraRelatorios() {
  useDocumentTitle('Relatórios | Construtora');
  const { user } = useAuth();

  const [dataInicio, setDataInicio] = useState<Date>(subMonths(new Date(), 6));
  const [dataFim, setDataFim] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState('todos');

  // Fetch construtora_id
  const { data: construtora } = useQuery({
    queryKey: ['construtora-id', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('construtora_id')
        .eq('user_id', user!.id)
        .not('construtora_id', 'is', null)
        .limit(1)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const construtoraId = construtora?.construtora_id;

  // Fetch fichas
  const { data: fichas = [], isLoading: loadingFichas } = useQuery({
    queryKey: ['construtora-fichas-relatorio', construtoraId, dataInicio, dataFim, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('fichas_visita')
        .select('id, protocolo, imovel_endereco, status, created_at, data_visita, empreendimento_id, imobiliaria_id, convertido_venda, valor_venda')
        .eq('construtora_id', construtoraId!)
        .gte('created_at', dataInicio.toISOString())
        .lte('created_at', dataFim.toISOString());

      if (statusFilter !== 'todos') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!construtoraId,
  });

  // Fetch empreendimentos
  const { data: empreendimentos = [] } = useQuery({
    queryKey: ['construtora-empreendimentos-rel', construtoraId],
    queryFn: async () => {
      const { data } = await supabase
        .from('empreendimentos')
        .select('id, nome')
        .eq('construtora_id', construtoraId!);
      return data || [];
    },
    enabled: !!construtoraId,
  });

  // Fetch imobiliárias parceiras
  const { data: imobiliarias = [] } = useQuery({
    queryKey: ['construtora-imobiliarias-rel', construtoraId],
    queryFn: async () => {
      const { data: parcerias } = await supabase
        .from('construtora_imobiliarias')
        .select('imobiliaria_id')
        .eq('construtora_id', construtoraId!);

      if (!parcerias?.length) return [];
      const ids = parcerias.map(p => p.imobiliaria_id);
      const { data } = await supabase
        .from('imobiliarias')
        .select('id, nome')
        .in('id', ids);
      return data || [];
    },
    enabled: !!construtoraId,
  });

  // Name maps
  const empNomeMap = useMemo(() => {
    const m: Record<string, string> = {};
    empreendimentos.forEach(e => { m[e.id] = e.nome; });
    return m;
  }, [empreendimentos]);

  const imobNomeMap = useMemo(() => {
    const m: Record<string, string> = {};
    imobiliarias.forEach(i => { m[i.id] = i.nome; });
    return m;
  }, [imobiliarias]);

  // KPIs
  const kpis = useMemo(() => {
    const total = fichas.length;
    const confirmados = fichas.filter(f => isFichaConfirmada(f.status)).length;
    const taxa = total > 0 ? Math.round((confirmados / total) * 100) : 0;
    const vendas = fichas.filter(f => f.convertido_venda).length;
    return { total, confirmados, taxa, vendas };
  }, [fichas]);

  // Monthly chart data
  const monthlyData = useMemo(() => {
    const months: Record<string, { total: number; confirmados: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const key = format(d, 'yyyy-MM');
      months[key] = { total: 0, confirmados: 0 };
    }
    fichas.forEach(f => {
      const key = format(parseISO(f.created_at), 'yyyy-MM');
      if (months[key]) {
        months[key].total++;
        if (isFichaConfirmada(f.status)) months[key].confirmados++;
      }
    });
    return Object.entries(months).map(([key, v]) => ({
      mes: format(parseISO(key + '-01'), 'MMM/yy', { locale: ptBR }),
      total: v.total,
      confirmados: v.confirmados,
    }));
  }, [fichas]);

  // Per empreendimento
  const perEmpreendimento = useMemo(() => {
    const counts: Record<string, number> = {};
    fichas.forEach(f => {
      if (f.empreendimento_id) {
        counts[f.empreendimento_id] = (counts[f.empreendimento_id] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([id, total]) => ({ nome: empNomeMap[id] || 'Desconhecido', total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [fichas, empNomeMap]);

  // Per imobiliária
  const perImobiliaria = useMemo(() => {
    const counts: Record<string, number> = {};
    fichas.forEach(f => {
      if (f.imobiliaria_id) {
        counts[f.imobiliaria_id] = (counts[f.imobiliaria_id] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([id, total]) => ({ nome: imobNomeMap[id] || 'Desconhecido', total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [fichas, imobNomeMap]);

  // CSV export
  const exportCSV = () => {
    const header = 'Protocolo,Empreendimento,Imobiliária,Data,Status,Venda\n';
    const rows = fichas.map(f =>
      `${f.protocolo},${empNomeMap[f.empreendimento_id || ''] || '-'},${imobNomeMap[f.imobiliaria_id || ''] || '-'},${format(parseISO(f.created_at), 'dd/MM/yyyy')},${f.status},${f.convertido_venda ? 'Sim' : 'Não'}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-construtora-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const monthlyConfig = {
    total: { label: 'Total', color: 'hsl(var(--primary))' },
    confirmados: { label: 'Confirmados', color: 'hsl(150, 60%, 45%)' },
  };

  return (<div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold">Relatórios</h1>
            <p className="text-muted-foreground">Análises de fichas por empreendimento e imobiliária parceira</p>
          </div>
          <Button variant="outline" onClick={exportCSV} disabled={!fichas.length}>
            <Download className="h-4 w-4 mr-2" /> Exportar CSV
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Data início</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(dataInicio, 'dd/MM/yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dataInicio} onSelect={(d) => d && setDataInicio(d)} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Data fim</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(dataFim, 'dd/MM/yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dataFim} onSelect={(d) => d && setDataFim(d)} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        {loadingFichas ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Registros</p>
                    <p className="text-2xl font-bold">{kpis.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Confirmados</p>
                    <p className="text-2xl font-bold">{kpis.confirmados}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Taxa Confirmação</p>
                    <p className="text-2xl font-bold">{kpis.taxa}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-amber-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Vendas</p>
                    <p className="text-2xl font-bold">{kpis.vendas}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Monthly evolution chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> Evolução Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={monthlyConfig} className="h-[300px] w-full">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="mes" className="text-xs" />
                <YAxis allowDecimals={false} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="confirmados" fill="var(--color-confirmados)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Per empreendimento & per imobiliária side by side */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fichas por Empreendimento</CardTitle>
            </CardHeader>
            <CardContent>
              {perEmpreendimento.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sem dados no período</p>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={perEmpreendimento} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis type="number" allowDecimals={false} className="text-xs" />
                      <YAxis type="category" dataKey="nome" width={120} className="text-xs" tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                        {perEmpreendimento.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fichas por Imobiliária Parceira</CardTitle>
            </CardHeader>
            <CardContent>
              {perImobiliaria.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sem dados no período</p>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={perImobiliaria} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis type="number" allowDecimals={false} className="text-xs" />
                      <YAxis type="category" dataKey="nome" width={120} className="text-xs" tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                        {perImobiliaria.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detailed table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Registros Detalhados</CardTitle>
          </CardHeader>
          <CardContent>
            {fichas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum registro encontrado no período selecionado</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Protocolo</TableHead>
                      <TableHead>Empreendimento</TableHead>
                      <TableHead>Imobiliária</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Venda</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fichas.slice(0, 50).map(f => (
                      <TableRow key={f.id}>
                        <TableCell className="font-mono text-xs">{f.protocolo}</TableCell>
                        <TableCell>{empNomeMap[f.empreendimento_id || ''] || '-'}</TableCell>
                        <TableCell>{imobNomeMap[f.imobiliaria_id || ''] || '-'}</TableCell>
                        <TableCell>{format(parseISO(f.created_at), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>
                          <Badge variant={isFichaConfirmada(f.status) ? 'default' : 'secondary'}>
                            {f.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{f.convertido_venda ? '✅' : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {fichas.length > 50 && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Mostrando 50 de {fichas.length} registros. Exporte o CSV para ver todos.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>);
}
