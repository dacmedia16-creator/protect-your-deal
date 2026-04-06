import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useQueryClient } from '@tanstack/react-query';
import { useInfiniteList } from '@/hooks/useInfiniteList';
import { isFichaConfirmada, isFichaPendente } from '@/lib/fichaStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  FileText,
  CheckCircle,
  Clock,
  Search,
  Loader2,
  Building2,
  MapPin,
  Calendar,
  Users,
  AlertTriangle,
  HardDrive
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MobileHeader } from '@/components/MobileHeader';
import { MobileNav } from '@/components/MobileNav';

import { DesktopNav } from '@/components/DesktopNav';
import { DeleteFichaDialog } from '@/components/DeleteFichaDialog';
import { DescartarFichaDialog } from '@/components/DescartarFichaDialog';
import { InfiniteScrollTrigger } from '@/components/InfiniteScrollTrigger';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';
import { PWAInstallFAB } from '@/components/PWAInstallFAB';
import { useFichasOcultas } from '@/hooks/useFichasOcultas';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
  pendente: { label: 'Pendente', variant: 'secondary', icon: Clock },
  aguardando_comprador: { label: 'Aguard. Comprador', variant: 'outline', icon: Clock },
  aguardando_proprietario: { label: 'Aguard. Proprietário', variant: 'outline', icon: Clock },
  completo: { label: 'Confirmado', variant: 'default', icon: CheckCircle },
  finalizado_parcial: { label: 'Finalizado', variant: 'default', icon: CheckCircle },
  expirado: { label: 'Expirado', variant: 'destructive', icon: Clock },
};

type Ficha = {
  id: string;
  protocolo: string;
  imovel_endereco: string;
  imovel_tipo: string;
  proprietario_nome: string | null;
  comprador_nome: string | null;
  data_visita: string;
  status: string;
  user_id: string;
  corretor_parceiro_id: string | null;
  backup_gerado_em: string | null;
};

export default function ListaFichas() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { role } = useUserRole();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  
  const statusFilter = searchParams.get('status');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteList<Ficha>({
    queryKey: ['fichas', user?.id || ''],
    table: 'fichas_visita',
    orFilters: user ? `user_id.eq.${user.id},corretor_parceiro_id.eq.${user.id}` : undefined,
    pageSize: 20,
    enabled: !!user,
  });

  const { hiddenIds } = useFichasOcultas();

  const fichas = useMemo(() => {
    const all = data?.pages.flatMap(page => page.items) || [];
    return hiddenIds.length > 0 ? all.filter(f => !hiddenIds.includes(f.id)) : all;
  }, [data, hiddenIds]);
  const totalCount = (data?.pages[0]?.totalCount || 0) - hiddenIds.length;

  const filteredFichas = useMemo(() => fichas.filter(ficha => {
    if (statusFilter) {
      if (statusFilter === 'pendente' && isFichaConfirmada(ficha.status)) return false;
      if (statusFilter === 'completo' && !isFichaConfirmada(ficha.status)) return false;
      if (statusFilter === 'parceiro' && ficha.corretor_parceiro_id !== user?.id) return false;
    }
    
    const term = searchTerm.toLowerCase();
    return (
      ficha.protocolo.toLowerCase().includes(term) ||
      ficha.imovel_endereco.toLowerCase().includes(term) ||
      (ficha.proprietario_nome && ficha.proprietario_nome.toLowerCase().includes(term)) ||
      (ficha.comprador_nome && ficha.comprador_nome.toLowerCase().includes(term))
    );
  }), [fichas, statusFilter, searchTerm, user?.id]);

  const pendingCount = useMemo(() => fichas.filter(f => isFichaPendente(f.status)).length, [fichas]);
  const confirmedCount = useMemo(() => fichas.filter(f => isFichaConfirmada(f.status)).length, [fichas]);
  const parceiroCount = useMemo(() => fichas.filter(f => f.corretor_parceiro_id === user?.id).length, [fichas, user?.id]);

  const handleTabChange = (value: string) => {
    if (value === 'todas') {
      setSearchParams({});
    } else {
      setSearchParams({ status: value });
    }
  };

  const handleFichaDeleted = () => {
    queryClient.invalidateQueries({ queryKey: ['fichas', user?.id] });
  };

  const currentTab = statusFilter || 'todas';

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      {/* Desktop Navigation */}
      <DesktopNav />
      
      {/* Mobile Header */}
      <MobileHeader
        title="Registros de Visita"
        subtitle={statusFilter ? `${filteredFichas.length} de ${totalCount} registros` : `${fichas.length} de ${totalCount} registros`}
        showAdd
        onAdd={() => navigate('/fichas/nova')}
        addLabel="Novo Registro"
      />

      <main className="container mx-auto px-4 py-4 md:py-6">
        {/* PWA Install Banner */}
        <PWAInstallBanner />
        
        {/* Filter Tabs - horizontal scroll on mobile */}
        <div className="mb-4 md:mb-6 -mx-4 px-4 overflow-x-auto scrollbar-hide">
          <Tabs value={currentTab} onValueChange={handleTabChange}>
            <TabsList className="bg-muted inline-flex w-full md:w-auto md:min-w-0">
              <TabsTrigger value="todas" className="gap-1 text-xs md:text-sm px-2 md:px-4 flex-1 md:flex-none">
                Todas
                <span className="ml-0.5 md:ml-1 text-[10px] md:text-xs bg-muted-foreground/10 rounded-full px-1.5 opacity-60">{totalCount}</span>
              </TabsTrigger>
              <TabsTrigger value="pendente" className="gap-1 text-xs md:text-sm px-2 md:px-4 flex-1 md:flex-none">
                <span className="sm:hidden">Pend.</span>
                <span className="hidden sm:inline">Pendentes</span>
                <span className="ml-0.5 md:ml-1 text-[10px] md:text-xs bg-muted-foreground/10 rounded-full px-1.5 opacity-60">{pendingCount}</span>
              </TabsTrigger>
              <TabsTrigger value="completo" className="gap-1 text-xs md:text-sm px-2 md:px-4 flex-1 md:flex-none">
                <span className="sm:hidden">Conf.</span>
                <span className="hidden sm:inline">Confirmadas</span>
                <span className="ml-0.5 md:ml-1 text-[10px] md:text-xs bg-muted-foreground/10 rounded-full px-1.5 opacity-60">{confirmedCount}</span>
              </TabsTrigger>
              {parceiroCount > 0 && (
                <TabsTrigger value="parceiro" className="gap-1 text-xs md:text-sm px-2 md:px-4 flex-1 md:flex-none">
                  <Users className="h-3.5 w-3.5" />
                  <span className="sm:hidden">Parc.</span>
                  <span className="hidden sm:inline">Parceiro</span>
                  <span className="ml-0.5 md:ml-1 text-[10px] md:text-xs bg-muted-foreground/10 rounded-full px-1.5 opacity-60">{parceiroCount}</span>
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        </div>

        {/* Search */}
        <div className="mb-2 md:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Protocolo, endereço ou nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9 md:h-10 md:max-w-md"
            />
          </div>
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredFichas && filteredFichas.length > 0 ? (
          <div className="space-y-2 md:space-y-3">
            {filteredFichas.map((ficha) => {
              const status = statusConfig[ficha.status] || statusConfig.pendente;
              const StatusIcon = status.icon;
              const isParceiro = ficha.corretor_parceiro_id === user?.id;
              const temParceiro = !!ficha.corretor_parceiro_id && ficha.user_id === user?.id;
              
              return (
                <Card 
                  key={ficha.id} 
                  className="cursor-pointer hover:shadow-medium active:bg-muted/30 transition-all"
                  onClick={() => navigate(`/fichas/${ficha.id}`)}
                >
                  <CardContent className="p-2.5 md:p-4">
                    {/* Mobile Layout */}
                    <div className="md:hidden space-y-1.5">
                      {/* Row 1: Protocolo + Status */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-medium text-primary">
                          #{ficha.protocolo}
                        </span>
                        <div className="flex items-center gap-1">
                          {role === 'super_admin' && (ficha.status === 'completo' || ficha.status === 'finalizado_parcial') && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div>
                                    {ficha.backup_gerado_em ? (
                                      <HardDrive className="h-3.5 w-3.5 text-green-500" />
                                    ) : (
                                      <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {ficha.backup_gerado_em ? 'Backup OK' : 'Backup pendente'}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          <Badge variant={status.variant} className="gap-1 text-[10px] shrink-0">
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Row 2: Endereço */}
                      <div className="flex items-start gap-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-sm font-medium leading-tight line-clamp-2">{ficha.imovel_endereco}</p>
                      </div>
                      
                      {/* Row 3: Metadados + atributo parceiro + delete */}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        <span>{ficha.imovel_tipo}</span>
                        <span className="text-border">•</span>
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(ficha.data_visita), "dd/MM 'às' HH:mm")}</span>
                        {isParceiro && (
                          <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-600 text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            parceiro
                          </span>
                        )}
                        {temParceiro && (
                          <span className="inline-flex items-center gap-1 bg-purple-500/10 text-purple-600 text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                            c/ parceiro
                          </span>
                        )}
                        <div className="ml-auto" onClick={(e) => e.stopPropagation()}>
                          <div className="opacity-30 hover:opacity-100 transition-opacity">
                            {isParceiro ? (
                              <DescartarFichaDialog
                                fichaId={ficha.id}
                                protocolo={ficha.protocolo}
                                onDiscarded={handleFichaDeleted}
                              />
                            ) : (
                              <DeleteFichaDialog 
                                fichaId={ficha.id} 
                                protocolo={ficha.protocolo}
                                onDeleted={handleFichaDeleted}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-sm font-medium text-primary">
                              #{ficha.protocolo}
                            </span>
                            <Badge variant={status.variant} className="gap-1 text-xs">
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </Badge>
                            {/* Backup indicator - desktop - apenas para super_admin */}
                            {role === 'super_admin' && (ficha.status === 'completo' || ficha.status === 'finalizado_parcial') && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1">
                                      {ficha.backup_gerado_em ? (
                                        <HardDrive className="h-4 w-4 text-green-500" />
                                      ) : (
                                        <AlertTriangle className="h-4 w-4 text-destructive" />
                                      )}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {ficha.backup_gerado_em ? 'Backup OK' : 'Backup pendente - clique para regenerar'}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {isParceiro && (
                              <Badge variant="outline" className="gap-1 text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">
                                <Users className="h-3 w-3" />
                                Você é parceiro
                              </Badge>
                            )}
                            {temParceiro && (
                              <Badge variant="outline" className="gap-1 text-xs bg-purple-500/10 text-purple-600 border-purple-500/30">
                                <Users className="h-3 w-3" />
                                Com parceiro
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium truncate">{ficha.imovel_endereco}</p>
                          <p className="text-sm text-muted-foreground">
                            {ficha.imovel_tipo} • Visita em {format(new Date(ficha.data_visita), "dd/MM/yyyy 'às' HH:mm")}
                          </p>
                          <div className="flex gap-4 mt-2 text-sm text-muted-foreground items-center">
                            <span>Proprietário: {ficha.proprietario_nome || 'A preencher'}</span>
                            <span>Comprador: {ficha.comprador_nome || 'A preencher'}</span>
                            <div className="ml-auto" onClick={(e) => e.stopPropagation()}>
                              {isParceiro ? (
                                <DescartarFichaDialog
                                  fichaId={ficha.id}
                                  protocolo={ficha.protocolo}
                                  onDiscarded={handleFichaDeleted}
                                />
                              ) : (
                                <DeleteFichaDialog 
                                  fichaId={ficha.id} 
                                  protocolo={ficha.protocolo}
                                  onDeleted={handleFichaDeleted}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {/* Infinite Scroll Trigger */}
            <InfiniteScrollTrigger
              onLoadMore={fetchNextPage}
              hasMore={!!hasNextPage}
              isLoading={isFetchingNextPage}
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">Nenhum registro encontrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm ? 'Tente outro termo de busca' : 'Crie seu primeiro registro de visita'}
            </p>
            {!searchTerm && (
              <Button onClick={() => navigate('/fichas/nova')} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Registro
              </Button>
            )}
          </div>
        )}
      </main>

      
      {/* PWA Install FAB */}
      <PWAInstallFAB />

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
