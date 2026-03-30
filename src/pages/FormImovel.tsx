import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MobileHeader } from '@/components/MobileHeader';
import { MobileNav } from '@/components/MobileNav';
import { DesktopNav } from '@/components/DesktopNav';
import { CepInput } from '@/components/CepInput';

const tiposImovel = [
  'Apartamento',
  'Casa',
  'Sobrado',
  'Terreno',
  'Comercial',
  'Sala Comercial',
  'Galpão',
  'Chácara',
  'Fazenda',
  'Outro',
];

export default function FormImovel() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    endereco: '',
    tipo: '',
    bairro: '',
    cidade: '',
    estado: '',
    notas: '',
    proprietario_id: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Buscar imóvel existente para edição
  const { data: imovel, isLoading: loadingImovel } = useQuery({
    queryKey: ['imovel', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('imoveis')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  // Buscar clientes para o select de proprietário
  const { data: clientes } = useQuery({
    queryKey: ['clientes-proprietarios', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome')
        .eq('user_id', user.id)
        .eq('tipo', 'proprietario')
        .order('nome');
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Preencher form quando carregar imóvel
  useEffect(() => {
    if (imovel) {
      setFormData({
        endereco: imovel.endereco || '',
        tipo: imovel.tipo || '',
        bairro: imovel.bairro || '',
        cidade: imovel.cidade || '',
        estado: imovel.estado || '',
        notas: imovel.notas || '',
        proprietario_id: imovel.proprietario_id || '',
      });
    }
  }, [imovel]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user) throw new Error('Usuário não autenticado');

      const imovelData = {
        ...data,
        user_id: user.id,
        proprietario_id: data.proprietario_id && data.proprietario_id !== 'none' ? data.proprietario_id : null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('imoveis')
          .update(imovelData)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('imoveis')
          .insert(imovelData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imoveis'] });
      toast({
        title: isEditing ? 'Imóvel atualizado' : 'Imóvel cadastrado',
        description: isEditing 
          ? 'As alterações foram salvas com sucesso.'
          : 'O imóvel foi cadastrado com sucesso.',
      });
      navigate('/imoveis');
    },
    onError: (error: Error) => {
      console.error('Erro ao salvar imóvel:', error);
      
      // Verificar se é erro de limite atingido
      if (error?.message?.includes('Limite de') && error?.message?.includes('imóveis atingido')) {
        toast({
          variant: 'destructive',
          title: 'Limite do plano atingido',
          description: 'Você atingiu o limite de imóveis. Faça upgrade do seu plano para continuar.',
        });
        navigate('/empresa/assinatura');
        return;
      }
      
      // Verificar se é erro de assinatura inativa
      if (error?.message?.includes('Assinatura inativa')) {
        toast({
          variant: 'destructive',
          title: 'Assinatura inativa',
          description: 'Você precisa de uma assinatura ativa para cadastrar imóveis.',
        });
        navigate('/empresa/assinatura');
        return;
      }

      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível salvar o imóvel.',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.endereco || !formData.tipo) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Preencha o endereço e o tipo do imóvel.',
      });
      return;
    }

    saveMutation.mutate(formData);
  };

  if (authLoading || (isEditing && loadingImovel)) {
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
        title={isEditing ? 'Editar Imóvel' : 'Novo Imóvel'}
        subtitle={isEditing ? 'Atualize os dados do imóvel' : 'Cadastre um novo imóvel'}
        backPath="/imoveis"
      />

      <main className="container mx-auto px-4 py-4 md:py-6 max-w-2xl">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Dados do Imóvel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CepInput
                onAddressFound={(endereco, details) => {
                  setFormData(prev => ({
                    ...prev,
                    endereco,
                    bairro: details?.bairro || prev.bairro,
                    cidade: details?.cidade || prev.cidade,
                    estado: details?.uf || prev.estado,
                  }));
                }}
              />
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço *</Label>
                <Input
                  id="endereco"
                  placeholder="Rua, número, complemento"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposImovel.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    placeholder="Bairro"
                    value={formData.bairro}
                    onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    placeholder="Cidade"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  placeholder="Ex: SP, RJ, MG"
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  maxLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proprietario">Proprietário</Label>
                <Select
                  value={formData.proprietario_id}
                  onValueChange={(value) => setFormData({ ...formData, proprietario_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o proprietário (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {clientes?.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notas">Observações</Label>
                <Textarea
                  id="notas"
                  placeholder="Notas adicionais sobre o imóvel..."
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows={3}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full gap-2"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isEditing ? 'Salvar Alterações' : 'Cadastrar Imóvel'}
              </Button>
            </CardContent>
          </Card>
        </form>
      </main>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
