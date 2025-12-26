import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Building2, User, Users, Calendar, FileText, Loader2, MessageCircle, AlertTriangle } from 'lucide-react';
import { z } from 'zod';
import { validateCPF, formatCPF } from '@/lib/cpf';
import { MobileHeader } from '@/components/MobileHeader';
import { MobileNav } from '@/components/MobileNav';

const fichaSchema = z.object({
  imovel_endereco: z.string().min(5, 'Endereço deve ter no mínimo 5 caracteres'),
  imovel_tipo: z.string().min(1, 'Selecione o tipo do imóvel'),
  proprietario_autopreenchimento: z.boolean().default(false),
  proprietario_nome: z.string().optional(),
  proprietario_cpf: z.string().optional(),
  proprietario_telefone: z.string().min(10, 'Telefone do proprietário é obrigatório'),
  comprador_autopreenchimento: z.boolean().default(false),
  comprador_nome: z.string().optional(),
  comprador_cpf: z.string().optional(),
  comprador_telefone: z.string().min(10, 'Telefone do comprador é obrigatório'),
  data_visita: z.string().min(1, 'Data da visita é obrigatória'),
  observacoes: z.string().optional(),
}).refine((data) => {
  if (!data.proprietario_autopreenchimento && (!data.proprietario_nome || data.proprietario_nome.length < 2)) {
    return false;
  }
  return true;
}, { message: 'Nome do proprietário é obrigatório', path: ['proprietario_nome'] })
.refine((data) => {
  if (!data.comprador_autopreenchimento && (!data.comprador_nome || data.comprador_nome.length < 2)) {
    return false;
  }
  return true;
}, { message: 'Nome do comprador é obrigatório', path: ['comprador_nome'] });

type FichaFormData = {
  imovel_endereco: string;
  imovel_tipo: string;
  proprietario_autopreenchimento: boolean;
  proprietario_nome: string;
  proprietario_cpf: string;
  proprietario_telefone: string;
  comprador_autopreenchimento: boolean;
  comprador_nome: string;
  comprador_cpf: string;
  comprador_telefone: string;
  data_visita: string;
  observacoes: string;
};

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
  const { imobiliariaId, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enviarWhatsApp, setEnviarWhatsApp] = useState(true);
  
  const [formData, setFormData] = useState<FichaFormData>({
    imovel_endereco: '',
    imovel_tipo: '',
    proprietario_autopreenchimento: false,
    proprietario_nome: '',
    proprietario_cpf: '',
    proprietario_telefone: '',
    comprador_autopreenchimento: false,
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

  const handlePhoneChange = (field: 'proprietario_telefone' | 'comprador_telefone', value: string) => {
    setFormData({ ...formData, [field]: formatPhone(value) });
  };

  const handleCPFChange = (field: 'proprietario_cpf' | 'comprador_cpf', value: string) => {
    setFormData({ ...formData, [field]: formatCPF(value) });
  };

  // CPF validation state
  const proprietarioCpfValid = !formData.proprietario_cpf || validateCPF(formData.proprietario_cpf);
  const compradorCpfValid = !formData.comprador_cpf || validateCPF(formData.comprador_cpf);

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

    if (!imobiliariaId) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Você não está vinculado a nenhuma imobiliária',
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
          imobiliaria_id: imobiliariaId,
          protocolo,
          imovel_endereco: formData.imovel_endereco,
          imovel_tipo: formData.imovel_tipo,
          proprietario_autopreenchimento: formData.proprietario_autopreenchimento,
          proprietario_nome: formData.proprietario_autopreenchimento ? null : formData.proprietario_nome,
          proprietario_cpf: formData.proprietario_cpf || null,
          proprietario_telefone: formData.proprietario_telefone.replace(/\D/g, ''),
          comprador_autopreenchimento: formData.comprador_autopreenchimento,
          comprador_nome: formData.comprador_autopreenchimento ? null : formData.comprador_nome,
          comprador_cpf: formData.comprador_cpf || null,
          comprador_telefone: formData.comprador_telefone.replace(/\D/g, ''),
          data_visita: formData.data_visita,
          observacoes: formData.observacoes || null,
          status: 'pendente',
        })
        .select()
        .single();

      if (error) throw error;

      // Send WhatsApp OTP to both parties if enabled
      if (enviarWhatsApp) {
        const sendOtpPromises = [];
        
        // Get current app URL for the verification link
        const currentAppUrl = window.location.origin;

        // Send to owner
        sendOtpPromises.push(
          supabase.functions.invoke('send-otp', {
            body: { ficha_id: data.id, tipo: 'proprietario', app_url: currentAppUrl }
          }).then(({ data: otpData, error: otpError }) => {
            if (otpError) {
              console.error('Error sending OTP to owner:', otpError);
              return { tipo: 'proprietario', success: false, error: otpError };
            }
            return { tipo: 'proprietario', success: true, ...otpData };
          })
        );
        
        // Send to buyer
        sendOtpPromises.push(
          supabase.functions.invoke('send-otp', {
            body: { ficha_id: data.id, tipo: 'comprador', app_url: currentAppUrl }
          }).then(({ data: otpData, error: otpError }) => {
            if (otpError) {
              console.error('Error sending OTP to buyer:', otpError);
              return { tipo: 'comprador', success: false, error: otpError };
            }
            return { tipo: 'comprador', success: true, ...otpData };
          })
        );

        const otpResults = await Promise.all(sendOtpPromises);
        
        const successCount = otpResults.filter(r => r.success).length;
        const simulationMode = otpResults.some(r => r.simulation);

        if (successCount === 2) {
          toast({
            title: 'Ficha criada com sucesso!',
            description: simulationMode 
              ? `Protocolo: ${protocolo}. OTPs gerados em modo simulação.`
              : `Protocolo: ${protocolo}. WhatsApp enviado ao proprietário e comprador.`,
          });
        } else if (successCount === 1) {
          toast({
            title: 'Ficha criada com aviso',
            description: `Protocolo: ${protocolo}. Apenas um WhatsApp foi enviado.`,
            variant: 'default',
          });
        } else {
          toast({
            title: 'Ficha criada',
            description: `Protocolo: ${protocolo}. Envio de WhatsApp falhou, envie manualmente.`,
            variant: 'default',
          });
        }
      } else {
        toast({
          title: 'Ficha criada com sucesso!',
          description: `Protocolo: ${protocolo}`,
        });
      }

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

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <MobileHeader
        title="Nova Ficha de Visita"
        subtitle="Preencha os dados da visita"
        backPath="/fichas"
      />

      <main className="container mx-auto px-4 py-4 md:py-8 max-w-3xl">
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
              {/* Toggle de autopreenchimento */}
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                <Checkbox 
                  id="proprietario_autopreenchimento"
                  checked={formData.proprietario_autopreenchimento}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    proprietario_autopreenchimento: checked === true,
                    proprietario_nome: checked ? '' : formData.proprietario_nome,
                    proprietario_cpf: checked ? '' : formData.proprietario_cpf
                  })}
                />
                <label htmlFor="proprietario_autopreenchimento" className="text-sm cursor-pointer">
                  <span className="font-medium">Deixar o proprietário preencher</span>
                  <p className="text-xs text-muted-foreground">O proprietário preencherá nome e CPF ao confirmar a visita</p>
                </label>
              </div>

              {!formData.proprietario_autopreenchimento && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="proprietario_nome">Nome completo *</Label>
                    <Input
                      id="proprietario_nome"
                      placeholder="Nome do proprietário"
                      value={formData.proprietario_nome}
                      onChange={(e) => setFormData({ ...formData, proprietario_nome: e.target.value })}
                      required={!formData.proprietario_autopreenchimento}
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
                      className={!proprietarioCpfValid ? 'border-destructive' : ''}
                    />
                    {!proprietarioCpfValid && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        CPF inválido. Verifique os dígitos.
                      </p>
                    )}
                  </div>
                </div>
              )}
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
              {/* Toggle de autopreenchimento */}
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                <Checkbox 
                  id="comprador_autopreenchimento"
                  checked={formData.comprador_autopreenchimento}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    comprador_autopreenchimento: checked === true,
                    comprador_nome: checked ? '' : formData.comprador_nome,
                    comprador_cpf: checked ? '' : formData.comprador_cpf
                  })}
                />
                <label htmlFor="comprador_autopreenchimento" className="text-sm cursor-pointer">
                  <span className="font-medium">Deixar o comprador preencher</span>
                  <p className="text-xs text-muted-foreground">O comprador preencherá nome e CPF ao confirmar a visita</p>
                </label>
              </div>

              {!formData.comprador_autopreenchimento && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="comprador_nome">Nome completo *</Label>
                    <Input
                      id="comprador_nome"
                      placeholder="Nome do comprador"
                      value={formData.comprador_nome}
                      onChange={(e) => setFormData({ ...formData, comprador_nome: e.target.value })}
                      required={!formData.comprador_autopreenchimento}
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
                      className={!compradorCpfValid ? 'border-destructive' : ''}
                    />
                    {!compradorCpfValid && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        CPF inválido. Verifique os dígitos.
                      </p>
                    )}
                  </div>
                </div>
              )}
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

          {/* WhatsApp Option */}
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Checkbox 
                  id="enviarWhatsApp" 
                  checked={enviarWhatsApp}
                  onCheckedChange={(checked) => setEnviarWhatsApp(checked === true)}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="enviarWhatsApp"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4 text-green-500" />
                    Enviar WhatsApp automaticamente
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Ao criar a ficha, enviar código de confirmação via WhatsApp para o proprietário e o comprador.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões - sticky on mobile */}
          <div className="sticky bottom-20 md:static bg-background pt-4 pb-2 md:py-0 -mx-4 px-4 md:mx-0 border-t md:border-0">
            <div className="flex gap-3 md:gap-4 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/fichas')}
                className="flex-1 md:flex-none h-12 md:h-10"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="gap-2 flex-1 md:flex-none h-12 md:h-10"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">{enviarWhatsApp ? 'Criando e enviando...' : 'Criando...'}</span>
                    <span className="sm:hidden">Criando...</span>
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Criar Ficha
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </main>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
