import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SuperAdminLayout } from '@/components/layouts/SuperAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Search, MoreHorizontal, Building2, Users, Eye, Ban, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Imobiliaria {
  id: string;
  nome: string;
  cnpj: string | null;
  email: string;
  telefone: string | null;
  cidade: string | null;
  estado: string | null;
  status: string;
  created_at: string;
  corretores_count?: number;
  assinatura_status?: string;
}

export default function AdminImobiliarias() {
  const [imobiliarias, setImobiliarias] = useState<Imobiliaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function fetchImobiliarias() {
    try {
      const { data, error } = await supabase
        .from('imobiliarias')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch additional info for each imobiliaria
      const enrichedData = await Promise.all(
        (data || []).map(async (imob) => {
          // Count corretores
          const { count } = await supabase
            .from('user_roles')
            .select('*', { count: 'exact', head: true })
            .eq('imobiliaria_id', imob.id);

          // Get subscription status
          const { data: assData } = await supabase
            .from('assinaturas')
            .select('status')
            .eq('imobiliaria_id', imob.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...imob,
            corretores_count: count || 0,
            assinatura_status: assData?.status || 'sem_assinatura',
          };
        })
      );

      setImobiliarias(enrichedData);
    } catch (error) {
      console.error('Error fetching imobiliarias:', error);
      toast.error('Erro ao carregar imobiliárias');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchImobiliarias();
  }, []);

  async function toggleStatus(imob: Imobiliaria) {
    const newStatus = imob.status === 'ativo' ? 'suspenso' : 'ativo';
    
    try {
      const { error } = await supabase
        .from('imobiliarias')
        .update({ status: newStatus })
        .eq('id', imob.id);

      if (error) throw error;

      toast.success(`Imobiliária ${newStatus === 'ativo' ? 'ativada' : 'suspensa'} com sucesso`);
      fetchImobiliarias();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
    }
  }

  async function deleteImobiliaria(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta imobiliária? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('imobiliarias')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Imobiliária excluída com sucesso');
      fetchImobiliarias();
    } catch (error) {
      console.error('Error deleting imobiliaria:', error);
      toast.error('Erro ao excluir imobiliária');
    }
  }

  const filteredImobiliarias = imobiliarias.filter(imob =>
    imob.nome.toLowerCase().includes(search.toLowerCase()) ||
    imob.email.toLowerCase().includes(search.toLowerCase()) ||
    imob.cnpj?.includes(search)
  );

  const statusColors: Record<string, string> = {
    ativo: 'bg-success text-success-foreground',
    suspenso: 'bg-destructive text-destructive-foreground',
    inativo: 'bg-muted text-muted-foreground',
  };

  const assinaturaColors: Record<string, string> = {
    ativa: 'bg-success/20 text-success border-success/30',
    trial: 'bg-warning/20 text-warning border-warning/30',
    pendente: 'bg-warning/20 text-warning border-warning/30',
    suspensa: 'bg-destructive/20 text-destructive border-destructive/30',
    cancelada: 'bg-muted text-muted-foreground',
    sem_assinatura: 'bg-muted text-muted-foreground',
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Imobiliárias</h1>
            <p className="text-muted-foreground">Gerencie as imobiliárias cadastradas</p>
          </div>
          <Link to="/admin/imobiliarias/nova">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Imobiliária
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou CNPJ..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredImobiliarias.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Nenhuma imobiliária encontrada</h3>
                <p className="text-muted-foreground">
                  {search ? 'Tente buscar por outro termo' : 'Cadastre a primeira imobiliária'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead className="hidden md:table-cell">CNPJ</TableHead>
                      <TableHead className="hidden lg:table-cell">Localização</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">Assinatura</TableHead>
                      <TableHead className="hidden sm:table-cell">Corretores</TableHead>
                      <TableHead className="hidden lg:table-cell">Cadastro</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredImobiliarias.map((imob) => (
                      <TableRow key={imob.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{imob.nome}</p>
                            <p className="text-sm text-muted-foreground">{imob.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {imob.cnpj || '-'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {imob.cidade && imob.estado ? `${imob.cidade}/${imob.estado}` : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[imob.status]}>
                            {imob.status === 'ativo' ? 'Ativo' : imob.status === 'suspenso' ? 'Suspenso' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline" className={assinaturaColors[imob.assinatura_status || 'sem_assinatura']}>
                            {imob.assinatura_status === 'ativa' && 'Ativa'}
                            {imob.assinatura_status === 'trial' && 'Trial'}
                            {imob.assinatura_status === 'pendente' && 'Pendente'}
                            {imob.assinatura_status === 'suspensa' && 'Suspensa'}
                            {imob.assinatura_status === 'cancelada' && 'Cancelada'}
                            {imob.assinatura_status === 'sem_assinatura' && 'Sem assinatura'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {imob.corretores_count}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {format(new Date(imob.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/admin/imobiliarias/${imob.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver detalhes
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleStatus(imob)}>
                                <Ban className="h-4 w-4 mr-2" />
                                {imob.status === 'ativo' ? 'Suspender' : 'Ativar'}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => deleteImobiliaria(imob.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
    </SuperAdminLayout>
  );
}
