import { useEffect, useState, useCallback, useMemo } from 'react';
import { SuperAdminLayout } from '@/components/layouts/SuperAdminLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Loader2, Eye, Search, HardDrive, AlertTriangle, Building2, User, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { DeleteFichaDialog } from '@/components/DeleteFichaDialog';

interface Ficha {
  id: string;
  protocolo: string;
  imovel_endereco: string;
  proprietario_nome: string | null;
  comprador_nome: string | null;
  data_visita: string;
  status: string;
  user_id: string;
  imobiliaria_id: string | null;
  backup_gerado_em: string | null;
  corretor_nome?: string;
  imobiliaria_nome?: string;
  is_autonomo?: boolean;
}

export default function AdminFichas() {
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedImobiliaria, setSelectedImobiliaria] = useState<string>('all');
  const [selectedCorretor, setSelectedCorretor] = useState<string>('all');

  // Lista única de imobiliárias para o filtro
  const imobiliariaOptions = useMemo(() => {
    const uniqueImobiliarias = new Map<string, string>();
    fichas.forEach(f => {
      if (f.imobiliaria_id && f.imobiliaria_nome && f.imobiliaria_nome !== '-') {
        uniqueImobiliarias.set(f.imobiliaria_id, f.imobiliaria_nome);
      }
    });
    return Array.from(uniqueImobiliarias.entries())
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [fichas]);

  // Lista única de corretores para as abas
  const corretorOptions = useMemo(() => {
    const corretorMap = new Map<string, { id: string; nome: string; count: number }>();
    
    fichas.forEach(f => {
      if (corretorMap.has(f.user_id)) {
        corretorMap.get(f.user_id)!.count++;
      } else {
        corretorMap.set(f.user_id, {
          id: f.user_id,
          nome: f.corretor_nome || 'Desconhecido',
          count: 1
        });
      }
    });
    
    return Array.from(corretorMap.values())
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [fichas]);

  const fetchFichas = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all fichas
      const { data, error } = await supabase
        .from('fichas_visita')
        .select('id, protocolo, imovel_endereco, proprietario_nome, comprador_nome, data_visita, status, user_id, imobiliaria_id, backup_gerado_em')
        .order('created_at', { ascending: false });

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

      // Fetch imobiliaria names
      const imobiliariaIds = [...new Set((data || []).filter(f => f.imobiliaria_id).map(f => f.imobiliaria_id as string))];
      let imobiliariaMap: Record<string, string> = {};
      if (imobiliariaIds.length > 0) {
        const { data: imobiliarias } = await supabase
          .from('imobiliarias')
          .select('id, nome')
          .in('id', imobiliariaIds);

        imobiliariaMap = (imobiliarias || []).reduce((acc, i) => {
          acc[i.id] = i.nome;
          return acc;
        }, {} as Record<string, string>);
      }

      const enrichedFichas = (data || []).map(f => ({
        ...f,
        corretor_nome: corretorMap[f.user_id] || 'Desconhecido',
        imobiliaria_nome: f.imobiliaria_id ? imobiliariaMap[f.imobiliaria_id] || '-' : 'Autônomo',
        is_autonomo: !f.imobiliaria_id
      }));

      // Ordenar: primeiro imobiliárias (alfabética), depois autônomos, e por data dentro de cada grupo
      const sortedFichas = enrichedFichas.sort((a, b) => {
        // Autônomos vão para o final
        if (a.is_autonomo && !b.is_autonomo) return 1;
        if (!a.is_autonomo && b.is_autonomo) return -1;
        
        // Se ambos são da mesma categoria, ordenar por imobiliária
        if (a.imobiliaria_nome !== b.imobiliaria_nome) {
          return (a.imobiliaria_nome || '').localeCompare(b.imobiliaria_nome || '');
        }
        
        // Dentro da mesma imobiliária, ordenar por data (mais recente primeiro)
        return new Date(b.data_visita).getTime() - new Date(a.data_visita).getTime();
      });

      setFichas(sortedFichas);
    } catch (error) {
      console.error('Error fetching fichas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFichas();
  }, [fetchFichas]);

  const filteredFichas = fichas.filter(f => {
    // Filtro por corretor (abas)
    if (selectedCorretor !== 'all' && f.user_id !== selectedCorretor) return false;
    
    // Filtro por imobiliária
    if (selectedImobiliaria === 'autonomo' && !f.is_autonomo) return false;
    if (selectedImobiliaria !== 'all' && selectedImobiliaria !== 'autonomo' && f.imobiliaria_id !== selectedImobiliaria) return false;

    // Filtro por busca
    const searchLower = search.toLowerCase();
    return (
      f.protocolo.toLowerCase().includes(searchLower) ||
      f.imovel_endereco.toLowerCase().includes(searchLower) ||
      f.corretor_nome?.toLowerCase().includes(searchLower) ||
      f.imobiliaria_nome?.toLowerCase().includes(searchLower) ||
      f.proprietario_nome?.toLowerCase().includes(searchLower) ||
      f.comprador_nome?.toLowerCase().includes(searchLower)
    );
  });

  const statusLabels: Record<string, string> = {
    pendente: 'Pendente',
    aguardando_proprietario: 'Aguard. Proprietário',
    aguardando_comprador: 'Aguard. Comprador',
    completo: 'Completo',
    finalizado_parcial: 'Finalizado Parcial',
    cancelado: 'Cancelado',
  };

  const statusColors: Record<string, string> = {
    pendente: 'bg-warning/20 text-warning border-warning/30',
    aguardando_proprietario: 'bg-warning/20 text-warning border-warning/30',
    aguardando_comprador: 'bg-warning/20 text-warning border-warning/30',
    completo: 'bg-success/20 text-success border-success/30',
    finalizado_parcial: 'bg-success/20 text-success border-success/30',
    cancelado: 'bg-muted text-muted-foreground',
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
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Registros de Visita</h1>
          <p className="text-muted-foreground">Visualize todos os registros do sistema</p>
        </div>

        {/* Abas por Corretor */}
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          <Tabs value={selectedCorretor} onValueChange={setSelectedCorretor}>
            <TabsList className="bg-muted inline-flex w-auto min-w-full md:min-w-0 h-auto flex-wrap gap-1 p-1">
              <TabsTrigger value="all" className="gap-1.5 data-[state=active]:bg-background">
                <Users className="h-3.5 w-3.5" />
                Todos
                <Badge variant="secondary" className="ml-1 text-xs">{fichas.length}</Badge>
              </TabsTrigger>
              {corretorOptions.map(corretor => (
                <TabsTrigger 
                  key={corretor.id} 
                  value={corretor.id} 
                  className="gap-1.5 data-[state=active]:bg-background"
                >
                  <User className="h-3.5 w-3.5" />
                  {corretor.nome}
                  <Badge variant="secondary" className="ml-1 text-xs">{corretor.count}</Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por protocolo, endereço, corretor..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={selectedImobiliaria} onValueChange={setSelectedImobiliaria}>
                <SelectTrigger className="w-full sm:w-[220px]">
                  <SelectValue placeholder="Filtrar por imobiliária" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>Todas</span>
                    </div>
                  </SelectItem>
                  {imobiliariaOptions.map(imob => (
                    <SelectItem key={imob.id} value={imob.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{imob.nome}</span>
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="autonomo">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Corretores Autônomos</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredFichas.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Nenhum registro encontrado</h3>
                <p className="text-muted-foreground">
                  {search ? 'Tente buscar por outro termo' : 'Ainda não há registros cadastrados no sistema'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Protocolo</TableHead>
                      <TableHead>Corretor</TableHead>
                      <TableHead className="hidden md:table-cell">Imobiliária</TableHead>
                      <TableHead className="hidden lg:table-cell">Endereço</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Backup</TableHead>
                      <TableHead className="w-[100px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFichas.map((ficha, index) => {
                      const prevFicha = index > 0 ? filteredFichas[index - 1] : null;
                      const showSeparator = prevFicha && !prevFicha.is_autonomo && ficha.is_autonomo;
                      
                      return (
                        <>
                          {showSeparator && (
                            <TableRow key={`separator-${ficha.id}`} className="hover:bg-transparent">
                              <TableCell colSpan={8} className="bg-muted/50 py-2">
                                <span className="text-sm font-medium text-muted-foreground">
                                  Corretores Autônomos
                                </span>
                              </TableCell>
                            </TableRow>
                          )}
                          <TableRow key={ficha.id}>
                            <TableCell className="font-mono text-sm">{ficha.protocolo}</TableCell>
                            <TableCell>{ficha.corretor_nome}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant={ficha.imobiliaria_id ? "secondary" : "outline"}>
                                {ficha.imobiliaria_nome}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell max-w-[200px] truncate">
                              {ficha.imovel_endereco}
                            </TableCell>
                            <TableCell>
                              {format(new Date(ficha.data_visita), "dd/MM/yy", { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={statusColors[ficha.status]}>
                                {statusLabels[ficha.status] || ficha.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {(ficha.status === 'completo' || ficha.status === 'finalizado_parcial') ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center justify-center">
                                        {ficha.backup_gerado_em ? (
                                          <HardDrive className="h-4 w-4 text-green-500" />
                                        ) : (
                                          <AlertTriangle className="h-4 w-4 text-destructive" />
                                        )}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {ficha.backup_gerado_em ? 'Backup OK' : 'Backup pendente'}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                <span className="text-muted-foreground text-center block">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Link to={`/fichas/${ficha.id}`}>
                                  <Button variant="ghost" size="icon">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <DeleteFichaDialog 
                                  fichaId={ficha.id} 
                                  protocolo={ficha.protocolo}
                                  onDeleted={fetchFichas}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        </>
                      );
                    })}
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
