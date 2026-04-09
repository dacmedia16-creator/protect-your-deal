import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';

/**
 * Hook para verificar se uma feature está habilitada para a construtora do usuário atual
 */
export function useConstutoraFeatureFlag(featureKey: string) {
  const { construtoraId, loading: roleLoading } = useUserRole();

  const { data, isLoading } = useQuery({
    queryKey: ['construtora-feature-flag', construtoraId, featureKey],
    queryFn: async () => {
      if (!construtoraId) return { enabled: false };
      
      const { data, error } = await supabase
        .from('construtora_feature_flags')
        .select('enabled')
        .eq('construtora_id', construtoraId)
        .eq('feature_key', featureKey)
        .maybeSingle();
      
      if (error) {
        console.error('Erro ao buscar feature flag da construtora:', error);
        return { enabled: false };
      }
      
      return { enabled: data?.enabled ?? false };
    },
    enabled: !!construtoraId && !roleLoading,
    staleTime: 5 * 60 * 1000,
  });

  return {
    enabled: data?.enabled ?? false,
    loading: roleLoading || (!!construtoraId && isLoading),
  };
}
