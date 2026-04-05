import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDistanceToNow, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Activity, Clock, Users, Timer, Search, RefreshCw, Monitor, Smartphone } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

interface UserSession {
  id: string;
  user_id: string;
  imobiliaria_id: string | null;
  login_at: string;
  logout_at: string | null;
  session_duration_seconds: number | null;
  ip_address: string | null;
  user_agent: string | null;
  logout_type: string;
  is_impersonation: boolean;
  created_at: string;
}

interface SessionWithProfile extends UserSession {
  profile?: {
    nome: string;
    email: string | null;
  };
  imobiliaria?: {
    nome: string;
  };
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '-';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

function getDeviceType(userAgent: string | null): 'mobile' | 'desktop' {
  if (!userAgent) return 'desktop';
  return /mobile|android|iphone|ipad|tablet/i.test(userAgent) ? 'mobile' : 'desktop';
}

function getLogoutTypeBadge(type: string, isActive: boolean) {
  if (isActive) {
    return <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30">Ativa</Badge>;
  }
  
  switch (type) {
    case 'manual':
      return <Badge variant="secondary">Manual</Badge>;
    case 'browser_close':
      return <Badge variant="outline">Navegador fechado</Badge>;
    case 'timeout':
      return <Badge variant="destructive">Timeout</Badge>;
    default:
      return <Badge variant="outline">Desconhecido</Badge>;
  }
}

export default function AdminSessoes() {
  useDocumentTitle('Sessões de Usuários');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'ended'>('all');
  const [periodFilter, setPeriodFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');

  // Calculate date range based on period filter
  const getDateRange = () => {
    const now = new Date();
    switch (periodFilter) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'week':
        return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) };
      case 'month':
        return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
      default:
        return null;
    }
  };

  // Fetch sessions
  const { data: sessions, isLoading, refetch } = useQuery({
    queryKey: ['admin-sessions', statusFilter, periodFilter],
    queryFn: async () => {
      let query = supabase
        .from('user_sessions')
        .select('*')
        .order('login_at', { ascending: false })
        .limit(200);

      // Apply status filter
      if (statusFilter === 'active') {
        query = query.is('logout_at', null);
      } else if (statusFilter === 'ended') {
        query = query.not('logout_at', 'is', null);
      }

      // Apply date filter
      const dateRange = getDateRange();
      if (dateRange) {
        query = query.gte('login_at', dateRange.start.toISOString());
        query = query.lte('login_at', dateRange.end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as UserSession[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch profiles for sessions
  const userIds = [...new Set(sessions?.map(s => s.user_id) || [])];
  const { data: profiles } = useQuery({
    queryKey: ['session-profiles', userIds],
    queryFn: async () => {
      if (!userIds.length) return {};
      
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, nome, email')
        .in('user_id', userIds);
      
      if (error) throw error;
      
      return data.reduce((acc, p) => {
        acc[p.user_id] = p;
        return acc;
      }, {} as Record<string, { nome: string; email: string | null }>);
    },
    enabled: userIds.length > 0,
  });

  // Fetch imobiliarias for sessions
  const imobiliariaIds = [...new Set(sessions?.filter(s => s.imobiliaria_id).map(s => s.imobiliaria_id) || [])];
  const { data: imobiliarias } = useQuery({
    queryKey: ['session-imobiliarias', imobiliariaIds],
    queryFn: async () => {
      if (!imobiliariaIds.length) return {};
      
      const { data, error } = await supabase
        .from('imobiliarias')
        .select('id, nome')
        .in('id', imobiliariaIds as string[]);
      
      if (error) throw error;
      
      return data.reduce((acc, i) => {
        acc[i.id] = i;
        return acc;
      }, {} as Record<string, { nome: string }>);
    },
    enabled: imobiliariaIds.length > 0,
  });

  // Combine data
  const sessionsWithDetails: SessionWithProfile[] = (sessions || []).map(session => ({
    ...session,
    profile: profiles?.[session.user_id],
    imobiliaria: session.imobiliaria_id ? imobiliarias?.[session.imobiliaria_id] : undefined,
  }));

  // Apply search filter
  const filteredSessions = sessionsWithDetails.filter(session => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      session.profile?.nome?.toLowerCase().includes(search) ||
      session.profile?.email?.toLowerCase().includes(search) ||
      session.imobiliaria?.nome?.toLowerCase().includes(search)
    );
  });

  // Calculate stats
  const activeSessions = sessions?.filter(s => !s.logout_at).length || 0;
  const totalSessions = sessions?.length || 0;
  const avgDuration = sessions?.filter(s => s.session_duration_seconds)
    .reduce((sum, s) => sum + (s.session_duration_seconds || 0), 0) / 
    (sessions?.filter(s => s.session_duration_seconds).length || 1);

  return (<div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sessões de Usuários</h1>
            <p className="text-muted-foreground">
              Monitore logins e tempo de uso do sistema
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sessões Ativas</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-600">{activeSessions}</div>
                  <p className="text-xs text-muted-foreground">usuários online agora</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Sessões</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{totalSessions}</div>
                  <p className="text-xs text-muted-foreground">no período selecionado</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{formatDuration(Math.round(avgDuration))}</div>
                  <p className="text-xs text-muted-foreground">duração média por sessão</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Última Atividade</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : sessions?.[0] ? (
                <>
                  <div className="text-lg font-semibold">
                    {formatDistanceToNow(new Date(sessions[0].login_at), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {profiles?.[sessions[0].user_id]?.nome || 'Usuário'}
                  </p>
                </>
              ) : (
                <div className="text-muted-foreground">Sem dados</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou imobiliária..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="ended">Encerradas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as typeof periodFilter)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Últimos 7 dias</SelectItem>
                  <SelectItem value="month">Últimos 30 dias</SelectItem>
                  <SelectItem value="all">Todo período</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sessions Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma sessão encontrada</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead className="hidden md:table-cell">Imobiliária</TableHead>
                    <TableHead>Login</TableHead>
                    <TableHead className="hidden sm:table-cell">Duração</TableHead>
                    <TableHead className="hidden lg:table-cell">Dispositivo</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((session) => {
                    const isActive = !session.logout_at;
                    const deviceType = getDeviceType(session.user_agent);
                    
                    return (
                      <TableRow key={session.id} className={isActive ? 'bg-green-500/5' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {session.is_impersonation && (
                              <Badge variant="outline" className="text-xs">Suporte</Badge>
                            )}
                            <div>
                              <div className="font-medium">
                                {session.profile?.nome || 'Usuário desconhecido'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {session.profile?.email || session.user_id.slice(0, 8)}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {session.imobiliaria?.nome || (
                            <span className="text-muted-foreground">Autônomo</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(session.login_at), "dd/MM HH:mm", { locale: ptBR })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(session.login_at), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {isActive ? (
                            <span className="text-green-600 font-medium">
                              {formatDistanceToNow(new Date(session.login_at), { locale: ptBR })}
                            </span>
                          ) : (
                            formatDuration(session.session_duration_seconds)
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {deviceType === 'mobile' ? (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Smartphone className="h-4 w-4" />
                              <span className="text-sm">Mobile</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Monitor className="h-4 w-4" />
                              <span className="text-sm">Desktop</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {getLogoutTypeBadge(session.logout_type, isActive)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>);
}
