import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { isFichaConfirmada } from '@/lib/fichaStatus';
import { ConstutoraLayout } from '@/components/layouts/ConstutoraLayout';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/UserAvatar';
import { RoleBadge } from '@/components/RoleBadge';
import { EquipeBadge } from '@/components/EquipeBadge';
import {
  ArrowLeft, FileText, CheckCircle2, Clock, XCircle,
  Phone, Mail, CreditCard, Calendar, TrendingUp, Eye,
  ClipboardCheck, Star,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Profile {
  id: string;
  user_id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  creci: string | null;
  foto_url: string | null;
  ativo: boolean;
  created_at: string;
}

interface UserRole {
  role: 'corretor' | 'construtora_admin';
}

interface Equipe {
  id: string;
  nome: string;
  cor: string;
  lider_id: string | null;
}

interface Ficha {
  id: string;
  protocolo: string;
  comprador_nome: string | null;
  imovel_endereco: string;
  imovel_tipo: string;
  status: string;
  data_visita: string;
  created_at: string;
}

interface Survey {
  id: string;
  status: string;
  client_name: string | null;
  created_at: string;
  sent_at: string | null;
  responded_at: string | null;
  ficha: {
    protocolo: string;
    imovel_endereco: string;
  } | null;
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
}

export default function ConstutoraDetalhesCorretor() {
  useDocumentTitle('Detalhes do Corretor | Construtora');
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { construtoraId } = useUserRole();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [isLider, setIsLider] = useState(false);
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>([]);

  useEffect(() => {
    if (userId && construtoraId) fetchData();
  }, [userId, construtoraId]);

  async function fetchData() {
    if (!userId || !construtoraId) return;
    setLoading(true);
    try {
      // Fetch profile - validate user belongs to this construtora
      const { data: roleCheck } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('construtora_id', construtoraId)
        .maybeSingle();

      if (!roleCheck) {
        toast.error('Corretor não encontrado nesta construtora');
        navigate('/construtora/corretores');
        return;
      }
      setUserRole(roleCheck as UserRole);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profileData) {
        toast.error('Corretor não encontrado');
        navigate('/construtora/corretores');
        return;
      }
      setProfile(profileData);

      // Fetch equipes
      const { data: membrosData } = await supabase
        .from('equipes_membros')
        .select('equipe_id, equipe:equipes(id, nome, cor, lider_id)')
        .eq('user_id', userId);

      if (membrosData) {
        const equipesDoCorretor = membrosData
          .filter((m: any) => m.equipe)
          .map((m: any) => m.equipe as Equipe);
        setEquipes(equipesDoCorretor);
        setIsLider(equipesDoCorretor.some(e => e.lider_id === userId));
      }

      // Fetch fichas linked to construtora
      const { data: fichasData } = await supabase
        .from('fichas_visita')
        .select('id, protocolo, comprador_nome, imovel_endereco, imovel_tipo, status, data_visita, created_at')
        .eq('user_id', userId)
        .eq('construtora_id', construtoraId)
        .order('created_at', { ascending: false })
        .limit(100);

      setFichas(fichasData || []);

      // Fetch surveys
      const { data: surveysData } = await supabase
        .from('surveys')
        .select('id, status, client_name, created_at, sent_at, responded_at, ficha:fichas_visita(protocolo, imovel_endereco)')
        .eq('corretor_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      setSurveys((surveysData as any[]) || []);

      // Fetch survey responses
      if (surveysData && surveysData.length > 0) {
        const surveyIds = surveysData.map(s => s.id);
        const { data: responsesData } = await supabase
          .from('survey_responses')
          .select('survey_id, rating_location, rating_size, rating_layout, rating_finishes, rating_conservation, rating_common_areas, rating_price, would_buy')
          .in('survey_id', surveyIds);

        setSurveyResponses(responsesData || []);
      }
    } catch (error: any) {
      console.error('Erro:', error);
      toast.error('Erro ao carregar dados do corretor');
    } finally {
      setLoading(false);
    }
  }

  const totalFichas = fichas.length;
  const fichasConfirmadas = fichas.filter(f => isFichaConfirmada(f.status)).length;
  const taxaConfirmacao = totalFichas > 0 ? Math.round((fichasConfirmadas / totalFichas) * 100) : 0;
  const surveysRespondidas = surveys.filter(s => s.status === 'responded').length;

  const calcularMediaGeral = () => {
    if (surveyResponses.length === 0) return 0;
    const total = surveyResponses.reduce((acc, r) => {
      return acc + (r.rating_location + r.rating_size + r.rating_layout + r.rating_finishes + 
                   r.rating_conservation + r.rating_common_areas + r.rating_price) / 7;
    }, 0);
    return (total / surveyResponses.length).toFixed(1);
  };

  const mediaGeral = calcularMediaGeral();

  const calcularMediasCriterio = () => {
    if (surveyResponses.length === 0) return null;
    const n = surveyResponses.length;
    return {
      location: (surveyResponses.reduce((a, r) => a + r.rating_location, 0) / n).toFixed(1),
      size: (surveyResponses.reduce((a, r) => a + r.rating_size, 0) / n).toFixed(1),
      layout: (surveyResponses.reduce((a, r) => a + r.rating_layout, 0) / n).toFixed(1),
      finishes: (surveyResponses.reduce((a, r) => a + r.rating_finishes, 0) / n).toFixed(1),
      conservation: (surveyResponses.reduce((a, r) => a + r.rating_conservation, 0) / n).toFixed(1),
      commonAreas: (surveyResponses.reduce((a, r) => a + r.rating_common_areas, 0) / n).toFixed(1),
      price: (surveyResponses.reduce((a, r) => a + r.rating_price, 0) / n).toFixed(1),
    };
  };

  const mediasCriterio = calcularMediasCriterio();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmado':
        return <Badge className="bg-success text-success-foreground"><CheckCircle2 className="h-3 w-3 mr-1" />Confirmado</Badge>;
      case 'pendente':
        return <Badge variant="outline" className="border-warning text-warning"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'cancelado':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getSurveyStatusBadge = (status: string) => {
    switch (status) {
      case 'responded':
        return <Badge className="bg-success text-success-foreground"><CheckCircle2 className="h-3 w-3 mr-1" />Respondida</Badge>;
      case 'sent':
        return <Badge variant="outline" className="border-warning text-warning"><Clock className="h-3 w-3 mr-1" />Enviada</Badge>;
      case 'draft':
        return <Badge variant="secondary"><FileText className="h-3 w-3 mr-1" />Rascunho</Badge>;
      case 'expired':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Expirada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRatingColor = (rating: string) => {
    const num = parseFloat(rating);
    if (num >= 4) return 'text-success';
    if (num >= 3) return 'text-warning';
    return 'text-destructive';
  };

  if (loading) {
    return (
      <ConstutoraLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2"><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-32" /></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      </ConstutoraLayout>
    );
  }

  if (!profile) {
    return (
      <ConstutoraLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Corretor não encontrado</p>
          <Button variant="link" onClick={() => navigate('/construtora/corretores')}>Voltar</Button>
        </div>
      </ConstutoraLayout>
    );
  }

  return (
    <ConstutoraLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/construtora/corretores')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-display font-bold">Detalhes do Corretor</h1>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <UserAvatar imageUrl={profile.foto_url || undefined} name={profile.nome} size="lg" className="h-24 w-24 text-2xl mx-auto md:mx-0" />
              <div className="flex-1 space-y-3 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <h2 className="text-xl font-semibold">{profile.nome}</h2>
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    {userRole && <RoleBadge role={userRole.role} />}
                    {isLider && <Badge variant="outline" className="border-warning text-warning">Líder</Badge>}
                    <Badge variant={profile.ativo ? 'default' : 'destructive'}>
                      {profile.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                  {profile.email && <span className="flex items-center gap-1"><Mail className="h-4 w-4" />{profile.email}</span>}
                  {profile.telefone && <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{profile.telefone}</span>}
                  {profile.creci && <span className="flex items-center gap-1"><CreditCard className="h-4 w-4" />CRECI: {profile.creci}</span>}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Desde {format(new Date(profile.created_at), "MMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>
                {equipes.length > 0 && (
                  <div className="flex flex-wrap justify-center md:justify-start gap-2">
                    {equipes.map(eq => <EquipeBadge key={eq.id} nome={eq.nome} cor={eq.cor} />)}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm"><FileText className="h-4 w-4" />Registros</div>
              <p className="text-2xl font-bold mt-1">{totalFichas}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm"><TrendingUp className="h-4 w-4" />Taxa Confirmação</div>
              <p className="text-2xl font-bold mt-1">{taxaConfirmacao}%</p>
            </CardContent>
          </Card>
          {surveys.length > 0 && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm"><ClipboardCheck className="h-4 w-4" />Pesquisas</div>
                <p className="text-2xl font-bold mt-1">{surveysRespondidas}/{surveys.length}</p>
              </CardContent>
            </Card>
          )}
          {surveyResponses.length > 0 && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm"><Star className="h-4 w-4" />Média Satisfação</div>
                <p className={`text-2xl font-bold mt-1 ${getRatingColor(mediaGeral as string)}`}>{mediaGeral}/5</p>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm"><CheckCircle2 className="h-4 w-4" />Confirmados</div>
              <p className="text-2xl font-bold mt-1 text-success">{fichasConfirmadas}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="registros" className="space-y-4">
          <TabsList className="w-full flex flex-wrap h-auto gap-1">
            <TabsTrigger value="registros" className="flex-1 min-w-[100px]">Registros</TabsTrigger>
            {surveys.length > 0 && (
              <TabsTrigger value="pesquisas" className="flex-1 min-w-[100px]">Pesquisas</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="registros">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Registros de Visita ({fichas.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {fichas.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum registro encontrado</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Protocolo</TableHead>
                          <TableHead>Comprador</TableHead>
                          <TableHead className="hidden md:table-cell">Imóvel</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden md:table-cell">Data Visita</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fichas.map((ficha) => (
                          <TableRow key={ficha.id}>
                            <TableCell className="font-mono text-sm">{ficha.protocolo}</TableCell>
                            <TableCell>{ficha.comprador_nome || '-'}</TableCell>
                            <TableCell className="hidden md:table-cell max-w-[200px] truncate">{ficha.imovel_endereco}</TableCell>
                            <TableCell>{getStatusBadge(ficha.status)}</TableCell>
                            <TableCell className="hidden md:table-cell">{format(new Date(ficha.data_visita), 'dd/MM/yyyy')}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" asChild>
                                <Link to={`/fichas/${ficha.id}`}><Eye className="h-4 w-4" /></Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pesquisas Tab */}
          {surveys.length > 0 && (
            <TabsContent value="pesquisas">
              <div className="space-y-4">
                {/* Médias por critério */}
                {mediasCriterio && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5" />
                        Médias de Avaliação
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        {[
                          { label: 'Localização', value: mediasCriterio.location },
                          { label: 'Tamanho', value: mediasCriterio.size },
                          { label: 'Layout', value: mediasCriterio.layout },
                          { label: 'Acabamentos', value: mediasCriterio.finishes },
                          { label: 'Conservação', value: mediasCriterio.conservation },
                          { label: 'Áreas Comuns', value: mediasCriterio.commonAreas },
                          { label: 'Preço', value: mediasCriterio.price },
                        ].map((item) => (
                          <div key={item.label} className="text-center p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                            <p className={`text-xl font-bold ${getRatingColor(item.value)}`}>
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Lista de surveys */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardCheck className="h-5 w-5" />
                      Pesquisas de Satisfação ({surveys.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {surveys.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">Nenhuma pesquisa encontrada</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Cliente</TableHead>
                              <TableHead className="hidden md:table-cell">Imóvel</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="hidden md:table-cell">Enviada em</TableHead>
                              <TableHead className="hidden md:table-cell">Respondida em</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {surveys.map((survey) => (
                              <TableRow key={survey.id}>
                                <TableCell>{survey.client_name || '-'}</TableCell>
                                <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                                  {survey.ficha?.imovel_endereco || '-'}
                                </TableCell>
                                <TableCell>{getSurveyStatusBadge(survey.status)}</TableCell>
                                <TableCell className="hidden md:table-cell">
                                  {survey.sent_at ? format(new Date(survey.sent_at), 'dd/MM/yyyy') : '-'}
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  {survey.responded_at ? format(new Date(survey.responded_at), 'dd/MM/yyyy') : '-'}
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
            </TabsContent>
          )}
        </Tabs>
      </div>
    </ConstutoraLayout>
  );
}
