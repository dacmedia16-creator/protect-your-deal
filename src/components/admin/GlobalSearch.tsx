import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Building2, Users, UserCircle, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SearchResult {
  id: string;
  type: 'imobiliaria' | 'usuario' | 'autonomo';
  name: string;
  subtitle?: string;
  status?: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);
  const navigate = useNavigate();

  // Keyboard shortcut (Ctrl+K / Cmd+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Search imobiliarias
  const { data: imobiliarias, isLoading: loadingImobiliarias } = useQuery({
    queryKey: ['global-search-imobiliarias', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      
      const { data, error } = await supabase
        .from('imobiliarias')
        .select('id, nome, cnpj, email, status')
        .or(`nome.ilike.%${debouncedQuery}%,cnpj.ilike.%${debouncedQuery}%,email.ilike.%${debouncedQuery}%`)
        .limit(5);
      
      if (error) throw error;
      
      return (data || []).map((item): SearchResult => ({
        id: item.id,
        type: 'imobiliaria',
        name: item.nome,
        subtitle: item.cnpj || item.email,
        status: item.status,
      }));
    },
    enabled: open && debouncedQuery.length >= 2,
  });

  // Search all users
  const { data: usuarios, isLoading: loadingUsuarios } = useQuery({
    queryKey: ['global-search-usuarios', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          nome,
          email,
          creci,
          ativo,
          imobiliaria_id
        `)
        .or(`nome.ilike.%${debouncedQuery}%,email.ilike.%${debouncedQuery}%,creci.ilike.%${debouncedQuery}%`)
        .not('imobiliaria_id', 'is', null)
        .limit(5);
      
      if (error) throw error;
      
      return (data || []).map((item): SearchResult => ({
        id: item.user_id,
        type: 'usuario',
        name: item.nome,
        subtitle: item.email || item.creci || undefined,
        status: item.ativo ? 'ativo' : 'inativo',
      }));
    },
    enabled: open && debouncedQuery.length >= 2,
  });

  // Search autonomous brokers (corretores without imobiliaria_id)
  const { data: autonomos, isLoading: loadingAutonomos } = useQuery({
    queryKey: ['global-search-autonomos', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      
      // First get autonomous user_ids
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'corretor')
        .is('imobiliaria_id', null);
      
      if (rolesError) throw rolesError;
      if (!rolesData || rolesData.length === 0) return [];
      
      const userIds = rolesData.map(r => r.user_id);
      
      // Then search profiles
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          nome,
          email,
          creci,
          ativo
        `)
        .in('user_id', userIds)
        .or(`nome.ilike.%${debouncedQuery}%,email.ilike.%${debouncedQuery}%,creci.ilike.%${debouncedQuery}%`)
        .limit(5);
      
      if (error) throw error;
      
      return (data || []).map((item): SearchResult => ({
        id: item.user_id,
        type: 'autonomo',
        name: item.nome,
        subtitle: item.creci ? `CRECI: ${item.creci}` : item.email || undefined,
        status: item.ativo ? 'ativo' : 'inativo',
      }));
    },
    enabled: open && debouncedQuery.length >= 2,
  });

  const isLoading = loadingImobiliarias || loadingUsuarios || loadingAutonomos;
  const hasResults = (imobiliarias?.length || 0) + (usuarios?.length || 0) + (autonomos?.length || 0) > 0;

  const handleSelect = useCallback((result: SearchResult) => {
    setOpen(false);
    setSearchQuery('');
    
    switch (result.type) {
      case 'imobiliaria':
        navigate(`/admin/imobiliarias/${result.id}`);
        break;
      case 'usuario':
        navigate(`/admin/usuarios`);
        break;
      case 'autonomo':
        navigate(`/admin/autonomos/${result.id}`);
        break;
    }
  }, [navigate]);

  const getStatusBadge = (status?: string, type?: string) => {
    if (!status) return null;
    
    if (type === 'imobiliaria') {
      return (
        <Badge 
          variant={status === 'ativo' ? 'default' : 'secondary'}
          className="ml-auto text-[10px] h-5"
        >
          {status}
        </Badge>
      );
    }
    
    return (
      <Badge 
        variant={status === 'ativo' ? 'default' : 'secondary'}
        className="ml-auto text-[10px] h-5"
      >
        {status}
      </Badge>
    );
  };

  return (
    <>
      {/* Search Trigger Button */}
      <Button
        variant="outline"
        className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 xl:mr-2" />
        <span className="hidden xl:inline-flex">Buscar...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* Command Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Buscar imobiliárias, usuários ou corretores..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          {debouncedQuery.length < 2 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Digite pelo menos 2 caracteres para buscar
            </div>
          )}
          
          {debouncedQuery.length >= 2 && isLoading && (
            <div className="py-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando...
            </div>
          )}
          
          {debouncedQuery.length >= 2 && !isLoading && !hasResults && (
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          )}

          {/* Imobiliárias Group */}
          {imobiliarias && imobiliarias.length > 0 && (
            <CommandGroup heading="Imobiliárias">
              {imobiliarias.map((result) => (
                <CommandItem
                  key={`imob-${result.id}`}
                  value={`imob-${result.id}-${result.name}`}
                  onSelect={() => handleSelect(result)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{result.name}</p>
                    {result.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                    )}
                  </div>
                  {getStatusBadge(result.status, 'imobiliaria')}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Usuários Group */}
          {usuarios && usuarios.length > 0 && (
            <CommandGroup heading="Usuários (Vinculados)">
              {usuarios.map((result) => (
                <CommandItem
                  key={`user-${result.id}`}
                  value={`user-${result.id}-${result.name}`}
                  onSelect={() => handleSelect(result)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{result.name}</p>
                    {result.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                    )}
                  </div>
                  {getStatusBadge(result.status)}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Autônomos Group */}
          {autonomos && autonomos.length > 0 && (
            <CommandGroup heading="Corretores Autônomos">
              {autonomos.map((result) => (
                <CommandItem
                  key={`auto-${result.id}`}
                  value={`auto-${result.id}-${result.name}`}
                  onSelect={() => handleSelect(result)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <UserCircle className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{result.name}</p>
                    {result.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                    )}
                  </div>
                  {getStatusBadge(result.status)}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
