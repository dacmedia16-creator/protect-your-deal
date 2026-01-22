import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface EquipeLiderada {
  id: string;
  nome: string;
  cor: string;
  descricao: string | null;
  imobiliaria_id: string;
}

interface UseEquipeLiderResult {
  isLider: boolean;
  equipesLideradas: EquipeLiderada[];
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useEquipeLider(): UseEquipeLiderResult {
  const { user } = useAuth();
  const [isLider, setIsLider] = useState(false);
  const [equipesLideradas, setEquipesLideradas] = useState<EquipeLiderada[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEquipesLideradas = useCallback(async () => {
    if (!user?.id) {
      setIsLider(false);
      setEquipesLideradas([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('equipes')
        .select('id, nome, cor, descricao, imobiliaria_id')
        .eq('lider_id', user.id)
        .eq('ativa', true);

      if (error) {
        console.error('Error fetching equipes lideradas:', error);
        setIsLider(false);
        setEquipesLideradas([]);
      } else {
        setEquipesLideradas(data || []);
        setIsLider((data?.length || 0) > 0);
      }
    } catch (err) {
      console.error('Error in useEquipeLider:', err);
      setIsLider(false);
      setEquipesLideradas([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchEquipesLideradas();
  }, [fetchEquipesLideradas]);

  return {
    isLider,
    equipesLideradas,
    loading,
    refetch: fetchEquipesLideradas,
  };
}
