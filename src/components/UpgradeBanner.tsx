import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';

interface UsageLimits {
  fichasMes: { current: number; max: number };
  clientes: { current: number; max: number };
  imoveis: { current: number; max: number };
}

interface UpgradeBannerProps {
  className?: string;
}

export function UpgradeBanner({ className = '' }: UpgradeBannerProps) {
  const { assinatura, imobiliariaId, role } = useUserRole();
  const [usage, setUsage] = useState<UsageLimits | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  const plano = assinatura?.plano;
  const isFreePlan = plano?.nome?.toLowerCase() === 'gratuito' || (plano?.valor_mensal === 0 && plano?.nome?.toLowerCase() !== 'enterprise');

  useEffect(() => {
    async function fetchUsage() {
      if (!imobiliariaId || !plano) {
        setLoading(false);
        return;
      }

      try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // Contar do log de uso (fichas deletadas continuam contando)
        const [fichasRes, clientesRes, imoveisRes] = await Promise.all([
          supabase
            .from('ficha_usage_log')
            .select('*', { count: 'exact', head: true })
            .eq('imobiliaria_id', imobiliariaId)
            .gte('created_at', startOfMonth.toISOString()),
          supabase
            .from('clientes')
            .select('*', { count: 'exact', head: true })
            .eq('imobiliaria_id', imobiliariaId),
          supabase
            .from('imoveis')
            .select('*', { count: 'exact', head: true })
            .eq('imobiliaria_id', imobiliariaId),
        ]);

        setUsage({
          fichasMes: { current: fichasRes.count || 0, max: plano.max_fichas_mes },
          clientes: { current: clientesRes.count || 0, max: plano.max_clientes },
          imoveis: { current: imoveisRes.count || 0, max: plano.max_imoveis },
        });
      } catch (error) {
        console.error('Error fetching usage:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsage();
  }, [imobiliariaId, plano]);

  // Don't show if not free plan, dismissed, loading, or no usage data
  if (!isFreePlan || dismissed || loading || !usage) {
    return null;
  }

  // Calculate usage percentages
  const fichasPercent = (usage.fichasMes.current / usage.fichasMes.max) * 100;
  const clientesPercent = (usage.clientes.current / usage.clientes.max) * 100;
  const imoveisPercent = (usage.imoveis.current / usage.imoveis.max) * 100;

  // Determine if any limit is approaching (>= 80%) or reached (>= 100%)
  const isApproaching = fichasPercent >= 80 || clientesPercent >= 80 || imoveisPercent >= 80;
  const isReached = fichasPercent >= 100 || clientesPercent >= 100 || imoveisPercent >= 100;

  // Don't show if usage is low
  if (!isApproaching && !isReached) {
    return null;
  }

  // Determine the upgrade path based on role
  const upgradePath = role === 'imobiliaria_admin' ? '/empresa/assinatura' : '/minha-assinatura';

  return (
    <div 
      className={`relative overflow-hidden rounded-lg border ${
        isReached 
          ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-800' 
          : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-950/30 dark:to-indigo-950/30 dark:border-blue-800'
      } p-4 ${className}`}
    >
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10 transition-colors"
        aria-label="Fechar banner"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>

      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 p-2 rounded-full ${
          isReached 
            ? 'bg-amber-100 dark:bg-amber-900/50' 
            : 'bg-blue-100 dark:bg-blue-900/50'
        }`}>
          {isReached ? (
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          ) : (
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          )}
        </div>

        <div className="flex-1 min-w-0 pr-6">
          <h3 className={`font-semibold text-sm ${
            isReached 
              ? 'text-amber-800 dark:text-amber-200' 
              : 'text-blue-800 dark:text-blue-200'
          }`}>
            {isReached ? 'Você atingiu o limite do plano gratuito!' : 'Você está quase no limite!'}
          </h3>
          
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            {isReached 
              ? 'Faça upgrade para continuar usando todos os recursos sem limitações.' 
              : 'Considere fazer upgrade para evitar interrupções no seu trabalho.'}
          </p>

          {/* Usage bars */}
          <div className="space-y-2 mb-3">
            {fichasPercent >= 70 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Registros do mês</span>
                  <span className={fichasPercent >= 100 ? 'text-destructive font-medium' : ''}>
                    {usage.fichasMes.current}/{usage.fichasMes.max}
                  </span>
                </div>
                <Progress 
                  value={Math.min(fichasPercent, 100)} 
                  className={`h-1.5 ${fichasPercent >= 100 ? '[&>div]:bg-destructive' : fichasPercent >= 80 ? '[&>div]:bg-amber-500' : ''}`}
                />
              </div>
            )}
            {clientesPercent >= 70 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Clientes</span>
                  <span className={clientesPercent >= 100 ? 'text-destructive font-medium' : ''}>
                    {usage.clientes.current}/{usage.clientes.max}
                  </span>
                </div>
                <Progress 
                  value={Math.min(clientesPercent, 100)} 
                  className={`h-1.5 ${clientesPercent >= 100 ? '[&>div]:bg-destructive' : clientesPercent >= 80 ? '[&>div]:bg-amber-500' : ''}`}
                />
              </div>
            )}
            {imoveisPercent >= 70 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Imóveis</span>
                  <span className={imoveisPercent >= 100 ? 'text-destructive font-medium' : ''}>
                    {usage.imoveis.current}/{usage.imoveis.max}
                  </span>
                </div>
                <Progress 
                  value={Math.min(imoveisPercent, 100)} 
                  className={`h-1.5 ${imoveisPercent >= 100 ? '[&>div]:bg-destructive' : imoveisPercent >= 80 ? '[&>div]:bg-amber-500' : ''}`}
                />
              </div>
            )}
          </div>

          <Button 
            size="sm" 
            className={isReached 
              ? 'bg-amber-500 hover:bg-amber-600 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
            }
            asChild
          >
            <Link to={upgradePath}>
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Ver planos
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
