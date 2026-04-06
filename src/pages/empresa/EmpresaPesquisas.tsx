import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ClipboardCheck,
  Loader2,
  CheckCircle,
  Clock,
  ExternalLink,
  Star,
  ArrowLeft,
  Download,
  FileSpreadsheet,
  FileText,
  BarChart3,
  MapPin,
  Calendar,
} from 'lucide-react';
import { useSurveyExport } from '@/hooks/useSurveyExport';
import { toast } from 'sonner';
import { DeleteSurveyDialog } from '@/components/DeleteSurveyDialog';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';

interface SurveyResponse {
  id: string;
  rating_location: number;
  rating_size: number;
  rating_layout: number;
  rating_finishes: number;
  rating_conservation: number;
  rating_common_areas: number;
  rating_price: number;
  liked_most: string | null;
  liked_least: string | null;
  would_buy: boolean;
  created_at: string;
}

interface Survey {
  id: string;
  token: string;
  status: string;
  sent_at: string | null;
  responded_at: string | null;
  client_name: string | null;
  client_phone: string | null;
  ficha_id: string;
  corretor_nome?: string | null;
  fichas_visita: {
    id: string;
    imovel_endereco: string;
    imovel_tipo: string;
    data_visita: string;
    comprador_nome: string | null;
    protocolo: string;
    user_id: string;
  } | null;
  survey_responses: SurveyResponse[];
}

type FilterStatus = 'all' | 'pending' | 'responded';

export default function EmpresaPesquisas() {
  const { imobiliariaId, imobiliaria } = useUserRole();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const { exportToExcel, exportToPDF, exportSingleToPDF } = useSurveyExport();
  const navigate = useNavigate();

  const { data: surveys, isLoading, refetch } = useQuery({
    queryKey: ['empresa-surveys', imobiliariaId, filter],
    queryFn: async () => {
      let query = supabase
        .from('surveys')
        .select(`
          id,
          token,
          status,
          sent_at,
          responded_at,
          client_name,
          client_phone,
          ficha_id,
          fichas_visita (
            id,
            imovel_endereco,
            imovel_tipo,
            data_visita,
            comprador_nome,
            protocolo,
            user_id
          ),
          survey_responses (
            id,
            rating_location,
            rating_size,
            rating_layout,
            rating_finishes,
            rating_conservation,
            rating_common_areas,
            rating_price,
            liked_most,
            liked_least,
            would_buy,
            created_at
          )
        `)
        .eq('imobiliaria_id', imobiliariaId)
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('status', 'pending');
      } else if (filter === 'responded') {
        query = query.eq('status', 'responded');
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch corretor names from profiles
      const userIds = [...new Set((data || []).map(s => (s.fichas_visita as any)?.user_id).filter(Boolean))] as string[];
      let profilesMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, nome')
          .in('user_id', userIds);
        if (profiles) {
          profilesMap = Object.fromEntries(profiles.map(p => [p.user_id, p.nome]));
        }
      }
      
      return (data || []).map(survey => ({
        ...survey,
        corretor_nome: (survey.fichas_visita as any)?.user_id ? profilesMap[(survey.fichas_visita as any).user_id] || null : null,
        survey_responses: Array.isArray(survey.survey_responses) 
          ? survey.survey_responses 
          : survey.survey_responses ? [survey.survey_responses] : []
      })) as Survey[];
    },
    enabled: !!imobiliariaId,
  });

  const ratingLabels: Record<string, string> = {
    rating_location: 'Localização',
    rating_size: 'Tamanho',
    rating_layout: 'Planta',
    rating_finishes: 'Acabamentos',
    rating_conservation: 'Conservação',
    rating_common_areas: 'Áreas comuns',
    rating_price: 'Preço',
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
      case 'sent':
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-600">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      case 'responded':
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Respondida
          </Badge>
        );
      default:
        return null;
    }
  };

  const response = selectedSurvey?.survey_responses?.[0];

  // Calculate stats
  const totalSurveys = surveys?.length || 0;
  const respondedSurveys = surveys?.filter(s => s.status === 'responded').length || 0;
  const pendingSurveys = surveys?.filter(s => s.status === 'pending' || s.status === 'sent').length || 0;

  // Calculate averages for chart
  const averagesData = useMemo(() => {
    const respondedSurveysList = surveys?.filter(s => s.status === 'responded') || [];
    const responses = respondedSurveysList.flatMap(s => s.survey_responses);
    
    if (responses.length === 0) return null;
    
    const criteria = [
      { key: 'rating_location' as const, label: 'Localização' },
      { key: 'rating_size' as const, label: 'Tamanho' },
      { key: 'rating_layout' as const, label: 'Planta' },
      { key: 'rating_finishes' as const, label: 'Acabamentos' },
      { key: 'rating_conservation' as const, label: 'Conservação' },
      { key: 'rating_common_areas' as const, label: 'Áreas Comuns' },
      { key: 'rating_price' as const, label: 'Preço' },
    ];
    
    return criteria.map(c => ({
      criterio: c.label,
      media: responses.reduce((sum, r) => sum + (r[c.key] || 0), 0) / responses.length,
    })).sort((a, b) => b.media - a.media);
  }, [surveys]);

  const chartConfig = {
    media: { label: 'Média', color: 'hsl(var(--primary))' }
  };

  const handleExportExcel = () => {
    if (!surveys) return;
    try {
      exportToExcel(surveys, imobiliaria?.nome || 'Imobiliaria');
      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao exportar');
    }
  };

  const handleExportPDF = () => {
    if (!surveys) return;
    try {
      exportToPDF(surveys, imobiliaria?.nome || 'Imobiliaria');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao exportar');
    }
  };

  const handleExportSinglePDF = (survey: Survey) => {
    try {
      exportSingleToPDF(survey, imobiliaria?.nome || 'Imobiliaria');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao exportar');
    }
  };

  const hasRespondedSurveys = surveys?.some(s => s.status === 'responded') || false;

  return (<><div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link to="/empresa">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Pesquisas Pós-Visita</h1>
              <p className="text-muted-foreground">
                Acompanhe o feedback dos clientes sobre os imóveis
              </p>
            </div>
          </div>
          
          {/* Export Button */}
          {hasRespondedSurveys && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                <DropdownMenuItem onClick={handleExportPDF} className="gap-2 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  Exportar PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportExcel} className="gap-2 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4" />
                  Exportar Excel (CSV)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalSurveys}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Respondidas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{respondedSurveys}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-600">{pendingSurveys}</p>
            </CardContent>
          </Card>
        </div>

        {/* Averages Chart */}
        {averagesData && averagesData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Média das Avaliações</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                Baseado em {respondedSurveys} pesquisas respondidas
              </p>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={averagesData} 
                    layout="vertical" 
                    margin={{ left: 0, right: 30, top: 10, bottom: 10 }}
                  >
                    <XAxis 
                      type="number" 
                      domain={[0, 5]} 
                      tickCount={6} 
                      fontSize={12}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="criterio" 
                      width={100} 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value) => [`${Number(value).toFixed(1)} / 5`, 'Média']}
                    />
                    <Bar 
                      dataKey="media" 
                      radius={[0, 4, 4, 0]}
                      maxBarSize={30}
                    >
                      {averagesData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.media >= 4 
                              ? 'hsl(142.1 76.2% 36.3%)' 
                              : entry.media >= 3 
                                ? 'hsl(43.3 96.4% 56.3%)' 
                                : 'hsl(0 84.2% 60.2%)'
                          } 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterStatus)}>
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="responded">Respondidas</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : surveys && surveys.length > 0 ? (
              <>
                {/* Mobile Layout - Cards */}
                <div className="md:hidden space-y-3 p-4">
                  {surveys.map((survey) => (
                    <div 
                      key={survey.id}
                      className="bg-background border rounded-lg p-3 space-y-2 cursor-pointer hover:shadow-md active:bg-muted/30 transition-all"
                      onClick={() => {
                        if (survey.status === 'responded') {
                          setSelectedSurvey(survey);
                        } else if (survey.fichas_visita) {
                          navigate(`/fichas/${survey.ficha_id}`);
                        }
                      }}
                    >
                      {/* Header: Cliente + Status */}
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium text-sm line-clamp-1">
                          {survey.client_name || survey.fichas_visita?.comprador_nome || 'Cliente'}
                        </span>
                        {getStatusBadge(survey.status)}
                      </div>
                      
                      {/* Endereço do imóvel */}
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <p className="text-sm line-clamp-2">{survey.fichas_visita?.imovel_endereco || '-'}</p>
                      </div>
                      
                      {/* Data de envio */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {survey.sent_at 
                            ? format(new Date(survey.sent_at), 'dd/MM/yyyy', { locale: ptBR })
                            : '-'
                          }
                        </span>
                      </div>
                      
                      {/* Footer com ações */}
                      <div className="flex justify-end gap-2 pt-1 border-t" onClick={(e) => e.stopPropagation()}>
                        {survey.status === 'responded' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleExportSinglePDF(survey)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
                        <DeleteSurveyDialog
                          surveyId={survey.id}
                          clientName={survey.client_name || survey.fichas_visita?.comprador_nome || 'Cliente'}
                          onDeleted={() => refetch()}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Layout - Tabela */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Imóvel</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data Envio</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {surveys.map((survey) => (
                        <TableRow key={survey.id}>
                          <TableCell className="font-medium">
                            {survey.client_name || survey.fichas_visita?.comprador_nome || 'Cliente'}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {survey.fichas_visita?.imovel_endereco || '-'}
                          </TableCell>
                          <TableCell>{getStatusBadge(survey.status)}</TableCell>
                          <TableCell>
                            {survey.sent_at 
                              ? format(new Date(survey.sent_at), 'dd/MM/yyyy', { locale: ptBR })
                              : '-'
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {survey.status === 'responded' && (
                                <>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setSelectedSurvey(survey)}
                                  >
                                    Ver respostas
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleExportSinglePDF(survey)}
                                    title="Exportar PDF"
                                  >
                                    <FileText className="h-4 w-4 text-primary" />
                                  </Button>
                                </>
                              )}
                              {survey.fichas_visita && (
                                <Link to={`/fichas/${survey.ficha_id}`}>
                                  <Button variant="ghost" size="sm">
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </Link>
                              )}
                              <DeleteSurveyDialog
                                surveyId={survey.id}
                                clientName={survey.client_name || survey.fichas_visita?.comprador_nome || 'Cliente'}
                                onDeleted={() => refetch()}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ClipboardCheck className="h-12 w-12 mb-4 opacity-50" />
                <p>Nenhuma pesquisa encontrada</p>
                <p className="text-sm">As pesquisas criadas nas fichas aparecerão aqui</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Response Dialog */}
      <Dialog open={!!selectedSurvey} onOpenChange={() => setSelectedSurvey(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Resposta da Pesquisa</DialogTitle>
            <DialogDescription>
              Feedback de {selectedSurvey?.client_name || selectedSurvey?.fichas_visita?.comprador_nome || 'cliente'}
            </DialogDescription>
          </DialogHeader>

          {response && (
            <div className="space-y-6 py-4">
              {/* Property info */}
              {selectedSurvey?.fichas_visita && (
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p className="font-medium">{selectedSurvey.fichas_visita.imovel_endereco}</p>
                  <p className="text-muted-foreground">Protocolo: {selectedSurvey.fichas_visita.protocolo}</p>
                </div>
              )}

              {/* Ratings */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Avaliações</h4>
                <div className="space-y-2">
                  {Object.entries(ratingLabels).map(([key, label]) => {
                    const ratingValue = response[key as keyof SurveyResponse];
                    const numericValue = typeof ratingValue === 'number' ? ratingValue : 0;
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{label}</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= numericValue 
                                  ? 'fill-amber-400 text-amber-400' 
                                  : 'text-muted'
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm font-medium">
                            {numericValue}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Would Buy */}
              <div className={`p-4 rounded-lg ${response.would_buy ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                <p className="text-sm font-medium">Compraria este imóvel?</p>
                <p className={`text-lg font-bold ${response.would_buy ? 'text-green-600' : 'text-red-600'}`}>
                  {response.would_buy ? 'Sim' : 'Não'}
                </p>
              </div>

              {/* Comments */}
              {response.liked_most && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">O que mais gostou:</p>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">{response.liked_most}</p>
                </div>
              )}

              {response.liked_least && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">O que menos gostou:</p>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">{response.liked_least}</p>
                </div>
              )}

              <p className="text-xs text-muted-foreground text-center">
                Respondido em {format(new Date(response.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          )}

          <DialogFooter>
            {selectedSurvey?.fichas_visita && (
              <Link to={`/fichas/${selectedSurvey.ficha_id}`}>
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver Ficha
                </Button>
              </Link>
            )}
            <Button onClick={() => setSelectedSurvey(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>);
}
