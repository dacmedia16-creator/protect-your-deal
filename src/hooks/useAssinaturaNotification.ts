import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAssinaturaNotification() {
  const { user } = useAuth();
  const { imobiliariaId, refetch } = useUserRole();
  const { playNotificationSound } = useNotificationSound();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    // Filtro dinâmico: corretor autônomo (user_id) ou imobiliária
    const filter = imobiliariaId 
      ? `imobiliaria_id=eq.${imobiliariaId}` 
      : `user_id=eq.${user.id}`;

    const channel = supabase
      .channel('assinatura-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'assinaturas',
          filter,
        },
        (payload) => {
          const newData = payload.new as { status: string };
          const oldData = payload.old as { status: string };
          
          // Detectar ativação de assinatura
          if (newData.status === 'ativa' && oldData.status !== 'ativa') {
            playNotificationSound('success');
            toast({
              title: '🎉 Assinatura Ativada!',
              description: 'Seu pagamento foi confirmado. Aproveite todos os recursos!',
            });
            // Atualizar dados do contexto
            refetch();
            queryClient.invalidateQueries({ queryKey: ['assinatura'] });
          }
          
          // Detectar suspensão
          if (newData.status === 'suspensa' && oldData.status !== 'suspensa') {
            playNotificationSound('warning');
            toast({
              title: '⚠️ Assinatura Suspensa',
              description: 'Houve um problema com seu pagamento. Verifique sua assinatura.',
              variant: 'destructive',
            });
            refetch();
            queryClient.invalidateQueries({ queryKey: ['assinatura'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, imobiliariaId, playNotificationSound, toast, refetch, queryClient]);
}
