import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, User, Building2, Loader2, Save } from 'lucide-react';
import { z } from 'zod';

const clienteSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  cpf: z.string().optional(),
  telefone: z.string().min(10, 'Telefone é obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  tipo: z.enum(['comprador', 'proprietario']),
  notas: z.string().optional(),
});

type ClienteFormData = z.infer<typeof clienteSchema>;

export default function FormCliente() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { imobiliariaId } = useUserRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<ClienteFormData>({
    nome: '',
    cpf: '',
    telefone: '',
    email: '',
    tipo: 'comprador',
    notas: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Load existing client data if editing
  const { data: cliente, isLoading: isLoadingCliente } = useQuery({
    queryKey: ['cliente', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && isEditing,
  });

  useEffect(() => {
    if (cliente) {
      setFormData({
        nome: cliente.nome,
        cpf: cliente.cpf || '',
        telefone: cliente.telefone,
        email: cliente.email || '',
        tipo: cliente.tipo as 'comprador' | 'proprietario',
        notas: cliente.notas || '',
      });
    }
  }, [cliente]);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const saveMutation = useMutation({
    mutationFn: async (data: ClienteFormData) => {
      if (!user) throw new Error('Usuário não autenticado');

      const payload = {
        user_id: user.id,
        imobiliaria_id: imobiliariaId,
        nome: data.nome,
        cpf: data.cpf || null,
        telefone: data.telefone.replace(/\D/g, ''),
        email: data.email || null,
        tipo: data.tipo,
        notas: data.notas || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('clientes')
          .update(payload)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('clientes')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      toast({
        title: isEditing ? 'Cliente atualizado!' : 'Cliente cadastrado!',
        description: isEditing ? 'As alterações foram salvas.' : 'O novo cliente foi adicionado.',
      });
      navigate('/clientes');
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message,
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = clienteSchema.safeParse(formData);
    if (!result.success) {
      toast({
        variant: 'destructive',
        title: 'Erro de validação',
        description: result.error.errors[0].message,
      });
      return;
    }

    saveMutation.mutate(formData);
  };

  if (authLoading || (isEditing && isLoadingCliente)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/clientes')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-display text-xl font-bold">
                {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isEditing ? 'Atualize os dados do cliente' : 'Cadastre um novo cliente'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tipo de Cliente</CardTitle>
              <CardDescription>Selecione o tipo de cliente</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={formData.tipo}
                onValueChange={(value) => setFormData({ ...formData, tipo: value as 'comprador' | 'proprietario' })}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="comprador" id="comprador" className="peer sr-only" />
                  <Label
                    htmlFor="comprador"
                    className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <User className="mb-3 h-6 w-6" />
                    <span className="font-medium">Comprador</span>
                    <span className="text-xs text-muted-foreground">Interessado em comprar</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="proprietario" id="proprietario" className="peer sr-only" />
                  <Label
                    htmlFor="proprietario"
                    className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Building2 className="mb-3 h-6 w-6" />
                    <span className="font-medium">Proprietário</span>
                    <span className="text-xs text-muted-foreground">Dono de imóvel</span>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Dados Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados Pessoais</CardTitle>
              <CardDescription>Informações de contato do cliente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo *</Label>
                <Input
                  id="nome"
                  placeholder="Nome do cliente"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                    maxLength={14}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone (WhatsApp) *</Label>
                  <Input
                    id="telefone"
                    placeholder="(00) 00000-0000"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                    maxLength={15}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Observações</CardTitle>
              <CardDescription>Anotações sobre o cliente</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Preferências, interesse em determinados imóveis, etc..."
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={() => navigate('/clientes')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveMutation.isPending} className="gap-2">
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEditing ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
