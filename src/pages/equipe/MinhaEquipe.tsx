import { useState, useEffect, useCallback } from 'react';
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
  Users, 
  FileText, 
  ClipboardCheck, 
  Loader2, 
  ArrowLeft,
  User,
  Phone,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  corretor_nome: string;
}

interface Survey {
  id: string;
  client_name: string | null;
  status: string;
  created_at: string;
  corretor_nome: string;
  ficha_protocolo: string;
}

export default function MinhaEquipe() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isLider, equipesLideradas, loading: loadingLider } = useEquipeLider();
  const { enabled: surveyEnabled } = useImobiliariaFeatureFlag('post_visit_survey');
  
  const [membros, setMembros] = useState<Membro[]>([]);
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingUser, setTogglingUser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('membros');

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

        // Fetch fichas for team members
        const { data: fichasData } = await supabase
          .from('fichas_visita')
          .select('id, protocolo, imovel_endereco, data_visita, status, user_id')
          .in('user_id', userIds)
          .order('data_visita', { ascending: false })
          .limit(50);

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
              fichas_visita!inner(protocolo)
            `)
            .in('corretor_id', userIds)
            .order('created_at', { ascending: false })
            .limit(50);

          if (surveysData) {
            const surveysWithNome = surveysData.map((s: any) => ({
              id: s.id,
              client_name: s.client_name,
              status: s.status,
              created_at: s.created_at,
              corretor_nome: profilesMap.get(s.corretor_id)?.nome || 'Desconhecido',
              ficha_protocolo: s.fichas_visita?.protocolo || '',
            }));
            setSurveys(surveysWithNome);
          }
        }
      } else {
        setMembros([]);
        setFichas([]);
        setSurveys([]);
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
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{membros.length}</p>
                  <p className="text-xs text-muted-foreground">Membros</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-success" />
                <div>
                  <p className="text-2xl font-bold">{membros.filter(m => m.ativo).length}</p>
                  <p className="text-xs text-muted-foreground">Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{fichas.length}</p>
                  <p className="text-xs text-muted-foreground">Registros</p>
                </div>
              </div>
            </CardContent>
          </Card>
          {surveyEnabled && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{surveys.length}</p>
                    <p className="text-xs text-muted-foreground">Pesquisas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="membros" className="gap-2">
              <Users className="h-4 w-4" />
              Membros
            </TabsTrigger>
            <TabsTrigger value="fichas" className="gap-2">
              <FileText className="h-4 w-4" />
              Registros
            </TabsTrigger>
            {surveyEnabled && (
              <TabsTrigger value="pesquisas" className="gap-2">
                <ClipboardCheck className="h-4 w-4" />
                Pesquisas
              </TabsTrigger>
            )}
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

          {/* Fichas Tab */}
          <TabsContent value="fichas">
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
                      {fichas.map((ficha) => (
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
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {surveys.map((survey) => (
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
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      <MobileNav />
    </div>
  );
}
