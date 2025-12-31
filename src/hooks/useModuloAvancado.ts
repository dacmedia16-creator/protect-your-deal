import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

interface Modulo {
  id: string;
  nome: string;
  codigo: string;
  descricao: string | null;
  valor_mensal: number;
  recursos: string[];
}

interface ModuloContratado {
  id: string;
  modulo_id: string;
  status: string;
  data_inicio: string;
  data_fim: string | null;
}

export function useModuloAvancado() {
  const { user } = useAuth();
  const { role, imobiliariaId } = useUserRole();
  const [temModuloAvancado, setTemModuloAvancado] = useState(false);
  const [modulo, setModulo] = useState<Modulo | null>(null);
  const [contratacao, setContratacao] = useState<ModuloContratado | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function checkModulo() {
      try {
        // Buscar o módulo avançado
        const { data: moduloData, error: moduloError } = await supabase
          .from('modulos')
          .select('*')
          .eq('codigo', 'avancado')
          .eq('ativo', true)
          .single();

        if (moduloError || !moduloData) {
          setLoading(false);
          return;
        }

        setModulo({
          ...moduloData,
          recursos: Array.isArray(moduloData.recursos) 
            ? moduloData.recursos as string[]
            : []
        });

        // Verificar se está contratado
        let query = supabase
          .from('modulos_contratados')
          .select('*')
          .eq('modulo_id', moduloData.id)
          .eq('status', 'ativo');

        // Verificar por imobiliária ou usuário
        if (imobiliariaId) {
          query = query.eq('imobiliaria_id', imobiliariaId);
        } else {
          query = query.eq('user_id', user.id);
        }

        const { data: contratacaoData, error: contratacaoError } = await query.maybeSingle();

        if (!contratacaoError && contratacaoData) {
          setContratacao(contratacaoData);
          setTemModuloAvancado(true);
        } else {
          setTemModuloAvancado(false);
        }
      } catch (error) {
        console.error('Erro ao verificar módulo avançado:', error);
      } finally {
        setLoading(false);
      }
    }

    checkModulo();
  }, [user, imobiliariaId]);

  // Super admin sempre tem acesso
  const hasAccess = role === 'super_admin' || temModuloAvancado;

  return {
    temModuloAvancado: hasAccess,
    modulo,
    contratacao,
    loading,
  };
}

// Hook para verificar recurso específico
export function useRecursoAvancado(recurso: string) {
  const { temModuloAvancado, modulo, loading } = useModuloAvancado();

  const temRecurso = temModuloAvancado && modulo?.recursos?.includes(recurso);

  return {
    temRecurso,
    loading,
  };
}
