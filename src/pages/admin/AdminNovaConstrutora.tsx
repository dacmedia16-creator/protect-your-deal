import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/PasswordInput';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, HardHat, Copy, Check, UserPlus } from 'lucide-react';
import { formatPhone, unformatPhone } from '@/lib/phone';

const estadosBrasileiros = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO'
];

const formSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  cnpj: z.string().optional(),
  email: z.string().email('Email inválido').max(255),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  status: z.string().default('ativo'),
  plano_id: z.string().optional(),
  admin_nome: z.string().optional(),
  admin_email: z.string().optional(),
  admin_senha: z.string().optional(),
}).superRefine((data, ctx) => {
  // Validation is only needed when createAdmin is true,
  // but since we can't access external state in superRefine,
  // we validate in onSubmit instead
});

type FormData = z.infer<typeof formSchema>;

interface Plano {
  id: string;
  nome: string;
  valor_mensal: number;
}

export default function AdminNovaConstrutora() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [createAdmin, setCreateAdmin] = useState(true);
  const [successDialog, setSuccessDialog] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', senha: '' });
  const [copied, setCopied] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '', cnpj: '', email: '', telefone: '',
      endereco: '', cidade: '', estado: '', status: 'ativo', plano_id: '',
      admin_nome: '', admin_email: '', admin_senha: '',
    },
  });

  useEffect(() => {
    async function fetchPlanos() {
      const { data } = await supabase
        .from('planos')
        .select('id, nome, valor_mensal')
        .eq('ativo', true)
        .order('valor_mensal', { ascending: true });
      setPlanos(data || []);
    }
    fetchPlanos();
  }, []);

  const handleCopyCredentials = async () => {
    const text = `Email: ${credentials.email}\nSenha: ${credentials.senha}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Credenciais copiadas!');
    setTimeout(() => setCopied(false), 2000);
  };

  const onSubmit = async (data: FormData) => {
    // Validate admin fields if createAdmin is enabled
    if (createAdmin) {
      if (!data.admin_nome || data.admin_nome.length < 2) {
        toast.error('Nome do administrador deve ter pelo menos 2 caracteres');
        return;
      }
      if (!data.admin_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.admin_email)) {
        toast.error('Email do administrador inválido');
        return;
      }
      if (!data.admin_senha || data.admin_senha.length < 6) {
        toast.error('Senha do administrador deve ter pelo menos 6 caracteres');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // 1. Create construtora
      const { data: construtora, error: constError } = await supabase
        .from('construtoras')
        .insert({
          nome: data.nome,
          cnpj: data.cnpj || null,
          email: data.email,
          telefone: data.telefone ? unformatPhone(data.telefone) : null,
          endereco: data.endereco || null,
          cidade: data.cidade || null,
          estado: data.estado || null,
          status: data.status,
        })
        .select()
        .single();

      if (constError) throw constError;

      // 1b. Create generic empreendimento
      if (construtora) {
        await supabase.from('empreendimentos').insert({
          construtora_id: construtora.id,
          nome: 'Outro (Endereço Manual)',
          tipo: 'misto',
          status: 'ativo',
          descricao: 'Empreendimento genérico para endereços manuais',
        });
      }

      // 2. Create subscription if plan selected
      if (data.plano_id && construtora) {
        const { error: assinError } = await supabase
          .from('assinaturas')
          .insert({
            construtora_id: construtora.id,
            plano_id: data.plano_id,
            status: 'ativa',
            data_inicio: new Date().toISOString().split('T')[0],
          });

        if (assinError) {
          console.error('Error creating subscription:', assinError);
          toast.error('Construtora criada, mas erro ao criar assinatura');
        }
      }

      // 3. Create admin user if enabled
      if (createAdmin && construtora) {
        const { data: fnData, error: fnError } = await supabase.functions.invoke('admin-create-user', {
          body: {
            email: data.admin_email,
            password: data.admin_senha,
            nome: data.admin_nome,
            role: 'construtora_admin',
            construtora_id: construtora.id,
          },
        });

        if (fnError) {
          // Try to extract error message from response
          let errorMsg = 'Erro ao criar usuário administrador';
          try {
            const errorBody = await fnError.context?.json?.();
            if (errorBody?.error) errorMsg = errorBody.error;
          } catch {}
          console.error('Admin creation error:', fnError);
          toast.error(`Construtora criada, mas: ${errorMsg}`);
          navigate('/admin/construtoras');
          return;
        }

        // Show success dialog with credentials
        setCredentials({ email: data.admin_email!, senha: data.admin_senha! });
        setSuccessDialog(true);
        toast.success('Construtora e administrador criados com sucesso!');
      } else {
        toast.success('Construtora criada com sucesso!');
        navigate('/admin/construtoras');
      }
    } catch (error: any) {
      console.error('Erro ao criar construtora:', error);
      toast.error(error.message || 'Erro ao criar construtora');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (<div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/admin/construtoras')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <HardHat className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Nova Construtora</CardTitle>
                <CardDescription>Preencha os dados para cadastrar uma nova construtora</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField control={form.control} name="nome" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Nome *</FormLabel>
                      <FormControl><Input placeholder="Nome da construtora" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="cnpj" render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl><Input placeholder="00.000.000/0000-00" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl><Input type="email" placeholder="email@exemplo.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="telefone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(00) 00000-0000"
                          value={field.value}
                          onChange={(e) => field.onChange(formatPhone(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="suspenso">Suspenso</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="plano_id" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plano</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione um plano (opcional)" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {planos.map((plano) => (
                            <SelectItem key={plano.id} value={plano.id}>
                              {plano.nome} - R$ {plano.valor_mensal.toFixed(2).replace('.', ',')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="endereco" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Endereço</FormLabel>
                      <FormControl><Input placeholder="Rua, número, bairro" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="cidade" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl><Input placeholder="Cidade" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="estado" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {estadosBrasileiros.map((estado) => (
                            <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Admin user section */}
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5 text-primary" />
                      <Label htmlFor="create-admin" className="text-base font-medium">
                        Criar usuário administrador
                      </Label>
                    </div>
                    <Switch
                      id="create-admin"
                      checked={createAdmin}
                      onCheckedChange={setCreateAdmin}
                    />
                  </div>

                  {createAdmin && (
                    <div className="grid gap-4 md:grid-cols-2 pt-2">
                      <FormField control={form.control} name="admin_nome" render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Nome do administrador *</FormLabel>
                          <FormControl><Input placeholder="Nome completo" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="admin_email" render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Email do administrador *</FormLabel>
                          <FormControl><Input type="email" placeholder="admin@construtora.com" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="admin_senha" render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Senha *</FormLabel>
                          <FormControl>
                            <PasswordInput
                              value={field.value || ''}
                              onChange={field.onChange}
                              placeholder="Mínimo 6 caracteres"
                              showGenerator
                              showStrength
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => navigate('/admin/construtoras')} className="flex-1">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Criar Construtora
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Success dialog with credentials */}
      <Dialog open={successDialog} onOpenChange={(open) => {
        if (!open) navigate('/admin/construtoras');
        setSuccessDialog(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-emerald-500" />
              Construtora criada com sucesso!
            </DialogTitle>
            <DialogDescription>
              Anote as credenciais do administrador abaixo. Elas não serão exibidas novamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="rounded-lg bg-muted p-4 space-y-2 font-mono text-sm">
              <p><span className="text-muted-foreground">Email:</span> {credentials.email}</p>
              <p><span className="text-muted-foreground">Senha:</span> {credentials.senha}</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCopyCredentials}>
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? 'Copiado!' : 'Copiar credenciais'}
            </Button>
            <Button onClick={() => { setSuccessDialog(false); navigate('/admin/construtoras'); }}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>);
}
