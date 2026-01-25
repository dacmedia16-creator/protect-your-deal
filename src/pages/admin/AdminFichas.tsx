import { useEffect, useState, useCallback, useMemo } from 'react';
import { fichaStatusColors, getStatusColor } from '@/lib/statusColors';
import { SuperAdminLayout } from '@/components/layouts/SuperAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Loader2, Eye, Search, HardDrive, AlertTriangle, Building2, User, CheckCircle2, Shield, MapPin, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link, useNavigate } from 'react-router-dom';
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

interface FichaGroup {
  id: string;
  type: 'imobiliaria' | 'corretor_autonomo';
  name: string;
  fichas: Ficha[];
  count: number;
}

function groupFichas(fichas: Ficha[]): FichaGroup[] {
  const imobiliariaGroups = new Map<string, Ficha[]>();
  const autonomoGroups = new Map<string, Ficha[]>();

  fichas.forEach((ficha) => {
    if (ficha.imobiliaria_id && ficha.imobiliaria_nome) {
      const existing = imobiliariaGroups.get(ficha.imobiliaria_id) || [];
      existing.push(ficha);
      imobiliariaGroups.set(ficha.imobiliaria_id, existing);
    } else if (ficha.user_id && ficha.corretor_nome) {
      const existing = autonomoGroups.get(ficha.user_id) || [];
      existing.push(ficha);
      autonomoGroups.set(ficha.user_id, existing);
    }
  });

  const groups: FichaGroup[] = [];

  // Imobiliárias primeiro (ordenadas alfabeticamente)
  const imobiliariaEntries: FichaGroup[] = [];
  imobiliariaGroups.forEach((groupFichas, id) => {
    imobiliariaEntries.push({
      id,
      type: 'imobiliaria',
      name: groupFichas[0].imobiliaria_nome || 'Sem nome',
      fichas: groupFichas.sort(
        (a, b) =>
          new Date(b.data_visita).getTime() - new Date(a.data_visita).getTime()
      ),
      count: groupFichas.length,
    });
  });

  imobiliariaEntries.sort((a, b) => a.name.localeCompare(b.name));
  groups.push(...imobiliariaEntries);

  // Corretores autônomos depois
  const autonomoEntries: FichaGroup[] = [];
  autonomoGroups.forEach((groupFichas, id) => {
    autonomoEntries.push({
      id,
      type: 'corretor_autonomo',
      name: groupFichas[0].corretor_nome || 'Desconhecido',
      fichas: groupFichas.sort(
        (a, b) =>
          new Date(b.data_visita).getTime() - new Date(a.data_visita).getTime()
      ),
      count: groupFichas.length,
    });
  });

  autonomoEntries.sort((a, b) => a.name.localeCompare(b.name));
  groups.push(...autonomoEntries);

  return groups;
}

export default function AdminFichas() {
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fetchFichas = useCallback(async () => {
    try {
      setLoading(true);
      
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
        imobiliaria_nome: f.imobiliaria_id ? imobiliariaMap[f.imobiliaria_id] || null : null,
        is_autonomo: !f.imobiliaria_id
      }));

      setFichas(enrichedFichas);
    } catch (error) {
      console.error('Error fetching fichas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFichas();
  }, [fetchFichas]);

  // Estatísticas
  const stats = useMemo(() => {
    const imobiliarias = new Set(
      fichas.filter((f) => f.imobiliaria_id).map((f) => f.imobiliaria_id)
    );
    const autonomos = new Set(
      fichas.filter((f) => !f.imobiliaria_id).map((f) => f.user_id)
    );
    const completos = fichas.filter((f) => f.status === 'completo' || f.status === 'finalizado_parcial').length;
    const comBackup = fichas.filter((f) => f.backup_gerado_em).length;

    return {
      total: fichas.length,
      imobiliarias: imobiliarias.size,
      autonomos: autonomos.size,
      completos,
      comBackup,
    };
  }, [fichas]);

  // Filtrar fichas pela busca
  const filteredFichas = useMemo(() => {
    if (!search) return fichas;

    const term = search.toLowerCase();
    return fichas.filter(
      (f) =>
        f.protocolo.toLowerCase().includes(term) ||
        f.imovel_endereco.toLowerCase().includes(term) ||
        f.proprietario_nome?.toLowerCase().includes(term) ||
        f.comprador_nome?.toLowerCase().includes(term) ||
        f.corretor_nome?.toLowerCase().includes(term) ||
        f.imobiliaria_nome?.toLowerCase().includes(term)
    );
  }, [fichas, search]);

  // Agrupar fichas
  const groups = useMemo(() => groupFichas(filteredFichas), [filteredFichas]);

  const statusLabels: Record<string, string> = {
    pendente: 'Pendente',
    aguardando_proprietario: 'Aguard. Proprietário',
    aguardando_comprador: 'Aguard. Comprador',
    completo: 'Completo',
    finalizado_parcial: 'Finalizado Parcial',
    cancelado: 'Cancelado',
  };

  // Using fichaStatusColors from lib/statusColors

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>

          {/* Stats cards skeleton */}
          <div className="grid gap-4 md:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-12" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Search skeleton */}
          <Skeleton className="h-10 w-full max-w-md" />

          {/* Accordion groups skeleton */}
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-5 w-48 flex-1" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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

        {/* Cards de Estatísticas */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">registros</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Imobiliárias</CardTitle>
              <Building2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.imobiliarias}</div>
              <p className="text-xs text-muted-foreground">com registros</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Autônomos</CardTitle>
              <User className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.autonomos}</div>
              <p className="text-xs text-muted-foreground">corretores</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completos</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completos}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0
                  ? `${Math.round((stats.completos / stats.total) * 100)}%`
                  : '0%'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Com Backup</CardTitle>
              <Shield className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.comBackup}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0
                  ? `${Math.round((stats.comBackup / stats.total) * 100)}%`
                  : '0%'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Busca */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por protocolo, endereço, nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          {search && (
            <p className="text-sm text-muted-foreground">
              {filteredFichas.length} resultado
              {filteredFichas.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Acordeões agrupados */}
        {groups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {search
                  ? 'Nenhum registro encontrado com esses critérios'
                  : 'Nenhum registro cadastrado'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" className="space-y-2">
            {groups.map((group) => (
              <AccordionItem
                key={group.id}
                value={group.id}
                className="border rounded-lg bg-card"
              >
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-3 w-full">
                    {group.type === 'imobiliaria' ? (
                      <Building2 className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    ) : (
                      <User className="h-5 w-5 text-orange-500 flex-shrink-0" />
                    )}
                    <span className="font-medium text-left flex-1">
                      {group.name}
                    </span>
                    <Badge variant="secondary" className="ml-auto mr-2">
                      {group.count} registro{group.count !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  {/* Mobile Layout - Cards */}
                  <div className="md:hidden space-y-3">
                    {group.fichas.map((ficha) => (
                      <div 
                        key={ficha.id}
                        className="bg-background border rounded-lg p-3 space-y-2 cursor-pointer hover:shadow-md active:bg-muted/30 transition-all"
                        onClick={() => navigate(`/fichas/${ficha.id}`)}
                      >
                        {/* Header: Protocolo + Status */}
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono text-xs font-medium text-primary">
                            #{ficha.protocolo}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className={getStatusColor(fichaStatusColors, ficha.status)}>
                              {statusLabels[ficha.status] || ficha.status}
                            </Badge>
                            {ficha.backup_gerado_em && (
                              <HardDrive className="h-3.5 w-3.5 text-green-500" />
                            )}
                          </div>
                        </div>
                        
                        {/* Endereço */}
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <p className="text-sm font-medium line-clamp-2">{ficha.imovel_endereco}</p>
                        </div>
                        
                        {/* Info: Corretor + Data */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="h-3.5 w-3.5" />
                          <span className="line-clamp-1">{ficha.corretor_nome}</span>
                          <span>•</span>
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{format(new Date(ficha.data_visita), "dd/MM/yy", { locale: ptBR })}</span>
                        </div>
                        
                        {/* Footer com delete */}
                        <div className="flex justify-end pt-1 border-t" onClick={(e) => e.stopPropagation()}>
                          <DeleteFichaDialog 
                            fichaId={ficha.id} 
                            protocolo={ficha.protocolo}
                            onDeleted={fetchFichas}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Layout - Tabela */}
                  <div className="hidden md:block rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Protocolo</TableHead>
                          <TableHead>Corretor</TableHead>
                          <TableHead>Endereço</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Backup</TableHead>
                          <TableHead className="w-[100px] text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.fichas.map((ficha) => (
                          <TableRow key={ficha.id}>
                            <TableCell className="font-mono text-sm">{ficha.protocolo}</TableCell>
                            <TableCell>{ficha.corretor_nome}</TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {ficha.imovel_endereco}
                            </TableCell>
                            <TableCell>
                              {format(new Date(ficha.data_visita), "dd/MM/yy", { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getStatusColor(fichaStatusColors, ficha.status)}>
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
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </SuperAdminLayout>
  );
}
