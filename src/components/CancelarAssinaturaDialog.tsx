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
import { Loader2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CancelarAssinaturaDialogProps {
  assinaturaId: string;
  onCancelled: () => void;
}

export function CancelarAssinaturaDialog({ assinaturaId, onCancelled }: CancelarAssinaturaDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('asaas-cancel-subscription', {
        body: { assinaturaId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Assinatura cancelada com sucesso', {
        description: 'Você não será cobrado na próxima renovação.',
      });
      setOpen(false);
      onCancelled();
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast.error('Erro ao cancelar assinatura', {
        description: error.message || 'Tente novamente mais tarde.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
          <XCircle className="h-4 w-4 mr-2" />
          Cancelar Plano
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar assinatura?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Ao cancelar, sua assinatura permanecerá ativa até o final do período atual,
              mas <strong>não haverá cobrança na próxima renovação</strong>.
            </p>
            <p>
              Você poderá reativar a qualquer momento escolhendo um novo plano.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Voltar</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirmar Cancelamento
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
