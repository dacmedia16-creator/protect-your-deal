import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Calendar, 
  Copy, 
  BarChart3, 
  History, 
  Search, 
  Bell, 
  Share2,
  X,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UpgradeAvancadoBannerProps {
  className?: string;
  recursoDestaque?: string;
  onDismiss?: () => void;
  compact?: boolean;
}

const recursosInfo: Record<string, { icon: React.ElementType; label: string }> = {
  agenda_pro: { icon: Calendar, label: 'Agenda Pro' },
  duplicar_ficha: { icon: Copy, label: 'Duplicar Fichas' },
  dashboard_insights: { icon: BarChart3, label: 'Dashboard Insights' },
  historico_imovel: { icon: History, label: 'Histórico por Imóvel' },
  busca_avancada: { icon: Search, label: 'Busca Avançada' },
  followup_auto: { icon: Bell, label: 'Follow-up Automático' },
  compartilhamento_rapido: { icon: Share2, label: 'Compartilhamento Rápido' },
};

export function UpgradeAvancadoBanner({ 
  className, 
  recursoDestaque,
  onDismiss,
  compact = false 
}: UpgradeAvancadoBannerProps) {
  const navigate = useNavigate();
  const { role } = useUserRole();
  const [modulo, setModulo] = useState<{ valor_mensal: number; recursos: string[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchModulo() {
      const { data, error } = await supabase
        .from('modulos')
        .select('valor_mensal, recursos')
        .eq('codigo', 'avancado')
        .eq('ativo', true)
        .single();

      if (!error && data) {
        setModulo({
          valor_mensal: Number(data.valor_mensal),
          recursos: Array.isArray(data.recursos) ? data.recursos as string[] : []
        });
      }
      setLoading(false);
    }

    fetchModulo();
  }, []);

  const handleUpgrade = () => {
    if (role === 'imobiliaria_admin') {
      navigate('/empresa/modulo-avancado');
    } else {
      navigate('/corretor/modulo-avancado');
    }
  };

  if (loading || !modulo) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (compact) {
    return (
      <Card className={cn(
        "border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10",
        className
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">
                  {recursoDestaque && recursosInfo[recursoDestaque] 
                    ? `${recursosInfo[recursoDestaque].label} disponível no Módulo Avançado`
                    : 'Desbloqueie funcionalidades premium'
                  }
                </p>
                <p className="text-xs text-muted-foreground">
                  A partir de {formatCurrency(modulo.valor_mensal)}/mês
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleUpgrade}>
                <Zap className="h-4 w-4 mr-1" />
                Contratar
              </Button>
              {onDismiss && (
                <Button size="icon" variant="ghost" onClick={onDismiss} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/10 overflow-hidden",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Header */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Módulo Avançado</h3>
                <Badge variant="secondary" className="mt-1">
                  {formatCurrency(modulo.valor_mensal)}/mês
                </Badge>
              </div>
            </div>
            
            <p className="text-muted-foreground text-sm mb-4">
              Desbloqueie todas as funcionalidades premium e aumente sua produtividade como corretor.
            </p>

            {/* Recursos em grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {modulo.recursos.slice(0, 6).map((recurso) => {
                const info = recursosInfo[recurso];
                if (!info) return null;
                const Icon = info.icon;
                const isDestaque = recurso === recursoDestaque;
                
                return (
                  <div 
                    key={recurso}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg text-sm",
                      isDestaque 
                        ? "bg-primary/10 text-primary font-medium" 
                        : "text-muted-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{info.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col justify-center items-center md:items-end gap-3">
            <Button size="lg" onClick={handleUpgrade} className="w-full md:w-auto">
              <Zap className="h-5 w-5 mr-2" />
              Contratar Agora
            </Button>
            {onDismiss && (
              <Button variant="ghost" size="sm" onClick={onDismiss}>
                Talvez depois
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
