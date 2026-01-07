import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Building2,
  Search,
  Loader2,
  MapPin,
  MoreVertical,
  Pencil,
  Trash2,
  User
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
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { DesktopNav } from '@/components/DesktopNav';

type Imovel = {
  id: string;
  endereco: string;
  tipo: string;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  notas: string | null;
  proprietario_id: string | null;
  created_at: string;
};

type Cliente = {
  id: string;
  nome: string;
};

export default function ListaImoveis() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const { data: imoveis, isLoading } = useQuery({
    queryKey: ['imoveis', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('imoveis')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Imovel[];
    },
    enabled: !!user,
  });

  const { data: clientes } = useQuery({
    queryKey: ['clientes-map', user?.id],
    queryFn: async () => {
      if (!user) return {};
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome')
        .eq('user_id', user.id);
      
      if (error) throw error;
      const map: Record<string, string> = {};
      data?.forEach((c: Cliente) => {
        map[c.id] = c.nome;
      });
      return map;
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('imoveis')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imoveis'] });
      toast({
        title: 'Imóvel excluído',
        description: 'O imóvel foi removido com sucesso.',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível excluir o imóvel.',
      });
    },
  });

  const filteredImoveis = imoveis?.filter(imovel => {
    const term = searchTerm.toLowerCase();
    return (
      imovel.endereco.toLowerCase().includes(term) ||
      imovel.tipo.toLowerCase().includes(term) ||
      imovel.bairro?.toLowerCase().includes(term) ||
      imovel.cidade?.toLowerCase().includes(term)
    );
  });

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
        title="Imóveis"
        subtitle={`${imoveis?.length || 0} imóveis cadastrados`}
        showAdd
        onAdd={() => navigate('/imoveis/novo')}
        addLabel="Novo Imóvel"
      />

      <main className="container mx-auto px-4 py-4 md:py-6">
        {/* Search */}
        <div className="mb-4 md:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por endereço, tipo, bairro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredImoveis && filteredImoveis.length > 0 ? (
          <div className="space-y-3">
            {filteredImoveis.map((imovel) => (
              <Card 
                key={imovel.id} 
                className="cursor-pointer hover:shadow-medium transition-shadow"
                onClick={() => navigate(`/imoveis/${imovel.id}`)}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="font-medium text-sm sm:text-base truncate">{imovel.endereco}</p>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {imovel.tipo}
                        </Badge>
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground mt-1.5">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {[imovel.bairro, imovel.cidade, imovel.estado].filter(Boolean).join(', ') || 'Sem localização'}
                          </span>
                        </div>
                        {imovel.proprietario_id && clientes?.[imovel.proprietario_id] && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                            <User className="h-3 w-3 shrink-0" />
                            <span className="truncate">{clientes[imovel.proprietario_id]}</span>
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
                          navigate(`/imoveis/${imovel.id}/editar`);
                        }}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(imovel.id);
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
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">Nenhum imóvel encontrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm ? 'Tente outro termo de busca' : 'Cadastre seu primeiro imóvel'}
            </p>
            {!searchTerm && (
              <Button onClick={() => navigate('/imoveis/novo')} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Imóvel
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Floating Action Button for mobile */}
      <FloatingActionButton 
        onClick={() => navigate('/imoveis/novo')} 
        label="Novo Imóvel"
      />

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir imóvel?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O imóvel será removido permanentemente.
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
