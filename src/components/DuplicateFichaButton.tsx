import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRecursoAvancado } from '@/hooks/useModuloAvancado';
import { toast } from 'sonner';

interface DuplicateFichaButtonProps {
  fichaId: string;
  variant?: 'ghost' | 'outline' | 'default';
  size?: 'icon' | 'sm' | 'default';
  showLabel?: boolean;
  onDuplicated?: (newFichaId: string) => void;
}

export function DuplicateFichaButton({
  fichaId,
  variant = 'ghost',
  size = 'icon',
  showLabel = false,
  onDuplicated,
}: DuplicateFichaButtonProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { temRecurso, loading: loadingRecurso } = useRecursoAvancado('duplicar_fichas');
  const [duplicating, setDuplicating] = useState(false);

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!temRecurso) {
      toast.error('Recurso exclusivo do Módulo Avançado', {
        description: 'Contrate o módulo para duplicar fichas.',
        action: {
          label: 'Ver módulo',
          onClick: () => navigate('/empresa/modulo-avancado'),
        },
      });
      return;
    }

    if (!user) return;

    try {
      setDuplicating(true);

      // Fetch original ficha
      const { data: originalFicha, error: fetchError } = await supabase
        .from('fichas_visita')
        .select('*')
        .eq('id', fichaId)
        .single();

      if (fetchError || !originalFicha) {
        throw new Error('Ficha não encontrada');
      }

      // Generate new protocol
      const { data: protocolo } = await supabase.rpc('generate_protocolo');

      // Create duplicated ficha
      const { data: newFicha, error: insertError } = await supabase
        .from('fichas_visita')
        .insert({
          protocolo: protocolo || `VS${Date.now()}`,
          imovel_tipo: originalFicha.imovel_tipo,
          imovel_endereco: originalFicha.imovel_endereco,
          proprietario_nome: originalFicha.proprietario_nome,
          proprietario_cpf: originalFicha.proprietario_cpf,
          proprietario_telefone: originalFicha.proprietario_telefone,
          comprador_nome: originalFicha.comprador_nome,
          comprador_cpf: originalFicha.comprador_cpf,
          comprador_telefone: originalFicha.comprador_telefone,
          data_visita: new Date().toISOString(),
          observacoes: originalFicha.observacoes 
            ? `[Duplicado de ${originalFicha.protocolo}] ${originalFicha.observacoes}`
            : `Duplicado de ${originalFicha.protocolo}`,
          user_id: user.id,
          imobiliaria_id: originalFicha.imobiliaria_id,
          status: 'pendente',
        })
        .select('id')
        .single();

      if (insertError || !newFicha) {
        throw insertError;
      }

      toast.success('Ficha duplicada com sucesso!', {
        description: `Nova ficha criada: ${protocolo}`,
        action: {
          label: 'Ver ficha',
          onClick: () => navigate(`/fichas/${newFicha.id}`),
        },
      });

      onDuplicated?.(newFicha.id);
    } catch (error) {
      console.error('Erro ao duplicar ficha:', error);
      toast.error('Erro ao duplicar ficha');
    } finally {
      setDuplicating(false);
    }
  };

  if (loadingRecurso) {
    return (
      <Button variant={variant} size={size} disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  const buttonContent = (
    <Button
      variant={variant}
      size={size}
      onClick={handleDuplicate}
      disabled={duplicating}
      className={!temRecurso ? 'opacity-50' : ''}
    >
      {duplicating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : !temRecurso ? (
        <Lock className="h-4 w-4" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
      {showLabel && <span className="ml-2">{temRecurso ? 'Duplicar' : 'Módulo Avançado'}</span>}
    </Button>
  );

  if (!showLabel) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
          <TooltipContent>
            {temRecurso ? 'Duplicar ficha' : 'Módulo Avançado necessário'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return buttonContent;
}
