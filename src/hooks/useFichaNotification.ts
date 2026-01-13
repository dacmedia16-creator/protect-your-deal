import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook reutilizável para notificações de confirmação de fichas de visita.
 * Escuta mudanças em tempo real na tabela fichas_visita e exibe notificações
 * quando proprietário ou comprador confirmam a visita.
 */
export function useFichaNotification() {
  const { user } = useAuth();
  const { imobiliariaId, role } = useUserRole();
  const { playNotificationSound } = useNotificationSound();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    // Filtro dinâmico baseado no contexto:
    // - Imobiliária/Admin: filtra por imobiliaria_id (vê todas as fichas da imobiliária)
    // - Corretor autônomo: filtra por user_id (vê apenas suas fichas)
    const isImobiliaria = role === 'imobiliaria_admin' && imobiliariaId;
    const filter = isImobiliaria
      ? `imobiliaria_id=eq.${imobiliariaId}`
      : `user_id=eq.${user.id}`;

    const channel = supabase
      .channel('fichas-confirmadas-notification')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'fichas_visita',
          filter,
        },
        (payload) => {
          const newData = payload.new as { 
            status: string; 
            proprietario_confirmado_em: string | null; 
            comprador_confirmado_em: string | null;
            protocolo: string;
          };
          const oldData = payload.old as { 
            status: string; 
            proprietario_confirmado_em: string | null; 
            comprador_confirmado_em: string | null;
          };
          
          const novaConfirmacaoProprietario = newData.proprietario_confirmado_em && !oldData.proprietario_confirmado_em;
          const novaConfirmacaoComprador = newData.comprador_confirmado_em && !oldData.comprador_confirmado_em;
          const fichaCompleta = newData.status === 'completo' && oldData.status !== 'completo';
          
          if (novaConfirmacaoProprietario || novaConfirmacaoComprador) {
            playNotificationSound('success');
            toast({
              title: fichaCompleta ? '🎉 Registro Completo!' : '✅ Confirmação Recebida!',
              description: fichaCompleta 
                ? `Registro ${newData.protocolo} foi totalmente confirmado!`
                : novaConfirmacaoProprietario 
                  ? 'O proprietário confirmou a visita.' 
                  : 'O comprador confirmou a visita.',
            });
            
            // Invalidar queries para atualizar dados nas telas
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            queryClient.invalidateQueries({ queryKey: ['empresa-fichas'] });
            queryClient.invalidateQueries({ queryKey: ['fichas'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, imobiliariaId, role, playNotificationSound, toast, queryClient]);
}
