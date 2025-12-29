import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UseTermosAceitosResult {
  termosAceitos: boolean | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useTermosAceitos(): UseTermosAceitosResult {
  const { user, loading: authLoading } = useAuth();
  const [termosAceitos, setTermosAceitos] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTermosStatus = async () => {
    if (!user) {
      setTermosAceitos(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('termos_aceitos_em')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar status dos termos:', error);
        setTermosAceitos(null);
      } else {
        setTermosAceitos(data?.termos_aceitos_em !== null);
      }
    } catch (error) {
      console.error('Erro ao verificar termos:', error);
      setTermosAceitos(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchTermosStatus();
    }
  }, [user, authLoading]);

  return {
    termosAceitos,
    loading: authLoading || loading,
    refetch: fetchTermosStatus,
  };
}
