import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { isPast } from 'date-fns';
import { useEffect, useRef } from 'react';
import { useNotificationSound } from './useNotificationSound';
import { toast } from 'sonner';

export function useConvitesPendentes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { playNotificationSound } = useNotificationSound();
  const previousCountRef = useRef<number | null>(null);
  const isFirstLoadRef = useRef(true);

  const query = useQuery({
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
    refetchInterval: 60000, // Atualizar a cada 60 segundos como fallback
  });

  // Supabase Realtime para novos convites
  useEffect(() => {
    if (!user) return;

    console.log('Setting up realtime subscription for convites_parceiro');

    const channel = supabase
      .channel('convites-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'convites_parceiro'
        },
        (payload) => {
          console.log('Novo convite recebido:', payload);
          
          // Invalidar a query para atualizar a contagem
          queryClient.invalidateQueries({ queryKey: ['convites-pendentes-count'] });
          queryClient.invalidateQueries({ queryKey: ['convites-recebidos'] });
          
          // Tocar som de notificação
          playNotificationSound('warning');
          
          // Mostrar toast de notificação
          toast.info('Novo convite de parceria recebido!', {
            description: 'Você recebeu um novo convite de parceria. Clique para ver.',
            action: {
              label: 'Ver',
              onClick: () => {
                window.location.href = '/convites-recebidos';
              }
            },
            duration: 10000,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'convites_parceiro'
        },
        (payload) => {
          console.log('Convite atualizado:', payload);
          // Invalidar queries para atualizar
          queryClient.invalidateQueries({ queryKey: ['convites-pendentes-count'] });
          queryClient.invalidateQueries({ queryKey: ['convites-recebidos'] });
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      console.log('Removing realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, playNotificationSound]);

  // Detectar novos convites e notificar (após primeiro carregamento)
  useEffect(() => {
    if (query.data === undefined) return;
    
    const currentCount = query.data;
    
    // Ignorar primeira carga
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      previousCountRef.current = currentCount;
      return;
    }
    
    // Se aumentou a contagem, é porque chegou um novo convite
    if (previousCountRef.current !== null && currentCount > previousCountRef.current) {
      // Som e toast já são tratados pelo realtime, mas isso serve como fallback
      console.log('Contagem de convites aumentou:', previousCountRef.current, '->', currentCount);
    }
    
    previousCountRef.current = currentCount;
  }, [query.data]);

  return query;
}
