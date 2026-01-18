import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook para verificar se uma feature está habilitada para o usuário atual
 */
export function useUserFeatureFlag(featureKey: string) {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['user-feature-flag', user?.id, featureKey],
    queryFn: async () => {
      if (!user?.id) return { enabled: false };
      
      const { data, error } = await supabase
        .from('user_feature_flags')
        .select('enabled')
        .eq('user_id', user.id)
        .eq('feature_key', featureKey)
        .maybeSingle();
      
      if (error) {
        console.error('Erro ao buscar feature flag:', error);
        return { enabled: false };
      }
      
      return { enabled: data?.enabled ?? false };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  return {
    enabled: data?.enabled ?? false,
    loading: isLoading,
  };
}
