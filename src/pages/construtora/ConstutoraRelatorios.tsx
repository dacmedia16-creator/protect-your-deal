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
import {
  BarChart3, CalendarIcon, Download, FileText, CheckCircle,
  TrendingUp, TrendingDown, DollarSign, Filter, ArrowRight,
  Trophy, Medal, Users, Building, UserX, XCircle, Clock, Timer
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, subMonths, startOfMonth, endOfMonth, parseISO, differenceInDays, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { isFichaConfirmada } from '@/lib/fichaStatus';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell, Legend } from 'recharts';
import { EquipeBadge } from '@/components/EquipeBadge';

const STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'completo', label: 'Completo' },
  { value: 'finalizado_parcial', label: 'Finalizado Parcial' },
  { value: 'no_show', label: 'No-show' },
  { value: 'cancelado', label: 'Cancelado' },
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

interface FichaRel {
  id: string;
  protocolo: string;
  imovel_endereco: string;
  status: string;
  created_at: string;
  data_visita: string;
  empreendimento_id: string | null;
  imobiliaria_id: string | null;
  user_id: string | null;
  convertido_venda: boolean | null;
  valor_venda: number | null;
  motivo_perda: string | null;
  proprietario_confirmado_em: string | null;
  comprador_confirmado_em: string | null;
}

function calcVar(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

function VarBadge({ current, previous }: { current: number; previous: number }) {
  const v = calcVar(current, previous);
  if (v === null) return <span className="text-xs text-muted-foreground">—</span>;
  const pos = v >= 0;
  return (
    <span className={`text-xs font-medium flex items-center gap-0.5 ${pos ? 'text-success' : 'text-destructive'}`}>
      {pos ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {pos ? '+' : ''}{v}%
    </span>
  );
}

export default function ConstutoraRelatorios() {
  useDocumentTitle('Relatórios | Construtora');
  const { user } = useAuth();

  const [dataInicio, setDataInicio] = useState<Date>(subMonths(new Date(), 6));
  const [dataFim, setDataFim] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState('todos');
  const [empFilter, setEmpFilter] = useState('todos');
  const [imobFilter, setImobFilter] = useState('todos');
  const [corretorFilter, setCorretorFilter] = useState('todos');
  const [equipeFilter, setEquipeFilter] = useState('todos');

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

  // Fetch fichas (with user_id for corretor filter)
  const { data: fichasRaw = [], isLoading: loadingFichas } = useQuery({
    queryKey: ['construtora-fichas-relatorio', construtoraId, dataInicio, dataFim, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('fichas_visita')
        .select('id, protocolo, imovel_endereco, status, created_at, data_visita, empreendimento_id, imobiliaria_id, user_id, convertido_venda, valor_venda, motivo_perda, proprietario_confirmado_em, comprador_confirmado_em')
        .eq('construtora_id', construtoraId!)
        .gte('created_at', dataInicio.toISOString())
        .lte('created_at', dataFim.toISOString());

      if (statusFilter !== 'todos') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(10000);
      if (error) throw error;
      return (data || []) as FichaRel[];
    },
    enabled: !!construtoraId,
  });

  // Previous period fichas for MoM comparison
  const periodDays = differenceInDays(dataFim, dataInicio) || 1;
  const prevStart = new Date(dataInicio.getTime() - periodDays * 86400000);
  const prevEnd = new Date(dataInicio.getTime() - 1);

  const { data: fichasPrev = [] } = useQuery({
    queryKey: ['construtora-fichas-prev', construtoraId, prevStart, prevEnd],
    queryFn: async () => {
      const { data } = await supabase
        .from('fichas_visita')
        .select('status, convertido_venda, valor_venda')
        .eq('construtora_id', construtoraId!)
        .gte('created_at', prevStart.toISOString())
        .lte('created_at', prevEnd.toISOString())
        .limit(10000);
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

  // Fetch corretores (profiles via user_roles)
  const { data: corretores = [] } = useQuery({
    queryKey: ['construtora-corretores-rel', construtoraId],
    queryFn: async () => {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('construtora_id', construtoraId!)
        .eq('role', 'corretor');
      if (!roles?.length) return [];
      const userIds = roles.map(r => r.user_id);
      const { data } = await supabase
        .from('profiles')
        .select('user_id, nome')
        .in('user_id', userIds);
      return data || [];
    },
    enabled: !!construtoraId,
  });

  // Fetch equipes da construtora
  const { data: equipes = [] } = useQuery({
    queryKey: ['construtora-equipes-rel', construtoraId],
    queryFn: async () => {
      const { data } = await supabase
        .from('equipes')
        .select('id, nome, cor')
        .eq('construtora_id', construtoraId!)
        .eq('ativa', true)
        .order('nome');
      return data || [];
    },
    enabled: !!construtoraId,
  });

  // Fetch membros de equipes
  const { data: equipesMembros = [] } = useQuery({
    queryKey: ['construtora-equipes-membros-rel', equipes.map(e => e.id).join(',')],
    queryFn: async () => {
      if (!equipes.length) return [];
      const equipeIds = equipes.map(e => e.id);
      const { data } = await supabase
        .from('equipes_membros')
        .select('user_id, equipe_id')
        .in('equipe_id', equipeIds);
      return data || [];
    },
    enabled: equipes.length > 0,
  });

  // Map user_id -> equipe_ids[]
  const userEquipeMap = useMemo(() => {
    const m: Record<string, string[]> = {};
    equipesMembros.forEach(em => {
      if (!m[em.user_id]) m[em.user_id] = [];
      m[em.user_id].push(em.equipe_id);
    });
    return m;
  }, [equipesMembros]);

  // Map equipe_id -> Set<user_id>
  const equipeUserMap = useMemo(() => {
    const m: Record<string, Set<string>> = {};
    equipesMembros.forEach(em => {
      if (!m[em.equipe_id]) m[em.equipe_id] = new Set();
      m[em.equipe_id].add(em.user_id);
    });
    return m;
  }, [equipesMembros]);

  // Equipe info map
  const equipeNomeMap = useMemo(() => {
    const m: Record<string, { nome: string; cor: string }> = {};
    equipes.forEach(e => { m[e.id] = { nome: e.nome, cor: e.cor || '#3B82F6' }; });
    return m;
  }, [equipes]);

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

  const corretorNomeMap = useMemo(() => {
    const m: Record<string, string> = {};
    corretores.forEach(c => { m[c.user_id] = c.nome; });
    return m;
  }, [corretores]);

  // Apply local filters (empreendimento, imobiliária, corretor, equipe)
  const fichas = useMemo(() => {
    return fichasRaw.filter(f => {
      if (empFilter !== 'todos' && f.empreendimento_id !== empFilter) return false;
      if (imobFilter !== 'todos' && f.imobiliaria_id !== imobFilter) return false;
      if (corretorFilter !== 'todos' && f.user_id !== corretorFilter) return false;
      if (equipeFilter !== 'todos') {
        if (!f.user_id) return false;
        const userEquipes = userEquipeMap[f.user_id];
        if (!userEquipes || !userEquipes.includes(equipeFilter)) return false;
      }
      return true;
    });
  }, [fichasRaw, empFilter, imobFilter, corretorFilter, equipeFilter, userEquipeMap]);

  // KPIs current
  const kpis = useMemo(() => {
    const total = fichas.length;
    const confirmados = fichas.filter(f => isFichaConfirmada(f.status)).length;
    const taxa = total > 0 ? Math.round((confirmados / total) * 100) : 0;
    const vendas = fichas.filter(f => f.convertido_venda).length;
    const valorVendido = fichas.filter(f => f.convertido_venda && f.valor_venda).reduce((s, f) => s + (f.valor_venda || 0), 0);
    const ticketMedio = vendas > 0 ? valorVendido / vendas : 0;
    return { total, confirmados, taxa, vendas, valorVendido, ticketMedio };
  }, [fichas]);

  // KPIs previous
  const kpisPrev = useMemo(() => {
    const total = fichasPrev.length;
    const confirmados = fichasPrev.filter(f => isFichaConfirmada(f.status)).length;
    const vendas = fichasPrev.filter(f => f.convertido_venda).length;
    const valorVendido = fichasPrev.filter(f => f.convertido_venda && f.valor_venda).reduce((s, f) => s + (f.valor_venda || 0), 0);
    return { total, confirmados, vendas, valorVendido };
  }, [fichasPrev]);

  // Funnel data
  const funnelData = useMemo(() => {
    const total = fichas.length;
    const confirmados = fichas.filter(f => isFichaConfirmada(f.status)).length;
    const vendas = fichas.filter(f => f.convertido_venda).length;
    const noShows = fichas.filter(f => f.status === 'no_show').length;
    return [
      { etapa: 'Criadas', valor: total, fill: 'hsl(var(--muted-foreground))' },
      { etapa: 'Confirmadas', valor: confirmados, fill: 'hsl(var(--primary))' },
      { etapa: 'Vendas', valor: vendas, fill: 'hsl(142 76% 36%)' },
      { etapa: 'No-show', valor: noShows, fill: 'hsl(0 84% 60%)' },
    ];
  }, [fichas]);

  // No-show stats
  const noShowStats = useMemo(() => {
    const noShows = fichas.filter(f => f.status === 'no_show');
    const total = fichas.length;
    const taxa = total > 0 ? Math.round((noShows.length / total) * 100) : 0;
    // Per empreendimento
    const perEmp: Record<string, number> = {};
    noShows.forEach(f => {
      if (f.empreendimento_id) {
        perEmp[f.empreendimento_id] = (perEmp[f.empreendimento_id] || 0) + 1;
      }
    });
    const topEmps = Object.entries(perEmp)
      .map(([id, count]) => ({ nome: empNomeMap[id] || 'Desconhecido', count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    return { total: noShows.length, taxa, topEmps };
  }, [fichas, empNomeMap]);

  // Motivos de perda
  const motivosPerda = useMemo(() => {
    const fichasComMotivo = fichas.filter(f => f.motivo_perda && f.motivo_perda.trim());
    const agrupado: Record<string, number> = {};
    fichasComMotivo.forEach(f => {
      const motivo = f.motivo_perda!.trim();
      agrupado[motivo] = (agrupado[motivo] || 0) + 1;
    });
    return Object.entries(agrupado)
      .map(([motivo, count]) => ({ motivo, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [fichas]);

  // Tempo médio entre etapas
  const tempoMedio = useMemo(() => {
    const tempos: { criacaoConfProp: number[]; criacaoConfComp: number[]; criacaoConfTotal: number[] } = {
      criacaoConfProp: [],
      criacaoConfComp: [],
      criacaoConfTotal: [],
    };
    fichas.forEach(f => {
      const created = parseISO(f.created_at);
      if (f.proprietario_confirmado_em) {
        const diff = differenceInHours(parseISO(f.proprietario_confirmado_em), created);
        if (diff >= 0) tempos.criacaoConfProp.push(diff);
      }
      if (f.comprador_confirmado_em) {
        const diff = differenceInHours(parseISO(f.comprador_confirmado_em), created);
        if (diff >= 0) tempos.criacaoConfComp.push(diff);
      }
      if (isFichaConfirmada(f.status)) {
        const lastConf = [f.proprietario_confirmado_em, f.comprador_confirmado_em]
          .filter(Boolean)
          .map(d => parseISO(d!))
          .sort((a, b) => b.getTime() - a.getTime())[0];
        if (lastConf) {
          const diff = differenceInHours(lastConf, created);
          if (diff >= 0) tempos.criacaoConfTotal.push(diff);
        }
      }
    });
    const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : null;
    const formatHours = (h: number | null) => {
      if (h === null) return '—';
      if (h < 24) return `${h}h`;
      const days = Math.floor(h / 24);
      const rem = h % 24;
      return rem > 0 ? `${days}d ${rem}h` : `${days}d`;
    };
    return {
      confProp: { avg: avg(tempos.criacaoConfProp), count: tempos.criacaoConfProp.length, label: formatHours(avg(tempos.criacaoConfProp)) },
      confComp: { avg: avg(tempos.criacaoConfComp), count: tempos.criacaoConfComp.length, label: formatHours(avg(tempos.criacaoConfComp)) },
      confTotal: { avg: avg(tempos.criacaoConfTotal), count: tempos.criacaoConfTotal.length, label: formatHours(avg(tempos.criacaoConfTotal)) },
    };
  }, [fichas]);

  // Monthly chart data
  const monthlyData = useMemo(() => {
    const months: Record<string, { total: number; confirmados: number; vendas: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const key = format(d, 'yyyy-MM');
      months[key] = { total: 0, confirmados: 0, vendas: 0 };
    }
    fichas.forEach(f => {
      const key = format(parseISO(f.created_at), 'yyyy-MM');
      if (months[key]) {
        months[key].total++;
        if (isFichaConfirmada(f.status)) months[key].confirmados++;
        if (f.convertido_venda) months[key].vendas++;
      }
    });
    return Object.entries(months).map(([key, v]) => ({
      mes: format(parseISO(key + '-01'), 'MMM/yy', { locale: ptBR }),
      ...v,
    }));
  }, [fichas]);

  // Per empreendimento (with valor)
  const perEmpreendimento = useMemo(() => {
    const data: Record<string, { total: number; confirmados: number; vendas: number; valor: number }> = {};
    fichas.forEach(f => {
      if (f.empreendimento_id) {
        if (!data[f.empreendimento_id]) data[f.empreendimento_id] = { total: 0, confirmados: 0, vendas: 0, valor: 0 };
        data[f.empreendimento_id].total++;
        if (isFichaConfirmada(f.status)) data[f.empreendimento_id].confirmados++;
        if (f.convertido_venda) {
          data[f.empreendimento_id].vendas++;
          data[f.empreendimento_id].valor += f.valor_venda || 0;
        }
      }
    });
    return Object.entries(data)
      .map(([id, v]) => ({
        nome: empNomeMap[id] || 'Desconhecido',
        ...v,
        taxaConf: v.total > 0 ? Math.round((v.confirmados / v.total) * 100) : 0,
        taxaVenda: v.total > 0 ? Math.round((v.vendas / v.total) * 100) : 0,
      }))
      .sort((a, b) => b.vendas - a.vendas || b.total - a.total)
      .slice(0, 10);
  }, [fichas, empNomeMap]);

  // Per imobiliária (with valor)
  const perImobiliaria = useMemo(() => {
    const data: Record<string, { total: number; confirmados: number; vendas: number; valor: number }> = {};
    fichas.forEach(f => {
      if (f.imobiliaria_id) {
        if (!data[f.imobiliaria_id]) data[f.imobiliaria_id] = { total: 0, confirmados: 0, vendas: 0, valor: 0 };
        data[f.imobiliaria_id].total++;
        if (isFichaConfirmada(f.status)) data[f.imobiliaria_id].confirmados++;
        if (f.convertido_venda) {
          data[f.imobiliaria_id].vendas++;
          data[f.imobiliaria_id].valor += f.valor_venda || 0;
        }
      }
    });
    return Object.entries(data)
      .map(([id, v]) => ({
        nome: imobNomeMap[id] || 'Desconhecido',
        ...v,
        taxaConf: v.total > 0 ? Math.round((v.confirmados / v.total) * 100) : 0,
        taxaVenda: v.total > 0 ? Math.round((v.vendas / v.total) * 100) : 0,
      }))
      .sort((a, b) => b.vendas - a.vendas || b.total - a.total)
      .slice(0, 10);
  }, [fichas, imobNomeMap]);

  // Ranking corretores
  const rankingCorretores = useMemo(() => {
    const data: Record<string, { total: number; confirmados: number; vendas: number; valor: number }> = {};
    fichas.forEach(f => {
      if (f.user_id) {
        if (!data[f.user_id]) data[f.user_id] = { total: 0, confirmados: 0, vendas: 0, valor: 0 };
        data[f.user_id].total++;
        if (isFichaConfirmada(f.status)) data[f.user_id].confirmados++;
        if (f.convertido_venda) {
          data[f.user_id].vendas++;
          data[f.user_id].valor += f.valor_venda || 0;
        }
      }
    });
    return Object.entries(data)
      .map(([id, v]) => ({
        nome: corretorNomeMap[id] || 'Desconhecido',
        ...v,
        taxaConf: v.total > 0 ? Math.round((v.confirmados / v.total) * 100) : 0,
        taxaVenda: v.total > 0 ? Math.round((v.vendas / v.total) * 100) : 0,
        ticketMedio: v.vendas > 0 ? v.valor / v.vendas : 0,
      }))
      .sort((a, b) => b.vendas - a.vendas || b.total - a.total)
      .slice(0, 15);
  }, [fichas, corretorNomeMap]);

  // Ranking equipes
  const rankingEquipes = useMemo(() => {
    const data: Record<string, { total: number; confirmados: number; vendas: number; valor: number }> = {};
    fichas.forEach(f => {
      if (f.user_id) {
        const eqs = userEquipeMap[f.user_id] || [];
        eqs.forEach(eqId => {
          if (!data[eqId]) data[eqId] = { total: 0, confirmados: 0, vendas: 0, valor: 0 };
          data[eqId].total++;
          if (isFichaConfirmada(f.status)) data[eqId].confirmados++;
          if (f.convertido_venda) {
            data[eqId].vendas++;
            data[eqId].valor += f.valor_venda || 0;
          }
        });
      }
    });
    return Object.entries(data)
      .map(([id, v]) => ({
        id,
        nome: equipeNomeMap[id]?.nome || 'Desconhecida',
        cor: equipeNomeMap[id]?.cor || '#3B82F6',
        ...v,
        taxaConf: v.total > 0 ? Math.round((v.confirmados / v.total) * 100) : 0,
        taxaVenda: v.total > 0 ? Math.round((v.vendas / v.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [fichas, userEquipeMap, equipeNomeMap]);

  // CSV export
  const getEquipeNomeForUser = (userId: string | null) => {
    if (!userId) return '-';
    const eqs = userEquipeMap[userId] || [];
    return eqs.map(eqId => equipeNomeMap[eqId]?.nome || '').filter(Boolean).join(', ') || '-';
  };

  const exportCSV = () => {
    const header = 'Protocolo,Empreendimento,Imobiliária,Corretor,Equipe,Data,Status,Venda,Valor\n';
    const rows = fichas.map(f =>
      `${f.protocolo},${empNomeMap[f.empreendimento_id || ''] || '-'},${imobNomeMap[f.imobiliaria_id || ''] || '-'},${corretorNomeMap[f.user_id || ''] || '-'},${getEquipeNomeForUser(f.user_id)},${format(parseISO(f.created_at), 'dd/MM/yyyy')},${f.status},${f.convertido_venda ? 'Sim' : 'Não'},${f.valor_venda || ''}`
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
    total: { label: 'Total', color: 'hsl(var(--muted-foreground))' },
    confirmados: { label: 'Confirmados', color: 'hsl(var(--primary))' },
    vendas: { label: 'Vendas', color: 'hsl(142 76% 36%)' },
  };

  const hasActiveFilters = empFilter !== 'todos' || imobFilter !== 'todos' || corretorFilter !== 'todos' || statusFilter !== 'todos' || equipeFilter !== 'todos';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold">Relatórios</h1>
          <p className="text-muted-foreground">Análises detalhadas com filtros avançados</p>
        </div>
        <Button variant="outline" onClick={exportCSV} disabled={!fichas.length}>
          <Download className="h-4 w-4 mr-2" /> Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filtros
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-6 px-2"
                onClick={() => {
                  setStatusFilter('todos');
                  setEmpFilter('todos');
                  setImobFilter('todos');
                  setCorretorFilter('todos');
                  setEquipeFilter('todos');
                }}
              >
                Limpar filtros
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Data início</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal text-xs sm:text-sm")}>
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                    {format(dataInicio, 'dd/MM/yy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dataInicio} onSelect={(d) => d && setDataInicio(d)} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Data fim</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal text-xs sm:text-sm")}>
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                    {format(dataFim, 'dd/MM/yy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dataFim} onSelect={(d) => d && setDataFim(d)} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="text-xs sm:text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Empreendimento</label>
              <Select value={empFilter} onValueChange={setEmpFilter}>
                <SelectTrigger className="text-xs sm:text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {empreendimentos.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Imobiliária</label>
              <Select value={imobFilter} onValueChange={setImobFilter}>
                <SelectTrigger className="text-xs sm:text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {imobiliarias.map(i => (
                    <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Corretor</label>
              <Select value={corretorFilter} onValueChange={setCorretorFilter}>
                <SelectTrigger className="text-xs sm:text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {corretores.map(c => (
                    <SelectItem key={c.user_id} value={c.user_id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards with MoM */}
      {loadingFichas ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl sm:text-2xl font-bold">{kpis.total}</p>
              <VarBadge current={kpis.total} previous={kpisPrev.total} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Confirmados</p>
              <p className="text-xl sm:text-2xl font-bold">{kpis.confirmados}</p>
              <VarBadge current={kpis.confirmados} previous={kpisPrev.confirmados} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Taxa Confirmação</p>
              <p className="text-xl sm:text-2xl font-bold">{kpis.taxa}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Vendas</p>
              <p className="text-xl sm:text-2xl font-bold">{kpis.vendas}</p>
              <VarBadge current={kpis.vendas} previous={kpisPrev.vendas} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Valor Vendido</p>
              <p className="text-lg sm:text-xl font-bold">R$ {kpis.valorVendido.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
              <VarBadge current={kpis.valorVendido} previous={kpisPrev.valorVendido} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Ticket Médio</p>
              <p className="text-lg sm:text-xl font-bold">R$ {kpis.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Funnel + Monthly Chart */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Visual Funnel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowRight className="h-4 w-4" /> Funil de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {funnelData.map((item, index) => {
                const maxVal = funnelData[0].valor || 1;
                const pct = Math.round((item.valor / maxVal) * 100);
                const convRate = index > 0 && funnelData[index - 1].valor > 0
                  ? Math.round((item.valor / funnelData[index - 1].valor) * 100)
                  : null;
                return (
                  <div key={item.etapa}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">{item.etapa}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{item.valor}</span>
                        {convRate !== null && (
                          <Badge variant="secondary" className="text-xs">
                            {convRate}%
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="h-8 bg-muted rounded-md overflow-hidden">
                      <div
                        className="h-full rounded-md transition-all duration-500"
                        style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: item.fill }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {kpis.total > 0 && (
              <p className="text-xs text-muted-foreground text-center mt-4">
                Conversão geral: {kpis.total > 0 ? Math.round((kpis.vendas / kpis.total) * 100) : 0}% (criadas → vendas)
              </p>
            )}
          </CardContent>
        </Card>

        {/* Monthly evolution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Evolução Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={monthlyConfig} className="h-[260px] w-full">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="mes" className="text-xs" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} className="text-xs" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="total" fill="var(--color-total)" radius={[0, 0, 0, 0]} opacity={0.3} />
                <Bar dataKey="confirmados" fill="var(--color-confirmados)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="vendas" fill="var(--color-vendas)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Ranking Corretores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" /> Ranking de Corretores
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rankingCorretores.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sem dados no período</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Corretor</TableHead>
                    <TableHead className="text-center">Fichas</TableHead>
                    <TableHead className="text-center">Confirmadas</TableHead>
                    <TableHead className="text-center">Taxa Conf.</TableHead>
                    <TableHead className="text-center">Vendas</TableHead>
                    <TableHead className="text-center">Taxa Venda</TableHead>
                    <TableHead className="text-right">Valor Vendido</TableHead>
                    <TableHead className="text-right">Ticket Médio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankingCorretores.map((c, i) => (
                    <TableRow key={c.nome + i}>
                      <TableCell>
                        {i === 0 ? <Medal className="h-4 w-4 text-amber-500" /> :
                         i === 1 ? <Medal className="h-4 w-4 text-gray-400" /> :
                         i === 2 ? <Medal className="h-4 w-4 text-amber-700" /> :
                         <span className="text-sm text-muted-foreground">{i + 1}</span>}
                      </TableCell>
                      <TableCell className="font-medium text-sm">{c.nome}</TableCell>
                      <TableCell className="text-center text-sm">{c.total}</TableCell>
                      <TableCell className="text-center text-sm">{c.confirmados}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={c.taxaConf >= 70 ? 'default' : c.taxaConf >= 40 ? 'secondary' : 'outline'} className="text-xs">
                          {c.taxaConf}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium text-sm">{c.vendas}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={c.taxaVenda >= 20 ? 'default' : 'secondary'} className="text-xs">
                          {c.taxaVenda}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {c.valor > 0 ? `R$ ${c.valor.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}` : '-'}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {c.ticketMedio > 0 ? `R$ ${c.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ranking Imobiliárias Parceiras + Conversão por Empreendimento */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building className="h-4 w-4" /> Ranking de Parceiros
            </CardTitle>
          </CardHeader>
          <CardContent>
            {perImobiliaria.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sem dados no período</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Imobiliária</TableHead>
                      <TableHead className="text-center">Fichas</TableHead>
                      <TableHead className="text-center">Conf.</TableHead>
                      <TableHead className="text-center">Vendas</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {perImobiliaria.map((item, i) => (
                      <TableRow key={item.nome + i}>
                        <TableCell>
                          {i < 3 ? <Medal className={`h-4 w-4 ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : 'text-amber-700'}`} /> :
                           <span className="text-sm text-muted-foreground">{i + 1}</span>}
                        </TableCell>
                        <TableCell className="font-medium text-sm truncate max-w-[150px]">{item.nome}</TableCell>
                        <TableCell className="text-center text-sm">{item.total}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="text-xs">{item.taxaConf}%</Badge>
                        </TableCell>
                        <TableCell className="text-center font-medium text-sm">{item.vendas}</TableCell>
                        <TableCell className="text-right text-sm">
                          {item.valor > 0 ? `R$ ${item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Conversão por Empreendimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {perEmpreendimento.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sem dados no período</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empreendimento</TableHead>
                      <TableHead className="text-center">Fichas</TableHead>
                      <TableHead className="text-center">Conf.</TableHead>
                      <TableHead className="text-center">Vendas</TableHead>
                      <TableHead className="text-center">Conv.</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {perEmpreendimento.map((item, i) => (
                      <TableRow key={item.nome + i}>
                        <TableCell className="font-medium text-sm truncate max-w-[150px]">{item.nome}</TableCell>
                        <TableCell className="text-center text-sm">{item.total}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="text-xs">{item.taxaConf}%</Badge>
                        </TableCell>
                        <TableCell className="text-center font-medium text-sm">{item.vendas}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={item.taxaVenda >= 20 ? 'default' : 'secondary'} className="text-xs">
                            {item.taxaVenda}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {item.valor > 0 ? `R$ ${item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}` : '-'}
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

      {/* Phase 4: No-show, Motivos de Perda, Tempo Médio */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* No-show */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <UserX className="h-4 w-4 text-destructive" /> No-show
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <p className="text-3xl font-bold">{noShowStats.total}</p>
              <p className="text-sm text-muted-foreground">
                {noShowStats.taxa}% das fichas
              </p>
            </div>
            {noShowStats.topEmps.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Por empreendimento:</p>
                {noShowStats.topEmps.map((e, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="truncate mr-2">{e.nome}</span>
                    <Badge variant="outline" className="text-xs">{e.count}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center">Nenhum no-show registrado</p>
            )}
          </CardContent>
        </Card>

        {/* Motivos de Perda */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" /> Motivos de Perda
            </CardTitle>
          </CardHeader>
          <CardContent>
            {motivosPerda.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">Nenhum motivo registrado</p>
                <p className="text-xs text-muted-foreground mt-1">Registre motivos de perda nas fichas para ver dados aqui</p>
              </div>
            ) : (
              <div className="space-y-2">
                {motivosPerda.map((m, i) => {
                  const maxCount = motivosPerda[0].count;
                  const pct = Math.round((m.count / maxCount) * 100);
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="truncate mr-2">{m.motivo}</span>
                        <span className="font-medium shrink-0">{m.count}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-destructive/60 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tempo Médio entre Etapas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Timer className="h-4 w-4" /> Tempo Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Criação → Confirmação total</p>
                <p className="text-xl font-bold">{tempoMedio.confTotal.label}</p>
                <p className="text-xs text-muted-foreground">{tempoMedio.confTotal.count} fichas</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Criação → Conf. Proprietário</p>
                <p className="text-lg font-bold">{tempoMedio.confProp.label}</p>
                <p className="text-xs text-muted-foreground">{tempoMedio.confProp.count} fichas</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Criação → Conf. Comprador</p>
                <p className="text-lg font-bold">{tempoMedio.confComp.label}</p>
                <p className="text-xs text-muted-foreground">{tempoMedio.confComp.count} fichas</p>
              </div>
            </div>
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
                    <TableHead>Corretor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Venda</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fichas.slice(0, 50).map(f => (
                    <TableRow key={f.id}>
                      <TableCell className="font-mono text-xs">{f.protocolo}</TableCell>
                      <TableCell className="text-sm">{empNomeMap[f.empreendimento_id || ''] || '-'}</TableCell>
                      <TableCell className="text-sm">{imobNomeMap[f.imobiliaria_id || ''] || '-'}</TableCell>
                      <TableCell className="text-sm">{corretorNomeMap[f.user_id || ''] || '-'}</TableCell>
                      <TableCell className="text-sm">{format(parseISO(f.created_at), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant={isFichaConfirmada(f.status) ? 'default' : 'secondary'}>
                          {f.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{f.convertido_venda ? '✅' : '-'}</TableCell>
                      <TableCell className="text-right text-sm">
                        {f.valor_venda ? `R$ ${f.valor_venda.toLocaleString('pt-BR')}` : '-'}
                      </TableCell>
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
    </div>
  );
}
