import { useEffect, useState, useMemo } from 'react';
import { fichaStatusColors, getStatusColor } from '@/lib/statusColors';
import { isFichaConfirmada } from '@/lib/fichaStatus';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileText, 
  Loader2, 
  Filter,
  FileSpreadsheet,
  FileDown,
  TrendingUp,
  Target,
  Star,
  CheckCircle,
  Users,
  Trophy,
  PartyPopper,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useImobiliariaFeatureFlag } from '@/hooks/useImobiliariaFeatureFlag';
import { Progress } from '@/components/ui/progress';

interface FichaRelatorio {
  id: string;
  protocolo: string;
  imovel_endereco: string;
  imovel_tipo: string;
  proprietario_nome: string | null;
  comprador_nome: string | null;
  data_visita: string;
  status: string;
  created_at: string;
  corretor_nome?: string;
  user_id: string;
  convertido_venda?: boolean;
  valor_venda?: number | null;
}

interface Survey {
  id: string;
  corretor_id: string;
  status: string;
}

interface SurveyResponse {
  survey_id: string;
  rating_location: number;
  rating_size: number;
  rating_layout: number;
  rating_finishes: number;
  rating_conservation: number;
  rating_common_areas: number;
  rating_price: number;
}

interface CorretorPerformance {
  user_id: string;
  nome: string;
  totalFichas: number;
  fichasConfirmadas: number;
  taxaConfirmacao: number;
  totalSurveys: number;
  surveysRespondidas: number;
  mediaAvaliacao: number | null;
  vendas: number;
  valorVendas: number;
}

export default function EmpresaRelatorios() {
  const { imobiliariaId } = useUserRole();
  const { enabled: surveyEnabled } = useImobiliariaFeatureFlag('post_visit_survey');
  const [fichas, setFichas] = useState<FichaRelatorio[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  // Filters
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().split('T')[0];
  });
  const [dataFim, setDataFim] = useState(() => new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  async function fetchFichas() {
    if (!imobiliariaId) return;

    setLoading(true);
    try {
      let query = supabase
        .from('fichas_visita')
        .select(`
          id,
          protocolo,
          imovel_endereco,
          imovel_tipo,
          proprietario_nome,
          comprador_nome,
          data_visita,
          status,
          created_at,
          user_id,
          convertido_venda,
          valor_venda
        `)
        .eq('imobiliaria_id', imobiliariaId)
        .gte('created_at', `${dataInicio}T00:00:00`)
        .lte('created_at', `${dataFim}T23:59:59`)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'todos') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch corretor names
      const userIds = [...new Set((data || []).map(f => f.user_id))];
      
      let corretorMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, nome')
          .in('user_id', userIds);

        corretorMap = (profiles || []).reduce((acc, p) => {
          acc[p.user_id] = p.nome;
          return acc;
        }, {} as Record<string, string>);
      }

      const enrichedFichas = (data || []).map(f => ({
        ...f,
        corretor_nome: corretorMap[f.user_id] || 'Desconhecido'
      }));

      setFichas(enrichedFichas);

      // Fetch surveys if enabled
      if (surveyEnabled) {
        const { data: surveysData } = await supabase
          .from('surveys')
          .select('id, corretor_id, status')
          .eq('imobiliaria_id', imobiliariaId);

        if (surveysData && surveysData.length > 0) {
          setSurveys(surveysData);

          const surveyIds = surveysData.map(s => s.id);
          const { data: responsesData } = await supabase
            .from('survey_responses')
            .select('survey_id, rating_location, rating_size, rating_layout, rating_finishes, rating_conservation, rating_common_areas, rating_price')
            .in('survey_id', surveyIds);

          setSurveyResponses(responsesData || []);
        }
      }
    } catch (error) {
      console.error('Error fetching fichas:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFichas();
  }, [imobiliariaId, dataInicio, dataFim, statusFilter, surveyEnabled]);

  // Calculate monthly data for chart
  const monthlyData = useMemo(() => {
    const months: { month: string; fichas: number; confirmadas: number }[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = format(date, 'yyyy-MM');
      const monthLabel = format(date, 'MMM', { locale: ptBR });
      
      const monthFichas = fichas.filter(f => 
        f.created_at.startsWith(monthKey)
      );
      
      months.push({
        month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        fichas: monthFichas.length,
        confirmadas: monthFichas.filter(f => isFichaConfirmada(f.status)).length
      });
    }
    
    return months;
  }, [fichas]);

  // Calculate performance data per broker
  const performanceData = useMemo(() => {
    const corretorMap = new Map<string, CorretorPerformance>();
    
    fichas.forEach(f => {
      const existing = corretorMap.get(f.user_id);
      const isConfirmada = isFichaConfirmada(f.status);
      const isVenda = f.convertido_venda === true;
      const valorVenda = f.valor_venda || 0;
      
      if (existing) {
        existing.totalFichas++;
        if (isConfirmada) existing.fichasConfirmadas++;
        if (isVenda) {
          existing.vendas++;
          existing.valorVendas += valorVenda;
        }
      } else {
        corretorMap.set(f.user_id, {
          user_id: f.user_id,
          nome: f.corretor_nome || 'Desconhecido',
          totalFichas: 1,
          fichasConfirmadas: isConfirmada ? 1 : 0,
          taxaConfirmacao: 0,
          totalSurveys: 0,
          surveysRespondidas: 0,
          mediaAvaliacao: null,
          vendas: isVenda ? 1 : 0,
          valorVendas: isVenda ? valorVenda : 0
        });
      }
    });

    // Add survey data
    if (surveyEnabled) {
      surveys.forEach(s => {
        const corretor = corretorMap.get(s.corretor_id);
        if (corretor) {
          corretor.totalSurveys++;
          if (s.status === 'responded') {
            corretor.surveysRespondidas++;
          }
        }
      });

      // Calculate average ratings
      corretorMap.forEach((corretor) => {
        const corretorSurveys = surveys.filter(s => s.corretor_id === corretor.user_id && s.status === 'responded');
        const surveyIds = corretorSurveys.map(s => s.id);
        const responses = surveyResponses.filter(r => surveyIds.includes(r.survey_id));
        
        if (responses.length > 0) {
          const allRatings = responses.flatMap(r => [
            r.rating_location, r.rating_size, r.rating_layout,
            r.rating_finishes, r.rating_conservation, r.rating_common_areas, r.rating_price
          ]);
          corretor.mediaAvaliacao = allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
        }
      });
    }

    // Calculate confirmation rates
    corretorMap.forEach(corretor => {
      corretor.taxaConfirmacao = corretor.totalFichas > 0 
        ? (corretor.fichasConfirmadas / corretor.totalFichas) * 100 
        : 0;
    });

    return Array.from(corretorMap.values()).sort((a, b) => b.totalFichas - a.totalFichas);
  }, [fichas, surveys, surveyResponses, surveyEnabled]);

  // Calculate monthly ranking (top 5 for current month)
  const rankingMensal = useMemo(() => {
    const currentMonth = format(new Date(), 'yyyy-MM');
    
    // Filter only current month fichas
    const fichasMes = fichas.filter(f => f.created_at.startsWith(currentMonth));
    
    // Group by corretor
    const corretorMap = new Map<string, { 
      user_id: string; 
      nome: string; 
      fichasMes: number; 
      confirmadas: number;
    }>();
    
    fichasMes.forEach(f => {
      const existing = corretorMap.get(f.user_id);
      if (existing) {
        existing.fichasMes++;
        if (isFichaConfirmada(f.status)) existing.confirmadas++;
      } else {
        corretorMap.set(f.user_id, {
          user_id: f.user_id,
          nome: f.corretor_nome || 'Desconhecido',
          fichasMes: 1,
          confirmadas: isFichaConfirmada(f.status) ? 1 : 0
        });
      }
    });
    
    // Sort and get top 5
    return Array.from(corretorMap.values())
      .sort((a, b) => b.fichasMes - a.fichasMes)
      .slice(0, 5);
  }, [fichas]);

  // Calculate overall metrics
  const overallMetrics = useMemo(() => {
    const totalFichas = fichas.length;
    const confirmadas = fichas.filter(f => isFichaConfirmada(f.status)).length;
    const taxaConfirmacao = totalFichas > 0 ? (confirmadas / totalFichas) * 100 : 0;
    
    // Sales metrics
    const vendas = fichas.filter(f => f.convertido_venda === true).length;
    const volumeVendas = fichas
      .filter(f => f.convertido_venda === true)
      .reduce((sum, f) => sum + (f.valor_venda || 0), 0);
    const taxaConversao = confirmadas > 0 ? (vendas / confirmadas) * 100 : 0;
    
    let mediaGeral: number | null = null;
    if (surveyEnabled && surveyResponses.length > 0) {
      const allRatings = surveyResponses.flatMap(r => [
        r.rating_location, r.rating_size, r.rating_layout,
        r.rating_finishes, r.rating_conservation, r.rating_common_areas, r.rating_price
      ]);
      mediaGeral = allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
    }

    return { totalFichas, confirmadas, taxaConfirmacao, mediaGeral, vendas, volumeVendas, taxaConversao };
  }, [fichas, surveyResponses, surveyEnabled]);

  const maxFichas = Math.max(...performanceData.map(p => p.totalFichas), 1);

  function exportToCSV() {
    setExporting(true);
    
    try {
      const headers = [
        'Protocolo',
        'Corretor',
        'Endereço',
        'Tipo',
        'Proprietário',
        'Comprador',
        'Data Visita',
        'Status',
        'Criado em'
      ];

      const rows = fichas.map(f => [
        f.protocolo,
        f.corretor_nome || '',
        f.imovel_endereco,
        f.imovel_tipo,
        f.proprietario_nome || '',
        f.comprador_nome || '',
        format(new Date(f.data_visita), "dd/MM/yyyy HH:mm", { locale: ptBR }),
        f.status,
        format(new Date(f.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
      ]);

      const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `relatorio_registros_${dataInicio}_${dataFim}.csv`;
      link.click();

      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Erro ao exportar relatório');
    } finally {
      setExporting(false);
    }
  }

  async function exportToPDF() {
    setExporting(true);
    
    try {
      // Generate a simple HTML report and print it
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Permita pop-ups para exportar PDF');
        return;
      }

      const statusLabels: Record<string, string> = {
        pendente: 'Pendente',
        aguardando_proprietario: 'Aguardando Proprietário',
        aguardando_comprador: 'Aguardando Comprador',
        completo: 'Completo',
        cancelado: 'Cancelado',
      };

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Relatório de Registros de Visita</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1e40af; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #1e40af; color: white; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .stats { display: flex; gap: 20px; margin-bottom: 20px; }
            .stat { background: #f3f4f6; padding: 10px 20px; border-radius: 8px; }
            .stat-value { font-size: 24px; font-weight: bold; color: #1e40af; }
            .stat-label { font-size: 12px; color: #6b7280; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Relatório de Registros de Visita</h1>
            <p>Período: ${format(new Date(dataInicio), "dd/MM/yyyy", { locale: ptBR })} - ${format(new Date(dataFim), "dd/MM/yyyy", { locale: ptBR })}</p>
          </div>
          
          <div class="stats">
            <div class="stat">
              <div class="stat-value">${fichas.length}</div>
              <div class="stat-label">Total de Registros</div>
            </div>
            <div class="stat">
              <div class="stat-value">${fichas.filter(f => isFichaConfirmada(f.status)).length}</div>
              <div class="stat-label">Completas</div>
            </div>
            <div class="stat">
              <div class="stat-value">${fichas.filter(f => f.status === 'pendente').length}</div>
              <div class="stat-label">Pendentes</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Protocolo</th>
                <th>Corretor</th>
                <th>Endereço</th>
                <th>Proprietário</th>
                <th>Comprador</th>
                <th>Data Visita</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${fichas.map(f => `
                <tr>
                  <td>${f.protocolo}</td>
                  <td>${f.corretor_nome || '-'}</td>
                  <td>${f.imovel_endereco}</td>
                  <td>${f.proprietario_nome || '-'}</td>
                  <td>${f.comprador_nome || '-'}</td>
                  <td>${format(new Date(f.data_visita), "dd/MM/yyyy HH:mm", { locale: ptBR })}</td>
                  <td>${statusLabels[f.status] || f.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <script>window.print(); window.close();</script>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      toast.success('Relatório gerado! Use Ctrl+P para salvar como PDF.');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Erro ao gerar relatório');
    } finally {
      setExporting(false);
    }
  }

  const statusLabels: Record<string, string> = {
    pendente: 'Pendente',
    aguardando_proprietario: 'Aguard. Proprietário',
    aguardando_comprador: 'Aguard. Comprador',
    completo: 'Completo',
    cancelado: 'Cancelado',
  };

  // Using fichaStatusColors from lib/statusColors

  return (<div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Relatórios</h1>
            <p className="text-muted-foreground">Visualize e exporte relatórios da sua imobiliária</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV} disabled={exporting || fichas.length === 0}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button onClick={exportToPDF} disabled={exporting || fichas.length === 0}>
              <FileDown className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="aguardando_proprietario">Aguardando Proprietário</SelectItem>
                    <SelectItem value="aguardando_comprador">Aguardando Comprador</SelectItem>
                    <SelectItem value="completo">Completo</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary cards */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{overallMetrics.totalFichas}</p>
                  <p className="text-xs text-muted-foreground">Total Registros</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-success">{overallMetrics.confirmadas}</p>
                  <p className="text-xs text-muted-foreground">Completas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <TrendingUp className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{overallMetrics.taxaConfirmacao.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">Taxa Confirmação</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{performanceData.length}</p>
                  <p className="text-xs text-muted-foreground">Corretores Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          {surveyEnabled && overallMetrics.mediaGeral !== null && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning/10">
                    <Star className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{overallMetrics.mediaGeral.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Média Avaliações</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sales Metrics Row */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <PartyPopper className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-success">{overallMetrics.vendas}</p>
                  <p className="text-xs text-muted-foreground">Vendas Registradas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{overallMetrics.taxaConversao.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">Taxa de Conversão</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <DollarSign className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-success">
                    {overallMetrics.volumeVendas > 0 
                      ? overallMetrics.volumeVendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
                      : 'R$ 0'}
                  </p>
                  <p className="text-xs text-muted-foreground">Volume de Vendas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly evolution chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolução Mensal
            </CardTitle>
            <CardDescription>
              Registros criados vs confirmados nos últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="fichas" name="Total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="confirmadas" name="Confirmadas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Ranking - Top 5 */}
        {rankingMensal.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-warning" />
                  Ranking do Mês
                </CardTitle>
                <Badge variant="outline">
                  {format(new Date(), 'MMMM', { locale: ptBR }).charAt(0).toUpperCase() + format(new Date(), 'MMMM', { locale: ptBR }).slice(1)}
                </Badge>
              </div>
              <CardDescription>
                Top 5 corretores com mais registros este mês
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rankingMensal.map((corretor, index) => {
                  const maxFichasMes = rankingMensal[0]?.fichasMes || 1;
                  const percent = (corretor.fichasMes / maxFichasMes) * 100;
                  
                  return (
                    <div key={corretor.user_id} className="flex items-center gap-3">
                      {/* Position with medal */}
                      <div className="w-8 text-center flex-shrink-0">
                        {index === 0 && <span className="text-xl">🥇</span>}
                        {index === 1 && <span className="text-xl">🥈</span>}
                        {index === 2 && <span className="text-xl">🥉</span>}
                        {index > 2 && (
                          <span className="text-sm font-medium text-muted-foreground">
                            {index + 1}º
                          </span>
                        )}
                      </div>
                      
                      {/* Name and progress bar */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium truncate">{corretor.nome}</span>
                          <span className="text-sm text-muted-foreground ml-2 flex-shrink-0">
                            {corretor.fichasMes} {corretor.fichasMes === 1 ? 'ficha' : 'fichas'}
                          </span>
                        </div>
                        <Progress value={percent} className="h-2" />
                      </div>
                      
                      {/* Confirmation rate badge */}
                      <Badge variant="outline" className={
                        corretor.confirmadas === corretor.fichasMes && corretor.fichasMes > 0
                          ? 'bg-success/20 text-success border-success/30 flex-shrink-0'
                          : 'bg-muted flex-shrink-0'
                      }>
                        {corretor.confirmadas}/{corretor.fichasMes}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance per broker */}
        {performanceData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Performance por Corretor
              </CardTitle>
              <CardDescription>
                Métricas individuais de cada corretor da imobiliária
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceData.map((corretor) => (
                  <div key={corretor.user_id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{corretor.nome}</h4>
                      <div className="flex items-center gap-2">
                        {surveyEnabled && corretor.mediaAvaliacao !== null && (
                          <Badge className="bg-warning/20 text-warning border-warning/30">
                            ★ {corretor.mediaAvaliacao.toFixed(1)}
                          </Badge>
                        )}
                        <Badge variant="outline" className={
                          corretor.taxaConfirmacao >= 70 
                            ? 'bg-success/20 text-success border-success/30'
                            : corretor.taxaConfirmacao >= 40
                            ? 'bg-warning/20 text-warning border-warning/30'
                            : 'bg-muted text-muted-foreground'
                        }>
                          {corretor.taxaConfirmacao.toFixed(0)}% confirmação
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-muted-foreground">Registros</p>
                        <p className="font-bold text-lg">{corretor.totalFichas}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Confirmados</p>
                        <p className="font-bold text-lg text-success">{corretor.fichasConfirmadas}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Pendentes</p>
                        <p className="font-bold text-lg text-warning">{corretor.totalFichas - corretor.fichasConfirmadas}</p>
                      </div>
                      {surveyEnabled && (
                        <div>
                          <p className="text-muted-foreground">Pesquisas</p>
                          <p className="font-bold text-lg">{corretor.surveysRespondidas}/{corretor.totalSurveys}</p>
                        </div>
                      )}
                    </div>
                    
                    <Progress 
                      value={(corretor.totalFichas / maxFichas) * 100} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Registros de Visita</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : fichas.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Nenhum registro encontrado</h3>
                <p className="text-muted-foreground">Ajuste os filtros para ver mais resultados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Protocolo</TableHead>
                      <TableHead>Corretor</TableHead>
                      <TableHead className="hidden md:table-cell">Endereço</TableHead>
                      <TableHead className="hidden lg:table-cell">Proprietário</TableHead>
                      <TableHead className="hidden lg:table-cell">Comprador</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fichas.map((ficha) => (
                      <TableRow key={ficha.id}>
                        <TableCell className="font-mono text-sm">{ficha.protocolo}</TableCell>
                        <TableCell>{ficha.corretor_nome}</TableCell>
                        <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                          {ficha.imovel_endereco}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {ficha.proprietario_nome || '-'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {ficha.comprador_nome || '-'}
                        </TableCell>
                        <TableCell>
                          {format(new Date(ficha.data_visita), "dd/MM/yy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(fichaStatusColors, ficha.status)}>
                            {statusLabels[ficha.status] || ficha.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>);
}
