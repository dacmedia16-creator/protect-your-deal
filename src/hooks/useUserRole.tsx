import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'super_admin' | 'imobiliaria_admin' | 'corretor' | 'afiliado' | 'construtora_admin';

interface UserRoleContextType {
  role: AppRole | null;
  imobiliariaId: string | null;
  imobiliaria: Imobiliaria | null;
  construtoraId: string | null;
  construtora: Construtora | null;
  assinatura: Assinatura | null;
  ativo: boolean | null;
  loading: boolean;
  error: boolean;
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
  codigo: number | null;
}

interface Construtora {
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
  codigo: number | null;
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
  const [ativo, setAtivo] = useState<boolean | null>(null);
  const [internalLoading, setInternalLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  // Track which user ID we have fetched for - null means never fetched
  const [fetchedForUserId, setFetchedForUserId] = useState<string | null>(null);

  const fetchUserRole = async (isRetry = false) => {
    if (!user) {
      setRole(null);
      setImobiliariaId(null);
      setImobiliaria(null);
      setConstrutoraId(null);
      setConstrutora(null);
      setAssinatura(null);
      setAtivo(null);
      setInternalLoading(false);
      setFetchError(false);
      setFetchedForUserId(null);
      return;
    }

    const currentUserId = user.id;
    setInternalLoading(true);
    setFetchError(false);

    try {
      // Fetch user role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role, imobiliaria_id, construtora_id')
        .eq('user_id', currentUserId)
        .maybeSingle();

      if (roleError) {
        console.error('Error fetching user role:', roleError);
        // Retry once automatically
        if (!isRetry) {
          console.log('Retrying role fetch in 1s...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchUserRole(true);
        }
        setFetchError(true);
        setInternalLoading(false);
        setFetchedForUserId(currentUserId);
        return;
      }

      if (roleData) {
        setRole(roleData.role as AppRole);
        setImobiliariaId(roleData.imobiliaria_id);
        setConstrutoraId((roleData as any).construtora_id || null);

        // Fetch user's active status from profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('ativo')
          .eq('user_id', currentUserId)
          .maybeSingle();

        setAtivo(profileData?.ativo ?? true);

        // Fetch imobiliaria details if user has one
        if (roleData.imobiliaria_id) {
          const { data: imobData } = await supabase
            .from('imobiliarias')
            .select('*')
            .eq('id', roleData.imobiliaria_id)
            .maybeSingle();

          setImobiliaria(imobData);

          // Fetch subscription for imobiliária
          const { data: assData } = await supabase
            .from('assinaturas')
            .select(`
              id,
              status,
              data_inicio,
              data_fim,
              proxima_cobranca,
              plano:planos!assinaturas_plano_id_fkey (
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
        } else if (roleData.role === 'corretor') {
          // Corretor autônomo - buscar assinatura individual via user_id
          const { data: assData } = await supabase
            .from('assinaturas')
            .select(`
              id,
              status,
              data_inicio,
              data_fim,
              proxima_cobranca,
              plano:planos!assinaturas_plano_id_fkey (
                id,
                nome,
                max_corretores,
                max_fichas_mes,
                max_clientes,
                max_imoveis,
                valor_mensal
              )
            `)
            .eq('user_id', currentUserId)
            .order('created_at', { ascending: false })
            .maybeSingle();

          if (assData) {
            setAssinatura({
              ...assData,
              plano: Array.isArray(assData.plano) ? assData.plano[0] : assData.plano
            });
          } else {
            setAssinatura(null);
          }
        }
      } else {
        // No role in user_roles - check if user is an afiliado
        const { data: afiliadoData, error: afiliadoError } = await supabase
          .from('afiliados')
          .select('id')
          .eq('user_id', currentUserId)
          .maybeSingle();

        if (!afiliadoError && afiliadoData) {
          // User is an afiliado
          setRole('afiliado');
          setImobiliariaId(null);
          setImobiliaria(null);
          setAssinatura(null);
        } else {
          // No role found - reset role state
          setRole(null);
          setImobiliariaId(null);
          setImobiliaria(null);
          setAssinatura(null);
          setAtivo(null);
        }
      }
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
      if (!isRetry) {
        console.log('Retrying role fetch after catch in 1s...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchUserRole(true);
      }
      setFetchError(true);
    } finally {
      setInternalLoading(false);
      setFetchedForUserId(currentUserId);
    }
  };

  // Loading is true when:
  // 1. Auth is still loading, OR
  // 2. We have a user but haven't fetched for THIS specific user yet, OR
  // 3. We're actively fetching
  const isLoading = authLoading || (user && fetchedForUserId !== user.id) || internalLoading;

  useEffect(() => {
    if (!authLoading) {
      // Only fetch if we haven't fetched for this user yet
      if (user && fetchedForUserId !== user.id) {
        fetchUserRole();
      } else if (!user && fetchedForUserId !== null) {
        // User logged out, reset state
        fetchUserRole();
      }
    }
  }, [user, authLoading, fetchedForUserId]);

  return (
    <UserRoleContext.Provider value={{ 
      role, 
      imobiliariaId, 
      imobiliaria, 
      assinatura, 
      ativo,
      loading: isLoading,
      error: fetchError,
      refetch: () => fetchUserRole(false),
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
  const { role, imobiliariaId } = useUserRole();

  return {
    isSuperAdmin: role === 'super_admin',
    isImobiliariaAdmin: role === 'imobiliaria_admin',
    isCorretor: role === 'corretor',
    isAfiliado: role === 'afiliado',
    isCorretorAutonomo: role === 'corretor' && !imobiliariaId,
    canManageImobiliarias: role === 'super_admin',
    canManagePlanos: role === 'super_admin',
    canManageCorretores: role === 'imobiliaria_admin' || role === 'super_admin',
    canViewAllFichas: role === 'imobiliaria_admin' || role === 'super_admin',
    canExportReports: role === 'imobiliaria_admin' || role === 'super_admin',
  };
}
