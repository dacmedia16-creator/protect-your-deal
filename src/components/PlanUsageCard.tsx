import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  FileText, 
  Building2, 
  Home, 
  AlertTriangle,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UsageStats {
  corretores: number;
  fichasMes: number;
  clientes: number;
  imoveis: number;
}

interface Plano {
  id: string;
  nome: string;
  max_corretores: number;
  max_fichas_mes: number;
  max_clientes: number;
  max_imoveis: number;
}

interface PlanUsageCardProps {
  compact?: boolean;
  className?: string;
  showUpgradeButton?: boolean;
}

export function PlanUsageCard({ compact = false, className = '', showUpgradeButton = true }: PlanUsageCardProps) {
  const { imobiliariaId, assinatura } = useUserRole();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['plan-usage', imobiliariaId],
    queryFn: async () => {
      if (!imobiliariaId) return null;

      // Fetch usage stats
      const { count: corretores } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('imobiliaria_id', imobiliariaId);

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Contar do log de uso (fichas deletadas continuam contando)
      const { count: fichasMes } = await supabase
        .from('ficha_usage_log')
        .select('*', { count: 'exact', head: true })
        .eq('imobiliaria_id', imobiliariaId)
        .gte('created_at', startOfMonth.toISOString());

      const { count: clientes } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('imobiliaria_id', imobiliariaId);

      const { count: imoveis } = await supabase
        .from('imoveis')
        .select('*', { count: 'exact', head: true })
        .eq('imobiliaria_id', imobiliariaId);

      return {
        corretores: corretores || 0,
        fichasMes: fichasMes || 0,
        clientes: clientes || 0,
        imoveis: imoveis || 0,
      } as UsageStats;
    },
    enabled: !!imobiliariaId,
    staleTime: 60000, // 1 minute
  });

  const plano = assinatura?.plano as Plano | undefined;

  if (!imobiliariaId || !plano) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const getPercentage = (used: number, max: number) => {
    if (max >= 99999) return 0; // Unlimited
    return Math.min((used / max) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-destructive';
    if (percentage >= 75) return 'bg-warning';
    return 'bg-primary';
  };

  const isNearLimit = (used: number, max: number) => {
    if (max >= 99999) return false;
    return used / max >= 0.8;
  };

  const isAtLimit = (used: number, max: number) => {
    if (max >= 99999) return false;
    return used >= max;
  };

  const formatLimit = (value: number) => {
    if (value >= 99999) return '∞';
    return value.toString();
  };

  const usageItems = [
    {
      label: 'Registros/Mês',
      icon: FileText,
      used: data.fichasMes,
      max: plano.max_fichas_mes,
    },
    {
      label: 'Clientes',
      icon: Building2,
      used: data.clientes,
      max: plano.max_clientes,
    },
    {
      label: 'Imóveis',
      icon: Home,
      used: data.imoveis,
      max: plano.max_imoveis,
    },
    {
      label: 'Corretores',
      icon: Users,
      used: data.corretores,
      max: plano.max_corretores,
    },
  ];

  const hasAnyNearLimit = usageItems.some(item => isNearLimit(item.used, item.max));
  const hasAnyAtLimit = usageItems.some(item => isAtLimit(item.used, item.max));

  if (compact) {
    return (
      <Card className={`${className} ${hasAnyAtLimit ? 'border-destructive/50' : hasAnyNearLimit ? 'border-warning/50' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Uso do Plano
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {plano.nome}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {usageItems.map((item) => {
              const percentage = getPercentage(item.used, item.max);
              const Icon = item.icon;
              const atLimit = isAtLimit(item.used, item.max);
              const nearLimit = isNearLimit(item.used, item.max);

              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Icon className="h-3 w-3" />
                      {item.label}
                    </span>
                    <span className={`font-medium ${atLimit ? 'text-destructive' : nearLimit ? 'text-warning' : ''}`}>
                      {item.used}/{formatLimit(item.max)}
                    </span>
                  </div>
                  <Progress 
                    value={percentage} 
                    className={`h-1.5 ${atLimit ? '[&>div]:bg-destructive' : nearLimit ? '[&>div]:bg-warning' : ''}`}
                  />
                </div>
              );
            })}
          </div>

          {hasAnyAtLimit && showUpgradeButton && (
            <Button 
              size="sm" 
              className="w-full mt-2"
              onClick={() => navigate('/empresa/assinatura')}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Fazer Upgrade
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full version
  return (
    <Card className={`${className} ${hasAnyAtLimit ? 'border-destructive/50' : hasAnyNearLimit ? 'border-warning/50' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Uso do Plano
          </CardTitle>
          <Badge variant="outline">
            {plano.nome}
          </Badge>
        </div>
        {hasAnyAtLimit && (
          <div className="flex items-center gap-2 text-destructive text-sm mt-2">
            <AlertTriangle className="h-4 w-4" />
            Você atingiu um ou mais limites do seu plano
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {usageItems.map((item) => {
            const percentage = getPercentage(item.used, item.max);
            const Icon = item.icon;
            const atLimit = isAtLimit(item.used, item.max);
            const nearLimit = isNearLimit(item.used, item.max);

            return (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  <span className={`font-medium ${atLimit ? 'text-destructive' : nearLimit ? 'text-warning' : ''}`}>
                    {item.used} / {formatLimit(item.max)}
                    {atLimit && (
                      <Badge variant="destructive" className="ml-2 text-xs">
                        Limite
                      </Badge>
                    )}
                    {nearLimit && !atLimit && (
                      <Badge variant="outline" className="ml-2 text-xs border-warning text-warning">
                        Quase cheio
                      </Badge>
                    )}
                  </span>
                </div>
                <Progress 
                  value={percentage} 
                  className={`h-2 ${atLimit ? '[&>div]:bg-destructive' : nearLimit ? '[&>div]:bg-warning' : ''}`}
                />
              </div>
            );
          })}
        </div>

        {(hasAnyAtLimit || hasAnyNearLimit) && showUpgradeButton && (
          <Button 
            className="w-full"
            onClick={() => navigate('/empresa/assinatura')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Fazer Upgrade do Plano
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
