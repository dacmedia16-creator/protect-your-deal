import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ImobiliariaLayout } from '@/components/layouts/ImobiliariaLayout';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Building2, Settings, Bell, Link as LinkIcon, Save } from 'lucide-react';

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
});

type FormData = z.infer<typeof formSchema>;

export default function EmpresaConfiguracoes() {
  const { imobiliaria, imobiliariaId, refetch } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
    },
  });

  useEffect(() => {
    if (imobiliaria) {
      form.reset({
        nome: imobiliaria.nome || '',
        cnpj: imobiliaria.cnpj || '',
        email: imobiliaria.email || '',
        telefone: imobiliaria.telefone || '',
        endereco: imobiliaria.endereco || '',
        cidade: imobiliaria.cidade || '',
        estado: imobiliaria.estado || '',
      });
      setLoading(false);
    }
  }, [imobiliaria, form]);

  const onSubmit = async (data: FormData) => {
    if (!imobiliariaId) return;
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
        })
        .eq('id', imobiliariaId);

      if (error) throw error;
      
      toast.success('Configurações salvas com sucesso!');
      refetch();
    } catch (error: any) {
      console.error('Error updating imobiliaria:', error);
      toast.error(error.message || 'Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ImobiliariaLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ImobiliariaLayout>
    );
  }

  return (
    <ImobiliariaLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Configurações</h1>
            <p className="text-muted-foreground">Gerencie as configurações da imobiliária</p>
          </div>
        </div>

        <Tabs defaultValue="dados" className="space-y-6">
          <TabsList>
            <TabsTrigger value="dados">Dados da Empresa</TabsTrigger>
            <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
            <TabsTrigger value="integracoes">Integrações</TabsTrigger>
          </TabsList>

          <TabsContent value="dados">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Dados da Empresa</CardTitle>
                    <CardDescription>Informações cadastrais da imobiliária</CardDescription>
                  </div>
                </div>
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
                            <FormLabel>Nome da Empresa *</FormLabel>
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

          <TabsContent value="notificacoes">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Notificações</CardTitle>
                    <CardDescription>Configure como você deseja receber notificações</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-medium">Notificações por Email</p>
                    <p className="text-sm text-muted-foreground">
                      Receba notificações de fichas confirmadas por email
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-medium">Resumo Diário</p>
                    <p className="text-sm text-muted-foreground">
                      Receba um resumo diário das atividades
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-medium">Alertas de Assinatura</p>
                    <p className="text-sm text-muted-foreground">
                      Receba alertas sobre vencimento da assinatura
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integracoes">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <LinkIcon className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Integrações</CardTitle>
                    <CardDescription>Conecte serviços externos à sua conta</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <span className="text-green-500 font-bold">W</span>
                    </div>
                    <div>
                      <p className="font-medium">WhatsApp</p>
                      <p className="text-sm text-muted-foreground">
                        Envie confirmações via WhatsApp
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Configurar
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <span className="text-blue-500 font-bold">IV</span>
                    </div>
                    <div>
                      <p className="font-medium">ImoView</p>
                      <p className="text-sm text-muted-foreground">
                        Sincronize imóveis com ImoView
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Configurar
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <span className="text-orange-500 font-bold">ZT</span>
                    </div>
                    <div>
                      <p className="font-medium">ZionTalk</p>
                      <p className="text-sm text-muted-foreground">
                        Integração com ZionTalk para SMS
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Configurar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ImobiliariaLayout>
  );
}
