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

export default function ConstutoraDetalhesCorretor() {
  useDocumentTitle('Detalhes do Corretor | Construtora');
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { construtoraId } = useUserRole();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [isLider, setIsLider] = useState(false);
  const [fichas, setFichas] = useState<Ficha[]>([]);

  useEffect(() => {
    if (userId && construtoraId) fetchData();
  }, [userId, construtoraId]);

  async function fetchData() {
    if (!userId || !construtoraId) return;
    setLoading(true);
    try {
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

  if (loading) {
    return (
      <ConstutoraLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2"><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-32" /></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
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
                    <RoleBadge role="corretor" />
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

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
        </Tabs>
      </div>
    </ConstutoraLayout>
  );
}
