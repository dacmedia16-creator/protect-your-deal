import { useEffect, useState } from 'react';
import { entityStatusColors, subscriptionStatusColors, getStatusColor } from '@/lib/statusColors';
import { useNavigate } from 'react-router-dom';
import { SuperAdminLayout } from '@/components/layouts/SuperAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { Search, MoreHorizontal, HardHat, Eye, Power, Building2, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AnimatedContent, AnimatedList, AnimatedItem } from '@/components/AnimatedContent';

interface Construtora {
  id: string;
  nome: string;
  cnpj: string | null;
  email: string;
  telefone: string | null;
  cidade: string | null;
  estado: string | null;
  status: string;
  created_at: string;
  codigo?: number | null;
  empreendimentos_count?: number;
  parceiras_count?: number;
  corretores_count?: number;
  assinatura_status?: string;
}

export default function AdminConstrutoras() {
  const navigate = useNavigate();
  const [construtoras, setConstrutoras] = useState<Construtora[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function fetchConstrutoras() {
    try {
      const { data, error } = await supabase
        .from('construtoras')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enrichedData = await Promise.all(
        (data || []).map(async (c) => {
          const { count: empreendimentos_count } = await supabase
            .from('empreendimentos')
            .select('*', { count: 'exact', head: true })
            .eq('construtora_id', c.id);

          const { count: parceiras_count } = await supabase
            .from('construtora_imobiliarias')
            .select('*', { count: 'exact', head: true })
            .eq('construtora_id', c.id);

          const { count: corretores_count } = await supabase
            .from('user_roles')
            .select('*', { count: 'exact', head: true })
            .eq('construtora_id', c.id)
            .eq('role', 'corretor');

          const { data: assData } = await supabase
            .from('assinaturas')
            .select('status')
            .eq('construtora_id', c.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...c,
            empreendimentos_count: empreendimentos_count || 0,
            parceiras_count: parceiras_count || 0,
            corretores_count: corretores_count || 0,
            assinatura_status: assData?.status || 'sem_assinatura',
          };
        })
      );

      setConstrutoras(enrichedData);
    } catch (error) {
      console.error('Error fetching construtoras:', error);
      toast.error('Erro ao carregar construtoras');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchConstrutoras();
  }, []);

  async function toggleStatus(c: Construtora) {
    const newStatus = c.status === 'ativo' ? 'suspenso' : 'ativo';
    try {
      const { error } = await supabase
        .from('construtoras')
        .update({ status: newStatus })
        .eq('id', c.id);
      if (error) throw error;
      toast.success(`Construtora ${newStatus === 'ativo' ? 'ativada' : 'suspensa'} com sucesso`);
      fetchConstrutoras();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
    }
  }

  const filtered = construtoras.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.cnpj?.includes(search)
  );

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <Skeleton className="h-8 w-40 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Card>
            <CardHeader><Skeleton className="h-10 w-full max-w-md" /></CardHeader>
            <CardContent>
              <div className="hidden md:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {[1,2,3,4,5,6].map(i => <TableHead key={i}><Skeleton className="h-4 w-20" /></TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[1,2,3,4,5].map(i => (
                      <TableRow key={i}>
                        {[1,2,3,4,5,6].map(j => <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <AnimatedContent className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Construtoras</h1>
          <p className="text-muted-foreground">Gerencie as construtoras cadastradas</p>
        </div>

        <Card>
          <CardHeader>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou CNPJ..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <HardHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Nenhuma construtora encontrada</h3>
                <p className="text-muted-foreground">
                  {search ? 'Tente buscar por outro termo' : 'Nenhuma construtora cadastrada ainda'}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile cards */}
                <AnimatedList className="grid grid-cols-1 gap-3 md:hidden">
                  {filtered.map((c) => (
                    <AnimatedItem key={c.id}>
                      <Card
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => navigate(`/admin/construtoras/${c.id}`)}
                      >
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {c.codigo && <Badge variant="outline" className="text-xs">#{c.codigo}</Badge>}
                              <span className="font-medium">{c.nome}</span>
                            </div>
                            <Badge className={getStatusColor(c.status, entityStatusColors)}>{c.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{c.email}</p>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span>{c.empreendimentos_count} empreendimentos</span>
                            <span>{c.parceiras_count} parceiras</span>
                            <span>{c.corretores_count} corretores</span>
                          </div>
                          <Badge className={getStatusColor(c.assinatura_status ?? 'sem_assinatura', subscriptionStatusColors)} variant="outline">
                            {c.assinatura_status ?? 'sem_assinatura'}
                          </Badge>
                        </CardContent>
                      </Card>
                    </AnimatedItem>
                  ))}
                </AnimatedList>

                {/* Desktop table */}
                <div className="hidden md:block rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cód</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Empreend.</TableHead>
                        <TableHead>Parceiras</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assinatura</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((c) => (
                        <TableRow
                          key={c.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/admin/construtoras/${c.id}`)}
                        >
                          <TableCell className="font-mono text-xs">{c.codigo || '-'}</TableCell>
                          <TableCell className="font-medium">{c.nome}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{c.email}</TableCell>
                          <TableCell>{c.empreendimentos_count}</TableCell>
                          <TableCell>{c.parceiras_count}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(c.status, entityStatusColors)}>{c.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(c.assinatura_status ?? 'sem_assinatura', subscriptionStatusColors)} variant="outline">
                              {c.assinatura_status ?? 'sem_assinatura'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/admin/construtoras/${c.id}`); }}>
                                  <Eye className="h-4 w-4 mr-2" /> Ver detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleStatus(c); }}>
                                  <Power className="h-4 w-4 mr-2" />
                                  {c.status === 'ativo' ? 'Suspender' : 'Ativar'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </AnimatedContent>
    </SuperAdminLayout>
  );
}
