import { useEffect, useState } from 'react';
import { ImobiliariaLayout } from '@/components/layouts/ImobiliariaLayout';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Download, 
  Loader2, 
  Calendar,
  Filter,
  FileSpreadsheet,
  FileDown
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

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
}

export default function EmpresaRelatorios() {
  const { imobiliariaId } = useUserRole();
  const [fichas, setFichas] = useState<FichaRelatorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  // Filters
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
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
          user_id
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
    } catch (error) {
      console.error('Error fetching fichas:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFichas();
  }, [imobiliariaId, dataInicio, dataFim, statusFilter]);

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
      link.download = `relatorio_fichas_${dataInicio}_${dataFim}.csv`;
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
          <title>Relatório de Fichas de Visita</title>
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
            <h1>Relatório de Fichas de Visita</h1>
            <p>Período: ${format(new Date(dataInicio), "dd/MM/yyyy", { locale: ptBR })} - ${format(new Date(dataFim), "dd/MM/yyyy", { locale: ptBR })}</p>
          </div>
          
          <div class="stats">
            <div class="stat">
              <div class="stat-value">${fichas.length}</div>
              <div class="stat-label">Total de Fichas</div>
            </div>
            <div class="stat">
              <div class="stat-value">${fichas.filter(f => f.status === 'completo').length}</div>
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

  const statusColors: Record<string, string> = {
    pendente: 'bg-warning/20 text-warning border-warning/30',
    aguardando_proprietario: 'bg-warning/20 text-warning border-warning/30',
    aguardando_comprador: 'bg-warning/20 text-warning border-warning/30',
    completo: 'bg-success/20 text-success border-success/30',
    cancelado: 'bg-muted text-muted-foreground',
  };

  return (
    <ImobiliariaLayout>
      <div className="space-y-6">
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
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{fichas.length}</div>
              <p className="text-sm text-muted-foreground">Total de Fichas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-success">
                {fichas.filter(f => f.status === 'completo').length}
              </div>
              <p className="text-sm text-muted-foreground">Completas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-warning">
                {fichas.filter(f => ['pendente', 'aguardando_proprietario', 'aguardando_comprador'].includes(f.status)).length}
              </div>
              <p className="text-sm text-muted-foreground">Pendentes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {new Set(fichas.map(f => f.corretor_nome)).size}
              </div>
              <p className="text-sm text-muted-foreground">Corretores Ativos</p>
            </CardContent>
          </Card>
        </div>

        {/* Data table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fichas de Visita</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : fichas.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Nenhuma ficha encontrada</h3>
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
                          <Badge variant="outline" className={statusColors[ficha.status]}>
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
      </div>
    </ImobiliariaLayout>
  );
}
