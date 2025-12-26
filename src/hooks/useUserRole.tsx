import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'super_admin' | 'imobiliaria_admin' | 'corretor';

interface UserRoleContextType {
  role: AppRole | null;
  imobiliariaId: string | null;
  imobiliaria: Imobiliaria | null;
  assinatura: Assinatura | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

interface Imobiliaria {
  id: string;
  nome: string;
  cnpj: string | null;
  email: string;
  telefone: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  logo_url: string | null;
  status: string;
}

interface Assinatura {
  id: string;
  status: string;
  data_inicio: string;
  data_fim: string | null;
  proxima_cobranca: string | null;
  plano: {
    id: string;
    nome: string;
    max_corretores: number;
    max_fichas_mes: number;
    max_clientes: number;
    max_imoveis: number;
    valor_mensal: number;
  } | null;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export function UserRoleProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [imobiliariaId, setImobiliariaId] = useState<string | null>(null);
  const [imobiliaria, setImobiliaria] = useState<Imobiliaria | null>(null);
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchUserRole = async () => {
    if (!user) {
      setRole(null);
      setImobiliariaId(null);
      setImobiliaria(null);
      setAssinatura(null);
      setLoading(false);
      setHasFetched(true);
      return;
    }

    setLoading(true);

    try {
      // Fetch user role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role, imobiliaria_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (roleError) {
        console.error('Error fetching user role:', roleError);
        setLoading(false);
        return;
      }

      if (roleData) {
        setRole(roleData.role as AppRole);
        setImobiliariaId(roleData.imobiliaria_id);

        // Fetch imobiliaria details if user has one
        if (roleData.imobiliaria_id) {
          const { data: imobData } = await supabase
            .from('imobiliarias')
            .select('*')
            .eq('id', roleData.imobiliaria_id)
            .maybeSingle();

          setImobiliaria(imobData);

          // Fetch subscription
          const { data: assData } = await supabase
            .from('assinaturas')
            .select(`
              id,
              status,
              data_inicio,
              data_fim,
              proxima_cobranca,
              plano:planos (
                id,
                nome,
                max_corretores,
                max_fichas_mes,
                max_clientes,
                max_imoveis,
                valor_mensal
              )
            `)
            .eq('imobiliaria_id', roleData.imobiliaria_id)
            .order('created_at', { ascending: false })
            .maybeSingle();

          if (assData) {
            setAssinatura({
              ...assData,
              plano: Array.isArray(assData.plano) ? assData.plano[0] : assData.plano
            });
          }
        }
      }
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
    } finally {
      setLoading(false);
      setHasFetched(true);
    }
  };

  // Determine if we're truly loading
  const isLoading = authLoading || (user && !hasFetched) || loading;

  useEffect(() => {
    if (!authLoading) {
      fetchUserRole();
    }
  }, [user, authLoading]);

  return (
    <UserRoleContext.Provider value={{ 
      role, 
      imobiliariaId, 
      imobiliaria, 
      assinatura, 
      loading: isLoading,
      refetch: fetchUserRole
    }}>
      {children}
    </UserRoleContext.Provider>
  );
}

export function useUserRole() {
  const context = useContext(UserRoleContext);
  if (context === undefined) {
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }
  return context;
}

// Permission helpers
export function usePermissions() {
  const { role } = useUserRole();

  return {
    isSuperAdmin: role === 'super_admin',
    isImobiliariaAdmin: role === 'imobiliaria_admin',
    isCorretor: role === 'corretor',
    canManageImobiliarias: role === 'super_admin',
    canManagePlanos: role === 'super_admin',
    canManageCorretores: role === 'imobiliaria_admin' || role === 'super_admin',
    canViewAllFichas: role === 'imobiliaria_admin' || role === 'super_admin',
    canExportReports: role === 'imobiliaria_admin' || role === 'super_admin',
  };
}
