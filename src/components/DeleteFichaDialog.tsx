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
import { Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DeleteFichaDialogProps {
  fichaId: string;
  protocolo: string;
  onDeleted: () => void;
  variant?: 'icon' | 'button';
}

export function DeleteFichaDialog({ fichaId, protocolo, onDeleted, variant = 'icon' }: DeleteFichaDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      // 1. Primeiro, buscar e deletar arquivos de backup no storage
      const { data: backupFiles } = await supabase
        .storage
        .from('comprovantes-backup')
        .list('', {
          search: protocolo
        });

      // Deletar todos os backups que começam com o protocolo
      if (backupFiles && backupFiles.length > 0) {
        const filesToDelete = backupFiles
          .filter(file => file.name.startsWith(protocolo))
          .map(file => file.name);

        if (filesToDelete.length > 0) {
          await supabase
            .storage
            .from('comprovantes-backup')
            .remove(filesToDelete);
          
          console.log(`Backups deletados: ${filesToDelete.join(', ')}`);
        }
      }

      // 2. Depois, deletar a ficha do banco
      const { error } = await supabase
        .from('fichas_visita')
        .delete()
        .eq('id', fichaId);

      if (error) throw error;

      toast({
        title: 'Registro excluído',
        description: `O registro ${protocolo} foi excluído com sucesso.`,
      });
      
      setOpen(false);
      onDeleted();
    } catch (error: any) {
      console.error('Erro ao excluir ficha:', error);
      toast({
        title: 'Erro ao excluir',
        description: error.message || 'Não foi possível excluir o registro.',
        variant: 'destructive',
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
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => e.stopPropagation()}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button 
            variant="destructive" 
            size="sm" 
            className="gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir registro de visita?</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o registro <strong className="text-foreground">{protocolo}</strong>?
            <br />
            <span className="text-destructive">Esta ação não pode ser desfeita.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              'Excluir'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
