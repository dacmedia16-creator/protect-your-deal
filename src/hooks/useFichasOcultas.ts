import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook que retorna os IDs das fichas ocultas pelo usuário atual.
 */
export function useFichasOcultas() {
  const { user } = useAuth();

  const { data: hiddenIds = [], isLoading } = useQuery({
    queryKey: ['fichas-ocultas', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('fichas_ocultas')
        .select('ficha_id')
        .eq('user_id', user.id);
      if (error) throw error;
      return (data || []).map(r => r.ficha_id);
    },
    enabled: !!user,
    staleTime: 30000,
  });

  return { hiddenIds, isLoading };
}
