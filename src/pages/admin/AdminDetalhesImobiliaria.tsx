import { useState, useEffect, useRef } from 'react';
import { subscriptionStatusColors, getStatusColor, fichaStatusColors } from '@/lib/statusColors';
import { isFichaConfirmada } from '@/lib/fichaStatus';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatCNPJ } from '@/lib/cnpj';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Building2, Users, CreditCard, Save, MoreVertical, KeyRound, UserCircle, Home, FileText, Phone, Mail, Upload, Trash2, ImageIcon, Settings2, ClipboardList } from 'lucide-react';
import { formatPhone } from '@/lib/phone';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const estadosBrasileiros = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const formSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cnpj: z.string().optional(),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  status: z.string(),
});

type FormData = z.infer<typeof formSchema>;

interface Plano {
  id: string;
  nome: string;
  valor_mensal: number;
  max_corretores: number;
  max_fichas_mes: number;
}

interface Assinatura {
  id: string;
  status: string;
  data_inicio: string;
  data_fim: string | null;
  proxima_cobranca: string | null;
  plano_id: string;
  plano?: Plano;
}

interface Corretor {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile?: {
    nome: string;
    email?: string;
  };
}

interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  tipo: string;
  created_at: string;
}

interface Imovel {
  id: string;
  endereco: string;
  tipo: string;
  bairro: string | null;
  cidade: string | null;
  created_at: string;
}

interface Ficha {
  id: string;
  protocolo: string;
  comprador_nome: string | null;
  proprietario_nome: string | null;
  imovel_endereco: string;
  status: string;
  data_visita: string;
  created_at: string;
}

export default function AdminDetalhesImobiliaria() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null);
  const [corretores, setCorretores] = useState<Corretor[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [selectedPlano, setSelectedPlano] = useState<string>('');
  const [savingPlano, setSavingPlano] = useState(false);

  // Logo state
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password reset dialog state
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; nome: string } | null>(null);
  const [resetAction, setResetAction] = useState<'set_password' | 'send_reset_email'>('set_password');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Feature flags state
  const [surveyFeatureEnabled, setSurveyFeatureEnabled] = useState(false);
  const [loadingFeatures, setLoadingFeatures] = useState(false);
  const [savingFeatures, setSavingFeatures] = useState(false);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      cnpj: '',
      email: '',
      telefone: '',
      endereco: '',
      cidade: '',
      estado: '',
      status: 'ativo',
    },
  });

  useEffect(() => {
    async function fetchData() {
      if (!id) return;

      try {
        // Fetch imobiliaria
        const { data: imobiliaria, error: imobError } = await supabase
          .from('imobiliarias')
          .select('*, codigo')
          .eq('id', id)
          .maybeSingle();

        if (imobError) throw imobError;
        if (!imobiliaria) {
          toast.error('Imobiliária não encontrada');
          navigate('/admin/imobiliarias');
          return;
        }

        form.reset({
          nome: imobiliaria.nome,
          cnpj: imobiliaria.cnpj || '',
          email: imobiliaria.email,
          telefone: imobiliaria.telefone || '',
          endereco: imobiliaria.endereco || '',
          cidade: imobiliaria.cidade || '',
          estado: imobiliaria.estado || '',
          status: imobiliaria.status,
          // @ts-ignore - codigo vem da query
          codigo: imobiliaria.codigo,
        });

        // Set logo URL
        setLogoUrl(imobiliaria.logo_url);

        // Fetch planos
        const { data: planosData } = await supabase
          .from('planos')
          .select('*')
          .eq('ativo', true)
          .order('valor_mensal', { ascending: true });

        setPlanos(planosData || []);

        // Fetch assinatura
        const { data: assinaturaData } = await supabase
          .from('assinaturas')
          .select('*')
          .eq('imobiliaria_id', id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (assinaturaData) {
          // Fetch plano details
          const { data: planoData } = await supabase
            .from('planos')
            .select('*')
            .eq('id', assinaturaData.plano_id)
            .maybeSingle();

          setAssinatura({
            ...assinaturaData,
            plano: planoData || undefined,
          });
          setSelectedPlano(assinaturaData.plano_id);
        }

        // Fetch corretores (user_roles)
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('*')
          .eq('imobiliaria_id', id);

        if (rolesData) {
          // Fetch profiles for each user
          const userIds = rolesData.map(r => r.user_id);
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, nome')
            .in('user_id', userIds);

          const corretoresWithProfiles = rolesData.map(role => ({
            ...role,
            profile: profilesData?.find(p => p.user_id === role.user_id),
          }));

          setCorretores(corretoresWithProfiles);
        }

        // Fetch clientes
        const { data: clientesData } = await supabase
          .from('clientes')
          .select('id, nome, telefone, email, tipo, created_at')
          .eq('imobiliaria_id', id)
          .order('created_at', { ascending: false });

        setClientes(clientesData || []);

        // Fetch imóveis
        const { data: imoveisData } = await supabase
          .from('imoveis')
          .select('id, endereco, tipo, bairro, cidade, created_at')
          .eq('imobiliaria_id', id)
          .order('created_at', { ascending: false });

        setImoveis(imoveisData || []);

        // Fetch fichas
        const { data: fichasData } = await supabase
          .from('fichas_visita')
          .select('id, protocolo, comprador_nome, proprietario_nome, imovel_endereco, status, data_visita, created_at')
          .eq('imobiliaria_id', id)
          .order('created_at', { ascending: false });

        setFichas(fichasData || []);

        // Fetch feature flags
        const { data: featureFlagsData } = await supabase
          .from('imobiliaria_feature_flags')
          .select('feature_key, enabled')
          .eq('imobiliaria_id', id);
        
        if (featureFlagsData) {
          const surveyFlag = featureFlagsData.find(f => f.feature_key === 'post_visit_survey');
          setSurveyFeatureEnabled(surveyFlag?.enabled ?? false);
        }
      } catch (error: any) {
        console.error('Error fetching data:', error);
        toast.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id, navigate, form]);

  const onSubmit = async (data: FormData) => {
    if (!id) return;
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('imobiliarias')
        .update({
          nome: data.nome,
          cnpj: data.cnpj || null,
          email: data.email,
          telefone: data.telefone || null,
          endereco: data.endereco || null,
          cidade: data.cidade || null,
          estado: data.estado || null,
          status: data.status,
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Imobiliária atualizada com sucesso!');
    } catch (error: any) {
      console.error('Error updating imobiliaria:', error);
      toast.error(error.message || 'Erro ao atualizar imobiliária');
    } finally {
      setSaving(false);
    }
  };

  const handleAtribuirPlano = async () => {
    if (!id || !selectedPlano) return;
    setSavingPlano(true);

    try {
      if (assinatura) {
        // Update existing subscription
        const { error } = await supabase
          .from('assinaturas')
          .update({
            plano_id: selectedPlano,
            status: 'ativa',
          })
          .eq('id', assinatura.id);

        if (error) throw error;
      } else {
        // Create new subscription
        const { error } = await supabase
          .from('assinaturas')
          .insert({
            imobiliaria_id: id,
            plano_id: selectedPlano,
            status: 'ativa',
            data_inicio: new Date().toISOString().split('T')[0],
          });

        if (error) throw error;
      }

      toast.success('Plano atribuído com sucesso!');
      
      // Refresh assinatura data
      const { data: newAssinatura } = await supabase
        .from('assinaturas')
        .select('*')
        .eq('imobiliaria_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (newAssinatura) {
        const { data: planoData } = await supabase
          .from('planos')
          .select('*')
          .eq('id', newAssinatura.plano_id)
          .maybeSingle();

        setAssinatura({
          ...newAssinatura,
          plano: planoData || undefined,
        });
      }
    } catch (error: any) {
      console.error('Error assigning plan:', error);
      toast.error(error.message || 'Erro ao atribuir plano');
    } finally {
      setSavingPlano(false);
    }
  };

  const openResetDialog = (corretor: Corretor) => {
    setSelectedUser({ id: corretor.user_id, nome: corretor.profile?.nome || 'Usuário' });
    setResetAction('set_password');
    setNewPassword('');
    setConfirmPassword('');
    setResetDialogOpen(true);
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;

    if (resetAction === 'set_password') {
      if (!newPassword) {
        toast.error('Digite a nova senha');
        return;
      }
      if (newPassword.length < 6) {
        toast.error('A senha deve ter pelo menos 6 caracteres');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('As senhas não coincidem');
        return;
      }
    }

    setIsResetting(true);

    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: {
          user_id: selectedUser.id,
          action: resetAction,
          new_password: resetAction === 'set_password' ? newPassword : undefined,
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success(data?.message || 'Senha redefinida com sucesso!');
      setResetDialogOpen(false);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(error.message || 'Erro ao redefinir senha');
    } finally {
      setIsResetting(false);
    }
  };

  // Logo upload helpers
  const extractFilePathFromUrl = (url: string): string | null => {
    try {
      const match = url.match(/logos-imobiliarias\/(.+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB');
      return;
    }

    setUploadingLogo(true);

    try {
      // Remove old logo if exists
      if (logoUrl) {
        const oldPath = extractFilePathFromUrl(logoUrl);
        if (oldPath) {
          await supabase.storage.from('logos-imobiliarias').remove([oldPath]);
        }
      }

      // Upload new logo
      const fileExt = file.name.split('.').pop();
      const filePath = `${id}/logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('logos-imobiliarias')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('logos-imobiliarias')
        .getPublicUrl(filePath);

      // Update imobiliaria record
      const { error: updateError } = await supabase
        .from('imobiliarias')
        .update({ logo_url: publicUrl })
        .eq('id', id);

      if (updateError) throw updateError;

      setLogoUrl(publicUrl);
      toast.success('Logo atualizado com sucesso!');
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error('Erro ao fazer upload do logo');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!logoUrl || !id) return;

    setUploadingLogo(true);

    try {
      // Remove from storage
      const filePath = extractFilePathFromUrl(logoUrl);
      if (filePath) {
        await supabase.storage.from('logos-imobiliarias').remove([filePath]);
      }

      // Update imobiliaria record
      const { error } = await supabase
        .from('imobiliarias')
        .update({ logo_url: null })
        .eq('id', id);

      if (error) throw error;

      setLogoUrl(null);
      toast.success('Logo removido com sucesso!');
    } catch (error: any) {
      console.error('Error removing logo:', error);
      toast.error('Erro ao remover logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  // Using subscriptionStatusColors from lib/statusColors

  if (loading) {
    return (<div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>);
  }

  return (<>
    <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-display font-bold">{form.getValues('nome')}</h1>
            <p className="text-muted-foreground">Detalhes da imobiliária</p>
          </div>
          {/* Mostrar código da imobiliária */}
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Código</p>
            <p className="text-2xl font-mono font-bold text-primary">
              {/* @ts-ignore - codigo vem da query */}
              {form.getValues('codigo') || '-'}
            </p>
          </div>
        </div>

        <Tabs defaultValue="dados" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="assinatura">Assinatura</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="corretores">Corretores ({corretores.length})</TabsTrigger>
            <TabsTrigger value="clientes">Clientes ({clientes.length})</TabsTrigger>
            <TabsTrigger value="imoveis">Imóveis ({imoveis.length})</TabsTrigger>
            <TabsTrigger value="fichas">Registros ({fichas.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="space-y-6">
            {/* Logo Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Logo da Empresa</CardTitle>
                    <CardDescription>O logo aparecerá nos comprovantes de visita</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="relative h-24 w-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted/50">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Logo da imobiliária"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Building2 className="h-10 w-10 text-muted-foreground/50" />
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingLogo}
                    >
                      {uploadingLogo ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      {logoUrl ? 'Alterar Logo' : 'Fazer Upload'}
                    </Button>

                    {logoUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveLogo}
                        disabled={uploadingLogo}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover
                      </Button>
                    )}

                    <p className="text-xs text-muted-foreground">
                      PNG, JPG ou WebP. Máximo: 2MB
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dados Card */}
            <Card>
              <CardHeader>
                <CardTitle>Dados da Imobiliária</CardTitle>
                <CardDescription>Edite as informações da imobiliária</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="nome"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Nome *</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome da imobiliária" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="cnpj"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CNPJ</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="00.000.000/0000-00" 
                                {...field}
                                onChange={(e) => field.onChange(formatCNPJ(e.target.value))}
                                maxLength={18}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="email@exemplo.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="telefone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input placeholder="(00) 00000-0000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ativo">Ativo</SelectItem>
                                <SelectItem value="suspenso">Suspenso</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="endereco"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Endereço</FormLabel>
                            <FormControl>
                              <Input placeholder="Rua, número, bairro" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="cidade"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cidade</FormLabel>
                            <FormControl>
                              <Input placeholder="Cidade" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="estado"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {estadosBrasileiros.map((estado) => (
                                  <SelectItem key={estado} value={estado}>
                                    {estado}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button type="submit" disabled={saving}>
                      {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assinatura">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Assinatura</CardTitle>
                    <CardDescription>Gerencie o plano da imobiliária</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {assinatura && (
                  <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge className={getStatusColor(subscriptionStatusColors, assinatura.status)}>
                        {assinatura.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Plano Atual</span>
                      <span className="font-medium">{assinatura.plano?.nome || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Início</span>
                      <span>{format(new Date(assinatura.data_inicio), 'dd/MM/yyyy', { locale: ptBR })}</span>
                    </div>
                    {assinatura.proxima_cobranca && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Próxima Cobrança</span>
                        <span>{format(new Date(assinatura.proxima_cobranca), 'dd/MM/yyyy', { locale: ptBR })}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="font-medium">
                    {assinatura ? 'Alterar Plano' : 'Atribuir Plano'}
                  </h4>
                  <Select value={selectedPlano} onValueChange={setSelectedPlano}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um plano" />
                    </SelectTrigger>
                    <SelectContent>
                      {planos.map((plano) => (
                        <SelectItem key={plano.id} value={plano.id}>
                          {plano.nome} - R$ {plano.valor_mensal.toFixed(2).replace('.', ',')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleAtribuirPlano} 
                    disabled={savingPlano || !selectedPlano}
                  >
                    {savingPlano && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {assinatura ? 'Alterar Plano' : 'Atribuir Plano'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Settings2 className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Features da Imobiliária</CardTitle>
                    <CardDescription>
                      Habilite ou desabilite funcionalidades opcionais para todos os corretores desta imobiliária
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {loadingFeatures ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                          <ClipboardList className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                          <p className="font-medium">Pesquisa Pós-Visita</p>
                          <p className="text-sm text-muted-foreground">
                            Permite que corretores enviem pesquisas de feedback para clientes após visitas confirmadas
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={surveyFeatureEnabled}
                        onCheckedChange={setSurveyFeatureEnabled}
                      />
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button 
                        onClick={async () => {
                          if (!id) return;
                          setSavingFeatures(true);
                          try {
                            const { error } = await supabase
                              .from('imobiliaria_feature_flags')
                              .upsert({
                                imobiliaria_id: id,
                                feature_key: 'post_visit_survey',
                                enabled: surveyFeatureEnabled,
                                updated_at: new Date().toISOString(),
                              }, {
                                onConflict: 'imobiliaria_id,feature_key',
                              });

                            if (error) throw error;
                            toast.success('Features atualizadas com sucesso!');
                          } catch (error: any) {
                            console.error('Error saving features:', error);
                            toast.error(error.message || 'Erro ao salvar features');
                          } finally {
                            setSavingFeatures(false);
                          }
                        }}
                        disabled={savingFeatures}
                      >
                        {savingFeatures && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Features
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="corretores">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle>Corretores</CardTitle>
                      <CardDescription>
                        {corretores.length} usuário(s) vinculado(s)
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {corretores.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum usuário vinculado a esta imobiliária</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Função</TableHead>
                        <TableHead>Data de Cadastro</TableHead>
                        <TableHead className="w-12">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {corretores.map((corretor) => (
                        <TableRow key={corretor.id}>
                          <TableCell className="font-medium">
                            {corretor.profile?.nome || 'Sem nome'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {corretor.role === 'imobiliaria_admin' ? 'Administrador' : 'Corretor'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(corretor.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openResetDialog(corretor)}>
                                  <KeyRound className="h-4 w-4 mr-2" />
                                  Redefinir Senha
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clientes Tab */}
          <TabsContent value="clientes">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <UserCircle className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Clientes</CardTitle>
                    <CardDescription>
                      {clientes.length} cliente(s) cadastrado(s)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {clientes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <UserCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum cliente cadastrado nesta imobiliária</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Cadastro</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientes.map((cliente) => (
                          <TableRow key={cliente.id}>
                            <TableCell className="font-medium">{cliente.nome}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {cliente.tipo === 'comprador' ? 'Comprador' : 'Proprietário'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                {formatPhone(cliente.telefone)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {cliente.email ? (
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  {cliente.email}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {format(new Date(cliente.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Imóveis Tab */}
          <TabsContent value="imoveis">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Home className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Imóveis</CardTitle>
                    <CardDescription>
                      {imoveis.length} imóvel(is) cadastrado(s)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {imoveis.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum imóvel cadastrado nesta imobiliária</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Endereço</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Bairro</TableHead>
                          <TableHead>Cidade</TableHead>
                          <TableHead>Cadastro</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {imoveis.map((imovel) => (
                          <TableRow key={imovel.id}>
                            <TableCell className="font-medium">{imovel.endereco}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{imovel.tipo}</Badge>
                            </TableCell>
                            <TableCell>{imovel.bairro || '-'}</TableCell>
                            <TableCell>{imovel.cidade || '-'}</TableCell>
                            <TableCell>
                              {format(new Date(imovel.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fichas Tab */}
          <TabsContent value="fichas">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Registros de Visita</CardTitle>
                    <CardDescription>
                      {fichas.length} registro(s)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {fichas.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum registro de visita nesta imobiliária</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Protocolo</TableHead>
                          <TableHead>Comprador</TableHead>
                          <TableHead>Proprietário</TableHead>
                          <TableHead>Imóvel</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Data Visita</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fichas.map((ficha) => (
                          <TableRow key={ficha.id}>
                            <TableCell className="font-mono font-medium">{ficha.protocolo}</TableCell>
                            <TableCell>{ficha.comprador_nome || '-'}</TableCell>
                            <TableCell>{ficha.proprietario_nome || '-'}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{ficha.imovel_endereco}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getStatusColor(fichaStatusColors, ficha.status)}>
                                {isFichaConfirmada(ficha.status) ? 'Confirmado' : ficha.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {format(new Date(ficha.data_visita), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Password Reset Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
            <DialogDescription>
              Redefinindo senha para: <strong>{selectedUser?.nome}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <RadioGroup
              value={resetAction}
              onValueChange={(value) => setResetAction(value as typeof resetAction)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="set_password" id="set_password" />
                <Label htmlFor="set_password" className="font-normal cursor-pointer">
                  Definir nova senha manualmente
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="send_reset_email" id="send_reset_email" />
                <Label htmlFor="send_reset_email" className="font-normal cursor-pointer">
                  Enviar email de recuperação
                </Label>
              </div>
            </RadioGroup>

            {resetAction === 'set_password' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new_password">Nova senha</Label>
                  <Input
                    id="new_password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirmar senha</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    placeholder="Digite a senha novamente"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                {newPassword && newPassword.length < 6 && (
                  <p className="text-sm text-destructive">
                    A senha deve ter pelo menos 6 caracteres
                  </p>
                )}
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-sm text-destructive">
                    As senhas não coincidem
                  </p>
                )}
              </div>
            )}

            {resetAction === 'send_reset_email' && (
              <p className="text-sm text-muted-foreground">
                Um email será enviado para o usuário com um link para redefinir a senha.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleResetPassword} disabled={isResetting}>
              {isResetting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <KeyRound className="h-4 w-4 mr-2" />
              Redefinir Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog></>
      </>);
}
