import { useState, useEffect } from 'react';
import { Search, User, X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatCPF } from '@/lib/cpf';
import { formatPhone } from '@/lib/phone';

interface Cliente {
  id: string;
  nome: string;
  cpf: string | null;
  telefone: string;
  tipo: string;
}

interface ClienteSelectorProps {
  tipo: 'proprietario' | 'comprador';
  onSelect: (cliente: Cliente) => void;
  onClear: () => void;
  onModoChange: (modo: 'selecionar' | 'novo') => void;
  clienteSelecionado: Cliente | null;
}

export function ClienteSelector({ 
  tipo, 
  onSelect, 
  onClear, 
  onModoChange,
  clienteSelecionado 
}: ClienteSelectorProps) {
  const { user } = useAuth();
  const [busca, setBusca] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const tipoLabel = tipo === 'proprietario' ? 'Proprietário' : 'Comprador/Visitante';

  useEffect(() => {
    const buscarClientes = async () => {
      if (!user?.id || busca.length < 2) {
        setClientes([]);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('clientes')
          .select('id, nome, cpf, telefone, tipo')
          .eq('user_id', user.id)
          .eq('tipo', tipo)
          .or(`nome.ilike.%${busca}%,telefone.ilike.%${busca}%,cpf.ilike.%${busca}%`)
          .order('nome')
          .limit(10);

        if (error) throw error;
        setClientes(data || []);
      } catch (error) {
        console.error('Erro ao buscar clientes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(buscarClientes, 300);
    return () => clearTimeout(debounce);
  }, [busca, user?.id, tipo]);

  const handleSelect = (cliente: Cliente) => {
    onSelect(cliente);
    setBusca('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onClear();
    setBusca('');
  };

  if (clienteSelecionado) {
    return (
      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
        <User className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <p className="font-medium">{clienteSelecionado.nome}</p>
          <p className="text-sm text-muted-foreground">
            {clienteSelecionado.cpf && formatCPF(clienteSelecionado.cpf)} • {formatPhone(clienteSelecionado.telefone)}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleClear}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Buscar ${tipoLabel.toLowerCase()} por nome, CPF ou telefone...`}
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="pl-10"
          />
          
          {isOpen && (busca.length >= 2 || clientes.length > 0) && (
            <div className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-auto">
              {isLoading ? (
                <div className="p-3 text-center text-muted-foreground">Buscando...</div>
              ) : clientes.length > 0 ? (
                clientes.map((cliente) => (
                  <button
                    key={cliente.id}
                    type="button"
                    className="w-full p-3 text-left hover:bg-muted transition-colors border-b last:border-b-0"
                    onClick={() => handleSelect(cliente)}
                  >
                    <p className="font-medium">{cliente.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {cliente.cpf && formatCPF(cliente.cpf)} • {formatPhone(cliente.telefone)}
                    </p>
                  </button>
                ))
              ) : busca.length >= 2 ? (
                <div className="p-3 text-center text-muted-foreground">
                  Nenhum {tipoLabel.toLowerCase()} encontrado
                </div>
              ) : null}
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => onModoChange('novo')}
          className="shrink-0"
        >
          <Plus className="h-4 w-4 mr-1" />
          Novo
        </Button>
      </div>
      
      {isOpen && <div className="fixed inset-0 z-0" onClick={() => setIsOpen(false)} />}
    </div>
  );
}
