import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MapPin } from 'lucide-react';

interface CepInputProps {
  onAddressFound: (endereco: string, details?: { logradouro: string; bairro: string; cidade: string; uf: string }) => void;
  disabled?: boolean;
}

export function CepInput({ onAddressFound, disabled }: CepInputProps) {
  const [cep, setCep] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length > 5) {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }
    return digits;
  };

  const fetchCep = useCallback(async (cleanCep: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (data.erro) {
        setError('CEP não encontrado');
        return;
      }
      const parts = [data.logradouro, data.bairro, data.localidade ? `${data.localidade} - ${data.uf}` : ''].filter(Boolean);
      onAddressFound(parts.join(', '), {
        logradouro: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        uf: data.uf || '',
      });
    } catch {
      setError('Erro ao buscar CEP');
    } finally {
      setLoading(false);
    }
  }, [onAddressFound]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setCep(formatted);
    setError('');
    const digits = formatted.replace(/\D/g, '');
    if (digits.length === 8) {
      fetchCep(digits);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="cep" className="flex items-center gap-1.5">
        <MapPin className="h-3.5 w-3.5" />
        Buscar por CEP
      </Label>
      <div className="relative">
        <Input
          id="cep"
          placeholder="00000-000"
          value={cep}
          onChange={handleChange}
          disabled={disabled || loading}
          maxLength={9}
          className="pr-10"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
