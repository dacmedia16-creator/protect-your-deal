import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';

/**
 * Hook para verificar se uma feature está habilitada para a imobiliária do usuário atual
 */
export function useImobiliariaFeatureFlag(featureKey: string) {
  const { imobiliariaId } = useUserRole();

  const { data, isLoading } = useQuery({
    queryKey: ['imobiliaria-feature-flag', imobiliariaId, featureKey],
    queryFn: async () => {
      if (!imobiliariaId) return { enabled: false };
      
      const { data, error } = await supabase
        .from('imobiliaria_feature_flags')
        .select('enabled')
        .eq('imobiliaria_id', imobiliariaId)
        .eq('feature_key', featureKey)
        .maybeSingle();
      
      if (error) {
        console.error('Erro ao buscar feature flag da imobiliária:', error);
        return { enabled: false };
      }
      
      return { enabled: data?.enabled ?? false };
    },
    enabled: !!imobiliariaId,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  return {
    enabled: data?.enabled ?? false,
    loading: isLoading,
  };
}
