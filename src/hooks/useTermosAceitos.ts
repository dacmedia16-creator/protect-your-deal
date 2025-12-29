import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

const TERMOS_QUERY_KEY = 'termos-aceitos';

export function useTermosAceitos() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [TERMOS_QUERY_KEY, user?.id],
    queryFn: async (): Promise<boolean> => {
      if (!user) return false;

      const { data, error } = await supabase
        .from('profiles')
        .select('termos_aceitos_em')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar status dos termos:', error);
        return false;
      }

      return data?.termos_aceitos_em !== null;
    },
    enabled: !!user && !authLoading,
    staleTime: 0, // Always refetch when needed
    refetchOnWindowFocus: true,
  });

  const setTermosAceitos = (accepted: boolean) => {
    if (user) {
      queryClient.setQueryData([TERMOS_QUERY_KEY, user.id], accepted);
    }
  };

  const invalidateTermos = () => {
    if (user) {
      queryClient.invalidateQueries({ queryKey: [TERMOS_QUERY_KEY, user.id] });
    }
  };

  return {
    termosAceitos: query.data ?? null,
    loading: authLoading || query.isLoading,
    refetch: query.refetch,
    setTermosAceitos,
    invalidateTermos,
  };
}
