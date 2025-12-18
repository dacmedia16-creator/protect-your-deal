import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Building2, User, Users, Calendar, FileText, Loader2 } from 'lucide-react';
import { z } from 'zod';

const fichaSchema = z.object({
  imovel_endereco: z.string().min(5, 'Endereço deve ter no mínimo 5 caracteres'),
  imovel_tipo: z.string().min(1, 'Selecione o tipo do imóvel'),
  proprietario_nome: z.string().min(2, 'Nome do proprietário é obrigatório'),
  proprietario_cpf: z.string().optional(),
  proprietario_telefone: z.string().min(10, 'Telefone do proprietário é obrigatório'),
  comprador_nome: z.string().min(2, 'Nome do comprador é obrigatório'),
  comprador_cpf: z.string().optional(),
  comprador_telefone: z.string().min(10, 'Telefone do comprador é obrigatório'),
  data_visita: z.string().min(1, 'Data da visita é obrigatória'),
  observacoes: z.string().optional(),
});

type FichaFormData = z.infer<typeof fichaSchema>;

const tiposImovel = [
  'Apartamento',
  'Casa',
  'Sobrado',
  'Terreno',
  'Sala Comercial',
  'Galpão',
  'Fazenda',
  'Chácara',
  'Cobertura',
  'Kitnet',
  'Outro',
];

export default function NovaFicha() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<FichaFormData>({
    imovel_endereco: '',
    imovel_tipo: '',
    proprietario_nome: '',
    proprietario_cpf: '',
    proprietario_telefone: '',
    comprador_nome: '',
    comprador_cpf: '',
    comprador_telefone: '',
    data_visita: new Date().toISOString().slice(0, 16),
    observacoes: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

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

  const handlePhoneChange = (field: 'proprietario_telefone' | 'comprador_telefone', value: string) => {
    setFormData({ ...formData, [field]: formatPhone(value) });
  };

  const handleCPFChange = (field: 'proprietario_cpf' | 'comprador_cpf', value: string) => {
    setFormData({ ...formData, [field]: formatCPF(value) });
  };

  const generateProtocolo = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('generate_protocolo');
    if (error) {
      // Fallback: gerar localmente
      const prefix = 'VS';
      const year = new Date().getFullYear().toString().slice(-2);
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      return `${prefix}${year}${random}`;
    }
    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = fichaSchema.safeParse(formData);
    if (!result.success) {
      toast({
        variant: 'destructive',
        title: 'Erro de validação',
        description: result.error.errors[0].message,
      });
      return;
    }

    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Você precisa estar logado',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const protocolo = await generateProtocolo();
      
      const { data, error } = await supabase
        .from('fichas_visita')
        .insert({
          user_id: user.id,
          protocolo,
          imovel_endereco: formData.imovel_endereco,
          imovel_tipo: formData.imovel_tipo,
          proprietario_nome: formData.proprietario_nome,
          proprietario_cpf: formData.proprietario_cpf || null,
          proprietario_telefone: formData.proprietario_telefone.replace(/\D/g, ''),
          comprador_nome: formData.comprador_nome,
          comprador_cpf: formData.comprador_cpf || null,
          comprador_telefone: formData.comprador_telefone.replace(/\D/g, ''),
          data_visita: formData.data_visita,
          observacoes: formData.observacoes || null,
          status: 'pendente',
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Ficha criada com sucesso!',
        description: `Protocolo: ${protocolo}`,
      });

      navigate(`/fichas/${data.id}`);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar ficha',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
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
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-display text-xl font-bold">Nova Ficha de Visita</h1>
              <p className="text-sm text-muted-foreground">Preencha os dados da visita</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados do Imóvel */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Dados do Imóvel</CardTitle>
                  <CardDescription>Informações sobre o imóvel visitado</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="imovel_endereco">Endereço completo *</Label>
                <Input
                  id="imovel_endereco"
                  placeholder="Rua, número, bairro, cidade"
                  value={formData.imovel_endereco}
                  onChange={(e) => setFormData({ ...formData, imovel_endereco: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imovel_tipo">Tipo do imóvel *</Label>
                <Select
                  value={formData.imovel_tipo}
                  onValueChange={(value) => setFormData({ ...formData, imovel_tipo: value })}
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
            </CardContent>
          </Card>

          {/* Dados do Proprietário */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                  <User className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Dados do Proprietário</CardTitle>
                  <CardDescription>Informações do dono do imóvel</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="proprietario_nome">Nome completo *</Label>
                  <Input
                    id="proprietario_nome"
                    placeholder="Nome do proprietário"
                    value={formData.proprietario_nome}
                    onChange={(e) => setFormData({ ...formData, proprietario_nome: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proprietario_cpf">CPF</Label>
                  <Input
                    id="proprietario_cpf"
                    placeholder="000.000.000-00"
                    value={formData.proprietario_cpf}
                    onChange={(e) => handleCPFChange('proprietario_cpf', e.target.value)}
                    maxLength={14}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="proprietario_telefone">Telefone (WhatsApp) *</Label>
                <Input
                  id="proprietario_telefone"
                  placeholder="(00) 00000-0000"
                  value={formData.proprietario_telefone}
                  onChange={(e) => handlePhoneChange('proprietario_telefone', e.target.value)}
                  maxLength={15}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Dados do Comprador */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Users className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Dados do Comprador/Visitante</CardTitle>
                  <CardDescription>Informações do interessado no imóvel</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="comprador_nome">Nome completo *</Label>
                  <Input
                    id="comprador_nome"
                    placeholder="Nome do comprador"
                    value={formData.comprador_nome}
                    onChange={(e) => setFormData({ ...formData, comprador_nome: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comprador_cpf">CPF</Label>
                  <Input
                    id="comprador_cpf"
                    placeholder="000.000.000-00"
                    value={formData.comprador_cpf}
                    onChange={(e) => handleCPFChange('comprador_cpf', e.target.value)}
                    maxLength={14}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="comprador_telefone">Telefone (WhatsApp) *</Label>
                <Input
                  id="comprador_telefone"
                  placeholder="(00) 00000-0000"
                  value={formData.comprador_telefone}
                  onChange={(e) => handlePhoneChange('comprador_telefone', e.target.value)}
                  maxLength={15}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Data e Observações */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Data e Observações</CardTitle>
                  <CardDescription>Quando a visita aconteceu ou acontecerá</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="data_visita">Data e hora da visita *</Label>
                <Input
                  id="data_visita"
                  type="datetime-local"
                  value={formData.data_visita}
                  onChange={(e) => setFormData({ ...formData, data_visita: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Anotações adicionais sobre a visita..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Criar Ficha
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
