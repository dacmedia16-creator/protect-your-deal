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
import { UserMinus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DescartarFichaDialogProps {
  fichaId: string;
  protocolo: string;
  onDiscarded: () => void;
  variant?: 'icon' | 'button';
}

export function DescartarFichaDialog({ fichaId, protocolo, onDiscarded, variant = 'icon' }: DescartarFichaDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDiscard = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('fichas_visita')
        .update({
          corretor_parceiro_id: null,
          parte_preenchida_parceiro: null,
        })
        .eq('id', fichaId);

      if (error) throw error;

      toast.success('Parceria descartada', {
        description: `Você foi removido como parceiro do registro ${protocolo}.`,
      });

      setOpen(false);
      onDiscarded();
    } catch (error: any) {
      console.error('Erro ao descartar parceria:', error);
      toast.error('Erro ao descartar', {
        description: error.message || 'Não foi possível descartar a parceria.',
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
            <UserMinus className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-orange-500 border-orange-500/30 hover:bg-orange-500/10"
            onClick={(e) => e.stopPropagation()}
          >
            <UserMinus className="h-4 w-4" />
            Descartar
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Descartar registro de parceria?</AlertDialogTitle>
          <AlertDialogDescription>
            Você será removido como corretor parceiro do registro <strong className="text-foreground">{protocolo}</strong>.
            <br />
            <span className="text-muted-foreground">O registro continuará existindo para o corretor de origem.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDiscard}
            disabled={loading}
            className="bg-orange-500 text-white hover:bg-orange-600"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Descartando...
              </>
            ) : (
              'Descartar parceria'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
