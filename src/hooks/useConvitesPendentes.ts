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

  // Cache do telefone do usuário para evitar buscar repetidamente
  const { data: userTelefone } = useQuery({
    queryKey: ['user-profile-telefone', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('telefone')
        .eq('user_id', user!.id)
        .single();
      return data?.telefone?.replace(/\D/g, '') || '';
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    gcTime: 30 * 60 * 1000, // 30 minutos
  });

  const query = useQuery({
    queryKey: ['convites-pendentes-count', user?.id, userTelefone],
    queryFn: async () => {
      if (!user) return 0;
      
      const telefoneNormalizado = userTelefone || '';
      
      // Buscar convites pendentes onde o usuário é o parceiro (NÃO o remetente)
      let query = supabase
        .from('convites_parceiro')
        .select('id, status, expira_em')
        .eq('status', 'pendente')
        .neq('corretor_origem_id', user.id);
      
      // Filtrar por parceiro_id OU telefone do parceiro
      if (telefoneNormalizado) {
        query = query.or(`corretor_parceiro_id.eq.${user.id},corretor_parceiro_telefone.eq.${telefoneNormalizado}`);
      } else {
        query = query.eq('corretor_parceiro_id', user.id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Erro ao buscar convites pendentes:', error);
        return 0;
      }
      
      // Filtrar apenas os que não expiraram
      const pendentes = data?.filter(c => !isPast(new Date(c.expira_em))) || [];
      
      return pendentes.length;
    },
    enabled: !!user && userTelefone !== undefined,
    refetchInterval: 60000, // Atualizar a cada 60 segundos como fallback
    staleTime: 0, // Sempre considerar dados stale para garantir atualização
    refetchOnWindowFocus: true, // Atualizar quando a janela receber foco
  });

  // Supabase Realtime para novos convites (com filtro otimizado)
  useEffect(() => {
    if (!user) return;

    console.log('Setting up realtime subscription for convites_parceiro');

    const channel = supabase
      .channel(`convites-realtime-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'convites_parceiro',
          filter: `corretor_parceiro_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Novo convite recebido (por ID):', payload);
          handleNewConvite();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'convites_parceiro'
        },
        (payload) => {
          // Fallback para convites por telefone (verificar no callback)
          const newRecord = payload.new as { corretor_parceiro_telefone?: string; corretor_origem_id?: string };
          if (userTelefone && newRecord.corretor_parceiro_telefone === userTelefone && newRecord.corretor_origem_id !== user.id) {
            console.log('Novo convite recebido (por telefone):', payload);
            handleNewConvite();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'convites_parceiro'
        },
        () => {
          // Invalidar queries para atualizar
          queryClient.invalidateQueries({ queryKey: ['convites-pendentes-count'] });
          queryClient.invalidateQueries({ queryKey: ['convites-recebidos'] });
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    function handleNewConvite() {
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
            window.location.href = '/convites';
          }
        },
        duration: 10000,
      });
    }

    return () => {
      console.log('Removing realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [user, userTelefone, queryClient, playNotificationSound]);

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
