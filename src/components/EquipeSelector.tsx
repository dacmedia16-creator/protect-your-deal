import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Equipe {
  id: string;
  nome: string;
  cor: string;
  parent_id: string | null;
  parentNome?: string;
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
        .select('id, nome, cor, parent_id')
        .eq('imobiliaria_id', imobiliariaId)
        .eq('ativa', true)
        .order('nome');

      if (data) {
        // Build hierarchical display names
        const equipesMap = new Map(data.map(e => [e.id, e]));
        const enrichedEquipes = data.map(e => ({
          ...e,
          parentNome: e.parent_id ? equipesMap.get(e.parent_id)?.nome : undefined
        }));
        
        // Sort: main teams first, then sub-teams grouped under parents
        const mainEquipes = enrichedEquipes.filter(e => !e.parent_id);
        const subEquipes = enrichedEquipes.filter(e => e.parent_id);
        
        const sortedEquipes: Equipe[] = [];
        mainEquipes.forEach(main => {
          sortedEquipes.push(main);
          subEquipes
            .filter(sub => sub.parent_id === main.id)
            .forEach(sub => sortedEquipes.push(sub));
        });
        
        setEquipes(sortedEquipes);
      }
      
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
            <div className={`flex items-center gap-2 ${equipe.parent_id ? 'pl-4' : ''}`}>
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: equipe.cor }}
              />
              <span className={equipe.parent_id ? 'text-muted-foreground' : ''}>
                {equipe.parent_id ? `↳ ${equipe.nome}` : equipe.nome}
              </span>
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