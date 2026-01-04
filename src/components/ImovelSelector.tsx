import { useState, useEffect } from 'react';
import { Search, Home, X, Plus, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Proprietario {
  id: string;
  nome: string;
  cpf: string | null;
  telefone: string;
}

interface Imovel {
  id: string;
  endereco: string;
  tipo: string;
  bairro: string | null;
  cidade: string | null;
  proprietario_id: string | null;
  proprietario?: Proprietario | null;
}

interface ImovelSelectorProps {
  onSelect: (imovel: Imovel) => void;
  onClear: () => void;
  onModoChange: (modo: 'selecionar' | 'novo') => void;
  imovelSelecionado: Imovel | null;
  onProprietarioVinculado?: (proprietario: Proprietario) => void;
}

export function ImovelSelector({ 
  onSelect, 
  onClear, 
  onModoChange,
  imovelSelecionado,
  onProprietarioVinculado
}: ImovelSelectorProps) {
  const { user } = useAuth();
  const [busca, setBusca] = useState('');
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const buscarImoveis = async () => {
      if (!user?.id || busca.length < 2) {
        setImoveis([]);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('imoveis')
          .select(`
            id, 
            endereco, 
            tipo, 
            bairro, 
            cidade,
            proprietario_id,
            clientes!imoveis_proprietario_id_fkey(id, nome, cpf, telefone)
          `)
          .eq('user_id', user.id)
          .or(`endereco.ilike.%${busca}%,bairro.ilike.%${busca}%,cidade.ilike.%${busca}%`)
          .order('endereco')
          .limit(10);

        if (error) throw error;
        
        // Transform data to include proprietario
        const imoveisComProprietario = (data || []).map(imovel => ({
          ...imovel,
          proprietario: imovel.clientes as Proprietario | null
        }));
        
        setImoveis(imoveisComProprietario);
      } catch (error) {
        console.error('Erro ao buscar imóveis:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(buscarImoveis, 300);
    return () => clearTimeout(debounce);
  }, [busca, user?.id]);

  const handleSelect = (imovel: Imovel) => {
    onSelect(imovel);
    setBusca('');
    setIsOpen(false);
    
    // Se imóvel tem proprietário vinculado, notificar
    if (imovel.proprietario && onProprietarioVinculado) {
      onProprietarioVinculado(imovel.proprietario);
    }
  };

  const handleClear = () => {
    onClear();
    setBusca('');
  };

  if (imovelSelecionado) {
    return (
      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
        <Home className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <p className="font-medium">{imovelSelecionado.endereco}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary" className="text-xs">{imovelSelecionado.tipo}</Badge>
            {imovelSelecionado.bairro && <span>{imovelSelecionado.bairro}</span>}
            {imovelSelecionado.cidade && <span>• {imovelSelecionado.cidade}</span>}
          </div>
          {imovelSelecionado.proprietario && (
            <div className="flex items-center gap-1 mt-1 text-sm text-primary">
              <User className="h-3 w-3" />
              <span>Proprietário: {imovelSelecionado.proprietario.nome}</span>
            </div>
          )}
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
            placeholder="Buscar imóvel por endereço, bairro ou cidade..."
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="pl-10"
          />
          
          {isOpen && (busca.length >= 2 || imoveis.length > 0) && (
            <div className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-auto">
              {isLoading ? (
                <div className="p-3 text-center text-muted-foreground">Buscando...</div>
              ) : imoveis.length > 0 ? (
                imoveis.map((imovel) => (
                  <button
                    key={imovel.id}
                    type="button"
                    className="w-full p-3 text-left hover:bg-muted transition-colors border-b last:border-b-0"
                    onClick={() => handleSelect(imovel)}
                  >
                    <p className="font-medium">{imovel.endereco}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">{imovel.tipo}</Badge>
                      {imovel.bairro && <span>{imovel.bairro}</span>}
                      {imovel.cidade && <span>• {imovel.cidade}</span>}
                    </div>
                    {imovel.proprietario && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-primary">
                        <User className="h-3 w-3" />
                        <span>Proprietário: {imovel.proprietario.nome}</span>
                      </div>
                    )}
                  </button>
                ))
              ) : busca.length >= 2 ? (
                <div className="p-3 text-center text-muted-foreground">
                  Nenhum imóvel encontrado
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
