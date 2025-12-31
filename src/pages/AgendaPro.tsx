import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRecursoAvancado } from '@/hooks/useModuloAvancado';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DesktopNav } from '@/components/DesktopNav';
import { MobileHeader } from '@/components/MobileHeader';
import { MobileNav } from '@/components/MobileNav';
import { UpgradeAvancadoBanner } from '@/components/UpgradeAvancadoBanner';
import {
  CalendarDays,
  Clock,
  MapPin,
  User,
  Building2,
  Bell,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { format, isSameDay, startOfMonth, endOfMonth, addMonths, subMonths, isToday, isBefore, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Ficha {
  id: string;
  protocolo: string;
  imovel_endereco: string;
  imovel_tipo: string;
  proprietario_nome: string | null;
  comprador_nome: string | null;
  data_visita: string;
  status: string;
}

export default function AgendaPro() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { temRecurso, loading: loadingRecurso } = useRecursoAvancado('agenda_pro');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [lembreteAtivo, setLembreteAtivo] = useState(true);

  // Buscar fichas do mês
  const { data: fichas, isLoading } = useQuery({
    queryKey: ['agenda-fichas', user?.id, format(currentMonth, 'yyyy-MM')],
    queryFn: async () => {
      if (!user) return [];
      
      const inicio = startOfMonth(currentMonth);
      const fim = endOfMonth(currentMonth);

      const { data, error } = await supabase
        .from('fichas_visita')
        .select('id, protocolo, imovel_endereco, imovel_tipo, proprietario_nome, comprador_nome, data_visita, status')
        .or(`user_id.eq.${user.id},corretor_parceiro_id.eq.${user.id}`)
        .gte('data_visita', inicio.toISOString())
        .lte('data_visita', fim.toISOString())
        .order('data_visita', { ascending: true });

      if (error) throw error;
      return data as Ficha[];
    },
    enabled: !!user && temRecurso,
  });

  // Agrupar fichas por data
  const fichasPorData = useMemo(() => {
    const map = new Map<string, Ficha[]>();
    fichas?.forEach((ficha) => {
      const dateKey = format(parseISO(ficha.data_visita), 'yyyy-MM-dd');
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(ficha);
    });
    return map;
  }, [fichas]);

  // Fichas do dia selecionado
  const fichasDoDia = useMemo(() => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return fichasPorData.get(dateKey) || [];
  }, [fichasPorData, selectedDate]);

  // Visitas de hoje
  const visitasHoje = useMemo(() => {
    return fichas?.filter(f => isToday(parseISO(f.data_visita))) || [];
  }, [fichas]);

  // Próximas visitas
  const proximasVisitas = useMemo(() => {
    const agora = new Date();
    return fichas
      ?.filter(f => !isBefore(parseISO(f.data_visita), agora))
      .slice(0, 5) || [];
  }, [fichas]);

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completo':
      case 'finalizado_parcial':
        return 'bg-success/20 text-success border-success/30';
      case 'pendente':
        return 'bg-warning/20 text-warning border-warning/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getDayModifiers = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const count = fichasPorData.get(dateKey)?.length || 0;
    return count;
  };

  if (authLoading || loadingRecurso) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!temRecurso) {
    return (
      <div className="min-h-screen bg-background pb-20 sm:pb-0">
        <DesktopNav />
        <MobileHeader title="Agenda Pro" />
        
        <main className="container mx-auto px-4 py-6">
          <div className="max-w-2xl mx-auto">
            <UpgradeAvancadoBanner recursoDestaque="agenda_pro" />
          </div>
        </main>
        
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      <DesktopNav />
      <MobileHeader 
        title="Agenda Pro" 
        subtitle={`${visitasHoje.length} visitas hoje`}
      />

      <main className="container mx-auto px-4 py-4 md:py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Coluna do Calendário */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header do Calendário */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    Calendário de Visitas
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleMonthChange('prev')}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-medium min-w-[140px] text-center">
                      {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                    </span>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleMonthChange('next')}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    month={currentMonth}
                    onMonthChange={setCurrentMonth}
                    locale={ptBR}
                    className="rounded-md border pointer-events-auto"
                    modifiers={{
                      hasVisit: (date) => getDayModifiers(date) > 0,
                    }}
                    modifiersStyles={{
                      hasVisit: {
                        fontWeight: 'bold',
                      },
                    }}
                    components={{
                      DayContent: ({ date }) => {
                        const count = getDayModifiers(date);
                        return (
                          <div className="relative w-full h-full flex items-center justify-center">
                            <span>{date.getDate()}</span>
                            {count > 0 && (
                              <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                            )}
                          </div>
                        );
                      },
                    }}
                  />
                )}
              </CardContent>
            </Card>

            {/* Visitas do Dia Selecionado */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {isToday(selectedDate) 
                    ? 'Visitas de Hoje' 
                    : `Visitas em ${format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {fichasDoDia.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma visita agendada</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => navigate('/fichas/nova')}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agendar Visita
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {fichasDoDia.map((ficha) => (
                      <div
                        key={ficha.id}
                        className="p-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/fichas/${ficha.id}`)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-xs text-primary font-medium">
                                #{ficha.protocolo}
                              </span>
                              <Badge variant="outline" className={cn('text-xs', getStatusColor(ficha.status))}>
                                {ficha.status === 'completo' ? 'Confirmada' : 'Pendente'}
                              </Badge>
                            </div>
                            <div className="flex items-start gap-2 mb-2">
                              <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                              <p className="text-sm font-medium truncate">{ficha.imovel_endereco}</p>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {format(parseISO(ficha.data_visita), 'HH:mm')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3.5 w-3.5" />
                                {ficha.imovel_tipo}
                              </span>
                              {ficha.comprador_nome && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3.5 w-3.5" />
                                  {ficha.comprador_nome}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Coluna Lateral */}
          <div className="space-y-6">
            {/* Lembretes */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Lembretes
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <Label htmlFor="lembrete" className="font-medium">Lembrete automático</Label>
                    <p className="text-xs text-muted-foreground">
                      Notificar 1h antes da visita
                    </p>
                  </div>
                  <Switch 
                    id="lembrete"
                    checked={lembreteAtivo}
                    onCheckedChange={(checked) => {
                      setLembreteAtivo(checked);
                      toast.success(checked ? 'Lembretes ativados' : 'Lembretes desativados');
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Resumo */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Resumo do Mês</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
                  <span className="text-sm font-medium">Total de Visitas</span>
                  <Badge variant="default">{fichas?.length || 0}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-success/10">
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Confirmadas
                  </span>
                  <Badge className="bg-success text-success-foreground">
                    {fichas?.filter(f => f.status === 'completo' || f.status === 'finalizado_parcial').length || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10">
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-warning" />
                    Pendentes
                  </span>
                  <Badge variant="secondary">
                    {fichas?.filter(f => f.status === 'pendente').length || 0}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Próximas Visitas */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Próximas Visitas</CardTitle>
              </CardHeader>
              <CardContent>
                {proximasVisitas.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma visita agendada
                  </p>
                ) : (
                  <div className="space-y-2">
                    {proximasVisitas.map((ficha) => (
                      <div 
                        key={ficha.id}
                        className="p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                        onClick={() => navigate(`/fichas/${ficha.id}`)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex flex-col items-center justify-center text-primary shrink-0">
                            <span className="text-xs font-bold">{format(parseISO(ficha.data_visita), 'dd')}</span>
                            <span className="text-[10px] uppercase">{format(parseISO(ficha.data_visita), 'MMM', { locale: ptBR })}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{ficha.imovel_endereco}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(ficha.data_visita), 'HH:mm')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
