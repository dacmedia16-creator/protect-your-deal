import { useState, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MapPin } from 'lucide-react';

interface CepDetails {
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
}

interface CepInputProps {
  onAddressFound: (endereco: string, details?: CepDetails) => void;
  disabled?: boolean;
}

export function CepInput({ onAddressFound, disabled }: CepInputProps) {
  const [cep, setCep] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [found, setFound] = useState(false);
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const detailsRef = useRef<CepDetails | null>(null);

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length > 5) {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }
    return digits;
  };

  const buildAddress = useCallback((details: CepDetails, num: string, compl: string) => {
    let logradouro = details.logradouro;
    if (num) logradouro += `, ${num}`;
    if (compl) logradouro += ` - ${compl}`;
    const parts = [logradouro, details.bairro, details.cidade ? `${details.cidade} - ${details.uf}` : ''].filter(Boolean);
    return parts.join(', ');
  }, []);

  const fetchCep = useCallback(async (cleanCep: string) => {
    setLoading(true);
    setError('');
    setFound(false);
    setNumero('');
    setComplemento('');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (data.erro) {
        setError('CEP não encontrado');
        return;
      }
      const details: CepDetails = {
        logradouro: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        uf: data.uf || '',
      };
      detailsRef.current = details;
      setFound(true);
      onAddressFound(buildAddress(details, '', ''), details);
    } catch {
      setError('Erro ao buscar CEP');
    } finally {
      setLoading(false);
    }
  }, [onAddressFound, buildAddress]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setCep(formatted);
    setError('');
    const digits = formatted.replace(/\D/g, '');
    if (digits.length === 8) {
      fetchCep(digits);
    }
  };

  const handleNumeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNumero(val);
    if (detailsRef.current) {
      onAddressFound(buildAddress(detailsRef.current, val, complemento), detailsRef.current);
    }
  };

  const handleComplementoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setComplemento(val);
    if (detailsRef.current) {
      onAddressFound(buildAddress(detailsRef.current, numero, val), detailsRef.current);
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
      {found && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="cep-numero" className="text-xs">Número</Label>
            <Input
              id="cep-numero"
              placeholder="Ex: 123"
              value={numero}
              onChange={handleNumeroChange}
              disabled={disabled}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cep-complemento" className="text-xs">Complemento</Label>
            <Input
              id="cep-complemento"
              placeholder="Ex: Apto 12, Bloco B"
              value={complemento}
              onChange={handleComplementoChange}
              disabled={disabled}
            />
          </div>
        </div>
      )}
    </div>
  );
}
