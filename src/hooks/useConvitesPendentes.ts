import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { isPast } from 'date-fns';

export function useConvitesPendentes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['convites-pendentes-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      
      const { data, error } = await supabase
        .from('convites_parceiro')
        .select('id, status, expira_em')
        .eq('status', 'pendente');
      
      if (error) {
        console.error('Erro ao buscar convites pendentes:', error);
        return 0;
      }
      
      // Filtrar apenas os que não expiraram
      const pendentes = data?.filter(c => !isPast(new Date(c.expira_em))) || [];
      
      return pendentes.length;
    },
    enabled: !!user,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });
}
