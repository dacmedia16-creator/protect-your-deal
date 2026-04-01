import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useInfiniteList } from '@/hooks/useInfiniteList';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Users,
  Search,
  Loader2,
  User,
  Building2,
  Phone,
  Mail,
  MoreVertical,
  Pencil,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { MobileHeader } from '@/components/MobileHeader';
import { MobileNav } from '@/components/MobileNav';

import { DesktopNav } from '@/components/DesktopNav';
import { InfiniteScrollTrigger } from '@/components/InfiniteScrollTrigger';

type Cliente = {
  id: string;
  nome: string;
  cpf: string | null;
  telefone: string;
  email: string | null;
  tipo: string;
  notas: string | null;
  tags: string[] | null;
  created_at: string;
};

export default function ListaClientes() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteList<Cliente>({
    queryKey: ['clientes', user?.id || ''],
    table: 'clientes',
    filters: { user_id: user?.id },
    orderBy: { column: 'nome', ascending: true },
    pageSize: 20,
    enabled: !!user,
  });

  const clientes = useMemo(() => 
    data?.pages.flatMap(page => page.items) || [], 
    [data]
  );
  const totalCount = data?.pages[0]?.totalCount || 0;

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast({
        title: 'Cliente excluído',
        description: 'O cliente foi removido com sucesso.',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível excluir o cliente.',
      });
    },
  });

  const filteredClientes = useMemo(() => clientes.filter(cliente => {
    const matchesSearch = 
      cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.telefone.includes(searchTerm) ||
      cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.cpf?.includes(searchTerm);
    
    const matchesTipo = !filterTipo || cliente.tipo === filterTipo;
    
    return matchesSearch && matchesTipo;
  }), [clientes, searchTerm, filterTipo]);

  const formatPhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length === 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }
    return phone;
  };

  const totalProprietarios = useMemo(() => clientes.filter(c => c.tipo === 'proprietario').length, [clientes]);
  const totalCompradores = useMemo(() => clientes.filter(c => c.tipo === 'comprador').length, [clientes]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      {/* Desktop Navigation */}
      <DesktopNav />
      
      {/* Mobile Header */}
      <MobileHeader
        title="CRM de Clientes"
        subtitle={`${clientes.length} de ${totalCount} clientes`}
        showAdd
        onAdd={() => navigate('/clientes/novo')}
        addLabel="Novo Cliente"
      />

      <main className="container mx-auto px-4 py-4 md:py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
          <Card 
            className={`cursor-pointer transition-all ${filterTipo === 'proprietario' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setFilterTipo(filterTipo === 'proprietario' ? null : 'proprietario')}
          >
            <CardContent className="p-3 md:p-4 flex items-center gap-3">
              <div className="h-9 w-9 md:h-10 md:w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xl md:text-2xl font-bold">{totalProprietarios}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Proprietários</p>
              </div>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all ${filterTipo === 'comprador' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setFilterTipo(filterTipo === 'comprador' ? null : 'comprador')}
          >
            <CardContent className="p-3 md:p-4 flex items-center gap-3">
              <div className="h-9 w-9 md:h-10 md:w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <User className="h-4 w-4 md:h-5 md:w-5 text-secondary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xl md:text-2xl font-bold">{totalCompradores}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Compradores</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-4 md:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, telefone, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          {filterTipo && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs md:text-sm text-muted-foreground">Filtrando:</span>
              <Badge variant="secondary" className="cursor-pointer text-xs" onClick={() => setFilterTipo(null)}>
                {filterTipo === 'proprietario' ? 'Proprietários' : 'Compradores'} ✕
              </Badge>
            </div>
          )}
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredClientes && filteredClientes.length > 0 ? (
          <div className="space-y-3">
            {filteredClientes.map((cliente) => (
              <Card 
                key={cliente.id} 
                className="cursor-pointer hover:shadow-medium transition-shadow"
                onClick={() => navigate(`/clientes/${cliente.id}`)}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center shrink-0 ${
                        cliente.tipo === 'proprietario' ? 'bg-primary/10' : 'bg-secondary'
                      }`}>
                        {cliente.tipo === 'proprietario' ? (
                          <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                        ) : (
                          <User className="h-5 w-5 sm:h-6 sm:w-6 text-secondary-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="font-medium text-sm sm:text-base truncate">{cliente.nome}</p>
                        <Badge variant={cliente.tipo === 'proprietario' ? 'default' : 'secondary'} className="text-xs mt-1">
                          {cliente.tipo === 'proprietario' ? 'Proprietário' : 'Comprador'}
                        </Badge>
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground mt-1.5">
                          <Phone className="h-3 w-3 shrink-0" />
                          <span className="truncate">{formatPhone(cliente.telefone)}</span>
                        </div>
                        {cliente.email && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{cliente.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/clientes/${cliente.id}/editar`);
                        }}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(cliente.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Infinite Scroll Trigger */}
            <InfiniteScrollTrigger
              onLoadMore={fetchNextPage}
              hasMore={!!hasNextPage}
              isLoading={isFetchingNextPage}
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">Nenhum cliente encontrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm || filterTipo ? 'Tente outro termo de busca' : 'Cadastre seu primeiro cliente'}
            </p>
            {!searchTerm && !filterTipo && (
              <Button onClick={() => navigate('/clientes/novo')} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Cliente
              </Button>
            )}
          </div>
        )}
      </main>


      {/* Mobile Navigation */}
      <MobileNav />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O cliente será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) {
                  deleteMutation.mutate(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
