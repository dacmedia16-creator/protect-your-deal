import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

interface DescartarFichaDialogProps {
  fichaId: string;
  protocolo: string;
  onDiscarded: () => void;
  variant?: 'icon' | 'button';
}

export function DescartarFichaDialog({ fichaId, protocolo, onDiscarded, variant = 'icon' }: DescartarFichaDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const handleHide = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('fichas_ocultas')
        .insert({
          user_id: user!.id,
          ficha_id: fichaId,
        });

      if (error) throw error;

      toast.success('Registro ocultado', {
        description: `O registro ${protocolo} foi ocultado da sua lista.`,
      });

      setOpen(false);
      
      // Invalidar todas as queries relevantes
      queryClient.invalidateQueries({ queryKey: ['fichas'] });
      queryClient.invalidateQueries({ queryKey: ['fichas-parceiro'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['fichas-ocultas'] });
      
      onDiscarded();
    } catch (error: any) {
      console.error('Erro ao ocultar registro:', error);
      toast.error('Erro ao ocultar', {
        description: error.message || 'Não foi possível ocultar o registro.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {variant === 'icon' ? (
          <Button
            variant="ghost"
            size="icon"
            className="text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
            onClick={(e) => e.stopPropagation()}
          >
            <EyeOff className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-orange-500 border-orange-500/30 hover:bg-orange-500/10"
            onClick={(e) => e.stopPropagation()}
          >
            <EyeOff className="h-4 w-4" />
            Ocultar
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Ocultar registro de parceria?</AlertDialogTitle>
          <AlertDialogDescription>
            O registro <strong className="text-foreground">{protocolo}</strong> será ocultado da sua lista.
            <br />
            <span className="text-muted-foreground">O registro continuará existindo normalmente para o corretor de origem.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleHide}
            disabled={loading}
            className="bg-orange-500 text-white hover:bg-orange-600"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Ocultando...
              </>
            ) : (
              'Ocultar registro'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
