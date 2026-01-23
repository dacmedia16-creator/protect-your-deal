import { useState } from 'react';
import { Loader2, DollarSign, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface MarcarVendaDialogProps {
  fichaId: string;
  protocolo: string;
  jaVendida?: boolean;
  valorVenda?: number | null;
  convertidoEm?: string | null;
  onVendaRegistrada: () => void;
  children?: React.ReactNode;
}

export function MarcarVendaDialog({
  fichaId,
  protocolo,
  jaVendida = false,
  valorVenda,
  convertidoEm,
  onVendaRegistrada,
  children,
}: MarcarVendaDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [valor, setValor] = useState('');

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const cents = parseInt(numbers, 10) || 0;
    const reais = cents / 100;
    return reais.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setValor(raw);
  };

  const handleSubmit = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const valorNumerico = valor ? parseInt(valor, 10) / 100 : null;

      const { error } = await supabase
        .from('fichas_visita')
        .update({
          convertido_venda: true,
          valor_venda: valorNumerico,
          convertido_em: new Date().toISOString(),
          convertido_por: user.id,
        })
        .eq('id', fichaId);

      if (error) throw error;

      toast({
        title: '🎉 Venda registrada!',
        description: `Registro #${protocolo} marcado como vendido.`,
      });

      setOpen(false);
      setValor('');
      onVendaRegistrada();
    } catch (err) {
      console.error('Erro ao registrar venda:', err);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível registrar a venda.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDesmarcar = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('fichas_visita')
        .update({
          convertido_venda: false,
          valor_venda: null,
          convertido_em: null,
          convertido_por: null,
        })
        .eq('id', fichaId);

      if (error) throw error;

      toast({
        title: 'Venda desmarcada',
        description: `Registro #${protocolo} não é mais marcado como vendido.`,
      });

      setOpen(false);
      onVendaRegistrada();
    } catch (err) {
      console.error('Erro ao desmarcar venda:', err);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível desmarcar a venda.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (jaVendida) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PartyPopper className="h-5 w-5 text-success" />
              Venda Registrada
            </DialogTitle>
            <DialogDescription>
              Este registro foi marcado como vendido
              {convertidoEm && (
                <> em {new Date(convertidoEm).toLocaleDateString('pt-BR')}</>
              )}
              .
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {valorVenda && (
              <div className="p-4 rounded-lg bg-success/10 border border-success/30">
                <p className="text-sm text-muted-foreground">Valor da venda</p>
                <p className="text-2xl font-bold text-success">
                  {valorVenda.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Fechar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDesmarcar}
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Desmarcar Venda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PartyPopper className="h-5 w-5 text-primary" />
            Marcar como Vendido
          </DialogTitle>
          <DialogDescription>
            Registre a conversão deste imóvel em venda. Você pode informar o valor opcionalmente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="valor_venda">Valor da Venda (opcional)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="valor_venda"
                placeholder="R$ 0,00"
                value={valor ? formatCurrency(valor) : ''}
                onChange={handleValorChange}
                className="pl-9"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              O valor da venda ajuda a calcular o volume total de vendas
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PartyPopper className="h-4 w-4" />
            )}
            Confirmar Venda
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
