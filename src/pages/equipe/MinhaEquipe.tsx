import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEquipeLider } from '@/hooks/useEquipeLider';
import { useImobiliariaFeatureFlag } from '@/hooks/useImobiliariaFeatureFlag';
import { MobileNav } from '@/components/MobileNav';
import { DesktopNav } from '@/components/DesktopNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { 
  Users, 
  FileText, 
  ClipboardCheck, 
  Loader2, 
  ArrowLeft,
  User,
  Phone,
  Calendar,
  BarChart3,
  TrendingUp,
  CheckCircle,
  Target,
  Eye,
  Star,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Membro {
  id: string;
  user_id: string;
  cargo: string;
  entrou_em: string;
  nome: string;
  telefone: string | null;
  ativo: boolean;
}

interface Ficha {
  id: string;
  protocolo: string;
  imovel_endereco: string;
  data_visita: string;
  status: string;
  user_id: string;
  corretor_nome: string;
}

interface Survey {
  id: string;
  client_name: string | null;
  status: string;
  created_at: string;
  corretor_id: string;
  corretor_nome: string;
  ficha_protocolo: string;
  ficha_id: string;
  imovel_endereco: string;
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
  would_buy: boolean;
  liked_most: string | null;
  liked_least: string | null;
  created_at: string;
}

const ratingLabels: Record<string, string> = {
  rating_location: 'Localização',
  rating_size: 'Tamanho',
  rating_layout: 'Distribuição',
  rating_finishes: 'Acabamentos',
  rating_conservation: 'Conservação',
  rating_common_areas: 'Áreas Comuns',
  rating_price: 'Preço',
};

interface MembroPerformance {
  user_id: string;
  nome: string;
  totalFichas: number;
  fichasConfirmadas: number;
  taxaConfirmacao: number;
  totalSurveys: number;
  surveysRespondidas: number;
  taxaResposta: number;
  mediaAvaliacao: number | null;
}

export default function MinhaEquipe() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isLider, equipesLideradas, loading: loadingLider } = useEquipeLider();
  const { enabled: surveyEnabled } = useImobiliariaFeatureFlag('post_visit_survey');
  
  const [membros, setMembros] = useState<Membro[]>([]);
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingUser, setTogglingUser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('membros');
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.id || equipesLideradas.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const equipeIds = equipesLideradas.map(e => e.id);

      // Fetch team members
      const { data: membrosData } = await supabase
        .from('equipes_membros')
        .select('id, user_id, cargo, entrou_em')
        .in('equipe_id', equipeIds);

      if (membrosData && membrosData.length > 0) {
        const userIds = membrosData.map(m => m.user_id);
        
        // Fetch profiles for members
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, nome, telefone, ativo')
          .in('user_id', userIds);

        const profilesMap = new Map(
          (profilesData || []).map(p => [p.user_id, p])
        );

        const membrosWithProfile = membrosData.map(m => {
          const profile = profilesMap.get(m.user_id);
          return {
            ...m,
            nome: profile?.nome || 'Sem nome',
            telefone: profile?.telefone || null,
            ativo: profile?.ativo ?? true,
          };
        });

        setMembros(membrosWithProfile);

        // Fetch ALL fichas for team members (for reports)
        const { data: fichasData } = await supabase
          .from('fichas_visita')
          .select('id, protocolo, imovel_endereco, data_visita, status, user_id')
          .in('user_id', userIds)
          .order('data_visita', { ascending: false });

        if (fichasData) {
          const fichasWithNome = fichasData.map(f => ({
            ...f,
            corretor_nome: profilesMap.get(f.user_id)?.nome || 'Desconhecido',
          }));
          setFichas(fichasWithNome);
        }

        // Fetch surveys for team members
        if (surveyEnabled) {
          const { data: surveysData } = await supabase
            .from('surveys')
            .select(`
              id, 
              client_name, 
              status, 
              created_at, 
              corretor_id,
              ficha_id,
              fichas_visita!inner(protocolo, imovel_endereco)
            `)
            .in('corretor_id', userIds)
            .order('created_at', { ascending: false });

          if (surveysData) {
            const surveysWithNome = surveysData.map((s: any) => ({
              id: s.id,
              client_name: s.client_name,
              status: s.status,
              created_at: s.created_at,
              corretor_id: s.corretor_id,
              corretor_nome: profilesMap.get(s.corretor_id)?.nome || 'Desconhecido',
              ficha_protocolo: s.fichas_visita?.protocolo || '',
              ficha_id: s.ficha_id,
              imovel_endereco: s.fichas_visita?.imovel_endereco || '',
            }));
            setSurveys(surveysWithNome);

            // Fetch survey responses for average ratings
            const surveyIds = surveysData.map((s: any) => s.id);
            if (surveyIds.length > 0) {
              const { data: responsesData } = await supabase
                .from('survey_responses')
                .select('survey_id, rating_location, rating_size, rating_layout, rating_finishes, rating_conservation, rating_common_areas, rating_price, would_buy, liked_most, liked_least, created_at')
                .in('survey_id', surveyIds);
              
              setSurveyResponses(responsesData || []);
            }
          }
        }
      } else {
        setMembros([]);
        setFichas([]);
        setSurveys([]);
        setSurveyResponses([]);
      }
    } catch (err) {
      console.error('Error fetching team data:', err);
      toast.error('Erro ao carregar dados da equipe');
    } finally {
      setLoading(false);
    }
  }, [user?.id, equipesLideradas, surveyEnabled]);

  useEffect(() => {
    if (!loadingLider) {
      fetchData();
    }
  }, [loadingLider, fetchData]);

  // Calculate performance metrics per member
  const performanceData = useMemo((): MembroPerformance[] => {
    return membros.map(membro => {
      const membroFichas = fichas.filter(f => f.user_id === membro.user_id);
      const fichasConfirmadas = membroFichas.filter(f => f.status === 'confirmado').length;
      
      const membroSurveys = surveys.filter(s => s.corretor_id === membro.user_id);
      const surveysRespondidas = membroSurveys.filter(s => s.status === 'responded').length;
      
      // Calculate average rating from survey responses
      const membroSurveyIds = membroSurveys.filter(s => s.status === 'responded').map(s => s.id);
      const membroResponses = surveyResponses.filter(r => membroSurveyIds.includes(r.survey_id));
      
      let mediaAvaliacao: number | null = null;
      if (membroResponses.length > 0) {
        const allRatings = membroResponses.flatMap(r => [
          r.rating_location,
          r.rating_size,
          r.rating_layout,
          r.rating_finishes,
          r.rating_conservation,
          r.rating_common_areas,
          r.rating_price
        ]);
        mediaAvaliacao = allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
      }

      return {
        user_id: membro.user_id,
        nome: membro.nome,
        totalFichas: membroFichas.length,
        fichasConfirmadas,
        taxaConfirmacao: membroFichas.length > 0 ? (fichasConfirmadas / membroFichas.length) * 100 : 0,
        totalSurveys: membroSurveys.length,
        surveysRespondidas,
        taxaResposta: membroSurveys.length > 0 ? (surveysRespondidas / membroSurveys.length) * 100 : 0,
        mediaAvaliacao,
      };
    }).sort((a, b) => b.totalFichas - a.totalFichas);
  }, [membros, fichas, surveys, surveyResponses]);

  // Bar chart data for fichas by member
  const fichasChartData = useMemo(() => {
    return performanceData.map(p => ({
      name: p.nome.split(' ')[0],
      fichas: p.totalFichas,
      confirmadas: p.fichasConfirmadas,
    }));
  }, [performanceData]);

  // Team totals
  const teamTotals = useMemo(() => {
    const totalFichas = fichas.length;
    const fichasConfirmadas = fichas.filter(f => f.status === 'confirmado').length;
    const totalSurveys = surveys.length;
    const surveysRespondidas = surveys.filter(s => s.status === 'responded').length;
    
    // Overall average rating
    let mediaGeral: number | null = null;
    if (surveyResponses.length > 0) {
      const allRatings = surveyResponses.flatMap(r => [
        r.rating_location,
        r.rating_size,
        r.rating_layout,
        r.rating_finishes,
        r.rating_conservation,
        r.rating_common_areas,
        r.rating_price
      ]);
      mediaGeral = allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
    }

    return {
      totalFichas,
      fichasConfirmadas,
      taxaConfirmacao: totalFichas > 0 ? (fichasConfirmadas / totalFichas) * 100 : 0,
      totalSurveys,
      surveysRespondidas,
      taxaResposta: totalSurveys > 0 ? (surveysRespondidas / totalSurveys) * 100 : 0,
      mediaGeral,
    };
  }, [fichas, surveys, surveyResponses]);

  // Monthly evolution data
  const monthlyData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      
      const monthFichas = fichas.filter(f => {
        const fichaDate = new Date(f.data_visita);
        return fichaDate >= start && fichaDate <= end;
      });

      months.push({
        month: format(date, 'MMM', { locale: ptBR }),
        fichas: monthFichas.length,
        confirmadas: monthFichas.filter(f => f.status === 'confirmado').length,
      });
    }
    return months;
  }, [fichas]);

  const handleToggleAtivo = async (membro: Membro) => {
    setTogglingUser(membro.user_id);
    try {
      const { error } = await supabase.functions.invoke('admin-update-corretor', {
        body: {
          user_id: membro.user_id,
          ativo: !membro.ativo,
        },
      });

      if (error) throw error;

      toast.success(membro.ativo ? 'Corretor desativado' : 'Corretor ativado');
      fetchData();
    } catch (err: any) {
      console.error('Error toggling ativo:', err);
      toast.error(err.message || 'Erro ao alterar status do corretor');
    } finally {
      setTogglingUser(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmado':
        return <Badge className="bg-success text-success-foreground">Confirmado</Badge>;
      case 'pendente':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'responded':
        return <Badge className="bg-success text-success-foreground">Respondida</Badge>;
      case 'sent':
        return <Badge variant="secondary">Enviada</Badge>;
      case 'draft':
        return <Badge variant="outline">Rascunho</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRatingColor = (rating: number | null) => {
    if (rating === null) return 'text-muted-foreground';
    if (rating >= 4) return 'text-success';
    if (rating >= 3) return 'text-warning';
    return 'text-destructive';
  };

  const getBarColor = (value: number, max: number) => {
    const ratio = value / max;
    if (ratio >= 0.7) return 'hsl(var(--success))';
    if (ratio >= 0.4) return 'hsl(var(--warning))';
    return 'hsl(var(--primary))';
  };

  if (loadingLider) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isLider) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
        <p className="text-muted-foreground mb-4">
          Você não é líder de nenhuma equipe.
        </p>
        <Button onClick={() => navigate('/dashboard')}>
          Voltar ao Dashboard
        </Button>
      </div>
    );
  }

  const maxFichas = Math.max(...performanceData.map(p => p.totalFichas), 1);

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      <DesktopNav />
      
      <div className="container max-w-6xl mx-auto p-4 sm:p-6 pt-4 sm:pt-20">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Minha Equipe</h1>
            <p className="text-muted-foreground">
              {equipesLideradas.map(e => e.nome).join(', ')}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card 
            className="cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-200 group"
            onClick={() => setActiveTab('membros')}
          >
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{membros.length}</p>
                    <p className="text-xs text-muted-foreground">Membros</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardContent>
          </Card>
          <Card 
            className="cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-200 group"
            onClick={() => setActiveTab('membros')}
          >
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-success" />
                  <div>
                    <p className="text-2xl font-bold">{membros.filter(m => m.ativo).length}</p>
                    <p className="text-xs text-muted-foreground">Ativos</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardContent>
          </Card>
          <Card 
            className="cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-200 group"
            onClick={() => setActiveTab('registros')}
          >
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{fichas.length}</p>
                    <p className="text-xs text-muted-foreground">Registros</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardContent>
          </Card>
          {surveyEnabled && (
            <Card 
              className="cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-200 group"
              onClick={() => setActiveTab('pesquisas')}
            >
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{surveys.length}</p>
                      <p className="text-xs text-muted-foreground">Pesquisas</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 flex-wrap h-auto gap-1">
            <TabsTrigger value="membros" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Membros</span>
            </TabsTrigger>
            <TabsTrigger value="registros" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Registros</span>
            </TabsTrigger>
            {surveyEnabled && (
              <TabsTrigger value="pesquisas" className="gap-2">
                <ClipboardCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Pesquisas</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="relatorios" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Relatórios</span>
            </TabsTrigger>
          </TabsList>

          {/* Membros Tab */}
          <TabsContent value="membros">
            <Card>
              <CardHeader>
                <CardTitle>Membros da Equipe</CardTitle>
                <CardDescription>
                  Gerencie os corretores da sua equipe
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : membros.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum membro na equipe
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                        <TableHead className="hidden sm:table-cell">Desde</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ativo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {membros.map((membro) => (
                        <TableRow key={membro.id}>
                          <TableCell className="font-medium">{membro.nome}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {membro.telefone ? (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {membro.telefone}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(membro.entrou_em), 'dd/MM/yy', { locale: ptBR })}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={membro.ativo ? 'default' : 'secondary'}>
                              {membro.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Switch
                              checked={membro.ativo}
                              onCheckedChange={() => handleToggleAtivo(membro)}
                              disabled={togglingUser === membro.user_id}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Registros Tab */}
          <TabsContent value="registros">
            <Card>
              <CardHeader>
                <CardTitle>Registros de Visita</CardTitle>
                <CardDescription>
                  Fichas criadas pelos membros da equipe
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : fichas.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum registro encontrado
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Protocolo</TableHead>
                        <TableHead>Corretor</TableHead>
                        <TableHead className="hidden sm:table-cell">Imóvel</TableHead>
                        <TableHead className="hidden sm:table-cell">Data</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fichas.slice(0, 50).map((ficha) => (
                        <TableRow 
                          key={ficha.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/fichas/${ficha.id}`)}
                        >
                          <TableCell className="font-mono text-sm">{ficha.protocolo}</TableCell>
                          <TableCell>{ficha.corretor_nome}</TableCell>
                          <TableCell className="hidden sm:table-cell max-w-[200px] truncate">
                            {ficha.imovel_endereco}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {format(new Date(ficha.data_visita), 'dd/MM/yy', { locale: ptBR })}
                          </TableCell>
                          <TableCell>{getStatusBadge(ficha.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pesquisas Tab */}
          {surveyEnabled && (
            <TabsContent value="pesquisas">
              <Card>
                <CardHeader>
                  <CardTitle>Pesquisas de Satisfação</CardTitle>
                  <CardDescription>
                    Pesquisas enviadas pelos membros da equipe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : surveys.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma pesquisa encontrada
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Protocolo</TableHead>
                          <TableHead>Corretor</TableHead>
                          <TableHead className="hidden sm:table-cell">Cliente</TableHead>
                          <TableHead className="hidden sm:table-cell">Data</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[60px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {surveys.slice(0, 50).map((survey) => (
                          <TableRow key={survey.id}>
                            <TableCell className="font-mono text-sm">{survey.ficha_protocolo}</TableCell>
                            <TableCell>{survey.corretor_nome}</TableCell>
                            <TableCell className="hidden sm:table-cell">
                              {survey.client_name || '-'}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              {format(new Date(survey.created_at), 'dd/MM/yy', { locale: ptBR })}
                            </TableCell>
                            <TableCell>{getStatusBadge(survey.status)}</TableCell>
                            <TableCell>
                              {survey.status === 'responded' && (
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => setSelectedSurvey(survey)}
                                  title="Ver resposta"
                                >
                                  <Eye className="h-4 w-4 text-primary" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Relatórios Tab */}
          <TabsContent value="relatorios">
            <div className="space-y-6">
              {/* Team Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-2xl font-bold">{teamTotals.taxaConfirmacao.toFixed(0)}%</p>
                        <p className="text-xs text-muted-foreground">Taxa Confirmação</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <div>
                        <p className="text-2xl font-bold">{teamTotals.fichasConfirmadas}</p>
                        <p className="text-xs text-muted-foreground">Confirmadas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {surveyEnabled && (
                  <>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-2xl font-bold">{teamTotals.taxaResposta.toFixed(0)}%</p>
                            <p className="text-xs text-muted-foreground">Taxa Resposta</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                          <BarChart3 className={`h-5 w-5 ${getRatingColor(teamTotals.mediaGeral)}`} />
                          <div>
                            <p className={`text-2xl font-bold ${getRatingColor(teamTotals.mediaGeral)}`}>
                              {teamTotals.mediaGeral !== null ? teamTotals.mediaGeral.toFixed(1) : '-'}
                            </p>
                            <p className="text-xs text-muted-foreground">Média Geral</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              {/* Monthly Evolution Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Evolução Mensal
                  </CardTitle>
                  <CardDescription>
                    Registros criados nos últimos 6 meses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData}>
                          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                          />
                          <Bar dataKey="fichas" name="Total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="confirmadas" name="Confirmadas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance by Member */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Performance por Corretor
                  </CardTitle>
                  <CardDescription>
                    Métricas individuais de cada membro da equipe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : performanceData.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum dado disponível
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {performanceData.map((p) => (
                        <div key={p.user_id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">{p.nome}</h4>
                            {surveyEnabled && p.mediaAvaliacao !== null && (
                              <Badge className={getRatingColor(p.mediaAvaliacao)}>
                                ★ {p.mediaAvaliacao.toFixed(1)}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Registros</p>
                              <p className="font-bold text-lg">{p.totalFichas}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Confirmados</p>
                              <p className="font-bold text-lg text-success">{p.fichasConfirmadas}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Taxa Confirm.</p>
                              <p className="font-bold text-lg">{p.taxaConfirmacao.toFixed(0)}%</p>
                            </div>
                            {surveyEnabled && (
                              <div>
                                <p className="text-muted-foreground">Pesquisas</p>
                                <p className="font-bold text-lg">{p.surveysRespondidas}/{p.totalSurveys}</p>
                              </div>
                            )}
                          </div>

                          {/* Visual bar */}
                          <div className="mt-3">
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all"
                                style={{ 
                                  width: `${(p.totalFichas / maxFichas) * 100}%`,
                                  backgroundColor: getBarColor(p.totalFichas, maxFichas)
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <MobileNav />

      {/* Dialog para visualizar resposta da pesquisa */}
      <Dialog open={!!selectedSurvey} onOpenChange={() => setSelectedSurvey(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Resposta da Pesquisa
            </DialogTitle>
            <DialogDescription>
              {selectedSurvey?.imovel_endereco}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSurvey && (() => {
            const response = surveyResponses.find(r => r.survey_id === selectedSurvey.id);
            if (!response) return <p className="text-muted-foreground">Resposta não encontrada</p>;
            
            return (
              <div className="space-y-6">
                {/* Info do cliente */}
                <div className="text-sm text-muted-foreground">
                  <p><strong>Cliente:</strong> {selectedSurvey.client_name || '-'}</p>
                  <p><strong>Corretor:</strong> {selectedSurvey.corretor_nome}</p>
                  <p><strong>Protocolo:</strong> {selectedSurvey.ficha_protocolo}</p>
                </div>

                {/* Avaliações */}
                <div className="space-y-3">
                  <h4 className="font-medium">Avaliações</h4>
                  {Object.entries(ratingLabels).map(([key, label]) => {
                    const rating = response[key as keyof typeof response] as number;
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{label}</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= rating
                                  ? 'fill-warning text-warning'
                                  : 'text-muted-foreground/30'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Compraria */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Compraria este imóvel?</span>
                    <Badge variant={response.would_buy ? 'default' : 'secondary'}>
                      {response.would_buy ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                </div>

                {/* Comentários */}
                {(response.liked_most || response.liked_least) && (
                  <div className="space-y-3 border-t pt-4">
                    {response.liked_most && (
                      <div>
                        <p className="text-sm font-medium text-success">O que mais gostou:</p>
                        <p className="text-sm text-muted-foreground mt-1">{response.liked_most}</p>
                      </div>
                    )}
                    {response.liked_least && (
                      <div>
                        <p className="text-sm font-medium text-destructive">O que menos gostou:</p>
                        <p className="text-sm text-muted-foreground mt-1">{response.liked_least}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Data de resposta */}
                <div className="text-xs text-muted-foreground border-t pt-4">
                  Respondido em {format(new Date(response.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
