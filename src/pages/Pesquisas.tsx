import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
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
  FileText,
} from 'lucide-react';
import { MobileNav } from '@/components/MobileNav';
import { useSurveyExport } from '@/hooks/useSurveyExport';
import { toast } from 'sonner';

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
  fichas_visita: {
    id: string;
    imovel_endereco: string;
    comprador_nome: string | null;
    protocolo: string;
    user_id: string;
  } | null;
  survey_responses: SurveyResponse[];
}

type FilterStatus = 'all' | 'pending' | 'responded';

export default function Pesquisas() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const { exportSingleToPDF } = useSurveyExport();

  const handleExportSinglePDF = (survey: Survey) => {
    try {
      exportSingleToPDF(survey as any, 'Corretor');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao exportar PDF');
    }
  };

  const { data: surveys, isLoading } = useQuery({
    queryKey: ['corretor-surveys', user?.id, filter],
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
          fichas_visita!inner (
            id,
            imovel_endereco,
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
        .eq('fichas_visita.user_id', user?.id)
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('status', 'pending');
      } else if (filter === 'responded') {
        query = query.eq('status', 'responded');
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map(survey => ({
        ...survey,
        survey_responses: Array.isArray(survey.survey_responses) 
          ? survey.survey_responses 
          : survey.survey_responses ? [survey.survey_responses] : []
      })) as Survey[];
    },
    enabled: !!user?.id,
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

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-4xl py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Minhas Pesquisas</h1>
            <p className="text-muted-foreground text-sm">
              Feedback dos clientes sobre os imóveis visitados
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-2 grid-cols-3">
          <Card className="text-center">
            <CardHeader className="pb-1 pt-3 px-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent className="pb-3 pt-0">
              <p className="text-2xl font-bold">{totalSurveys}</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardHeader className="pb-1 pt-3 px-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Respondidas</CardTitle>
            </CardHeader>
            <CardContent className="pb-3 pt-0">
              <p className="text-2xl font-bold text-green-600">{respondedSurveys}</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardHeader className="pb-1 pt-3 px-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Pendentes</CardTitle>
            </CardHeader>
            <CardContent className="pb-3 pt-0">
              <p className="text-2xl font-bold text-amber-600">{pendingSurveys}</p>
            </CardContent>
          </Card>
        </div>

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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden md:table-cell">Imóvel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Data Envio</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {surveys.map((survey) => (
                    <TableRow key={survey.id}>
                      <TableCell className="font-medium">
                        {survey.client_name || survey.fichas_visita?.comprador_nome || 'Cliente'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                        {survey.fichas_visita?.imovel_endereco || '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(survey.status)}</TableCell>
                      <TableCell className="hidden sm:table-cell">
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
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
              <Button 
                variant="outline"
                onClick={() => handleExportSinglePDF(selectedSurvey!)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
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

      <MobileNav />
    </div>
  );
}
