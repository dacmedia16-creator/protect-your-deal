import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EquipeBadge } from './EquipeBadge';

interface Equipe {
  id: string;
  nome: string;
  cor: string;
}

interface EquipeSelectorProps {
  imobiliariaId: string;
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  includeAll?: boolean;
  className?: string;
}

export function EquipeSelector({
  imobiliariaId,
  value,
  onValueChange,
  placeholder = "Selecione uma equipe",
  includeAll = false,
  className,
}: EquipeSelectorProps) {
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEquipes() {
      if (!imobiliariaId) return;

      const { data } = await supabase
        .from('equipes')
        .select('id, nome, cor')
        .eq('imobiliaria_id', imobiliariaId)
        .eq('ativa', true)
        .order('nome');

      setEquipes(data || []);
      setLoading(false);
    }

    fetchEquipes();
  }, [imobiliariaId]);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className} disabled={loading}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {includeAll && (
          <SelectItem value="all">Todas as equipes</SelectItem>
        )}
        {equipes.map((equipe) => (
          <SelectItem key={equipe.id} value={equipe.id}>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: equipe.cor }}
              />
              {equipe.nome}
            </div>
          </SelectItem>
        ))}
        {equipes.length === 0 && !loading && (
          <SelectItem value="none" disabled>
            Nenhuma equipe cadastrada
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}