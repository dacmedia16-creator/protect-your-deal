import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SuperAdminLayout } from '@/components/layouts/SuperAdminLayout';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Building2, Users, CreditCard, Save, UserPlus } from 'lucide-react';
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

export default function AdminDetalhesImobiliaria() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null);
  const [corretores, setCorretores] = useState<Corretor[]>([]);
  const [selectedPlano, setSelectedPlano] = useState<string>('');
  const [savingPlano, setSavingPlano] = useState(false);

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
          .select('*')
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
        });

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

  const statusColors: Record<string, string> = {
    ativa: 'bg-success text-success-foreground',
    trial: 'bg-warning text-warning-foreground',
    pendente: 'bg-warning text-warning-foreground',
    suspensa: 'bg-destructive text-destructive-foreground',
    cancelada: 'bg-muted text-muted-foreground',
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/imobiliarias')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">{form.getValues('nome')}</h1>
            <p className="text-muted-foreground">Detalhes da imobiliária</p>
          </div>
        </div>

        <Tabs defaultValue="dados" className="space-y-6">
          <TabsList>
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="assinatura">Assinatura</TabsTrigger>
            <TabsTrigger value="corretores">Corretores</TabsTrigger>
          </TabsList>

          <TabsContent value="dados">
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
                              <Input placeholder="00.000.000/0000-00" {...field} />
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
                      <Badge className={statusColors[assinatura.status]}>
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
}
