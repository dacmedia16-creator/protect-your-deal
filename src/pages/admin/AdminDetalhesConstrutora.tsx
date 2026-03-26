import { useState, useEffect, useRef } from 'react';
import { subscriptionStatusColors, getStatusColor } from '@/lib/statusColors';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatCNPJ } from '@/lib/cnpj';
import { SuperAdminLayout } from '@/components/layouts/SuperAdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, HardHat, Users, CreditCard, Save, KeyRound, Building2, Upload, Trash2, ImageIcon } from 'lucide-react';
import { formatPhone } from '@/lib/phone';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const estadosBrasileiros = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO'
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
  profile?: { nome: string; email?: string };
}

interface Empreendimento {
  id: string;
  nome: string;
  cidade: string | null;
  estado: string | null;
  tipo: string;
  status: string;
  total_unidades: number | null;
}

interface Parceira {
  id: string;
  imobiliaria_id: string;
  status: string;
  created_at: string;
  imobiliaria?: { nome: string; email: string };
}

export default function AdminDetalhesConstrutora() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null);
  const [corretores, setCorretores] = useState<Corretor[]>([]);
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [parceiras, setParceiras] = useState<Parceira[]>([]);
  const [selectedPlano, setSelectedPlano] = useState<string>('');
  const [savingPlano, setSavingPlano] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password reset dialog
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; nome: string } | null>(null);
  const [resetAction, setResetAction] = useState<'set_password' | 'send_reset_email'>('set_password');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { nome: '', cnpj: '', email: '', telefone: '', endereco: '', cidade: '', estado: '', status: 'ativo' },
  });

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        // Fetch construtora
        const { data: construtora, error } = await supabase
          .from('construtoras')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        if (!construtora) {
          toast.error('Construtora não encontrada');
          navigate('/admin/construtoras');
          return;
        }

        form.reset({
          nome: construtora.nome,
          cnpj: construtora.cnpj || '',
          email: construtora.email,
          telefone: construtora.telefone || '',
          endereco: construtora.endereco || '',
          cidade: construtora.cidade || '',
          estado: construtora.estado || '',
          status: construtora.status,
        });
        setLogoUrl(construtora.logo_url);

        // Fetch planos for construtora
        const { data: planosData } = await supabase
          .from('planos')
          .select('id, nome, valor_mensal')
          .eq('ativo', true)
          .order('valor_mensal');
        setPlanos(planosData || []);

        // Fetch assinatura
        const { data: assData } = await supabase
          .from('assinaturas')
          .select('*')
          .eq('construtora_id', id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (assData) {
          const { data: planoData } = await supabase
            .from('planos')
            .select('id, nome, valor_mensal')
            .eq('id', assData.plano_id)
            .maybeSingle();
          setAssinatura({ ...assData, plano: planoData || undefined });
          setSelectedPlano(assData.plano_id);
        }

        // Fetch corretores
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('*')
          .eq('construtora_id', id);

        if (rolesData) {
          const userIds = rolesData.map(r => r.user_id);
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, nome, email')
            .in('user_id', userIds);
          setCorretores(rolesData.map(r => ({
            ...r,
            profile: profilesData?.find(p => p.user_id === r.user_id),
          })));
        }

        // Fetch empreendimentos
        const { data: empreendimentosData } = await supabase
          .from('empreendimentos')
          .select('id, nome, cidade, estado, tipo, status, total_unidades')
          .eq('construtora_id', id)
          .order('created_at', { ascending: false });
        setEmpreendimentos(empreendimentosData || []);

        // Fetch parceiras
        const { data: parceirasData } = await supabase
          .from('construtora_imobiliarias')
          .select('id, imobiliaria_id, status, created_at')
          .eq('construtora_id', id);

        if (parceirasData && parceirasData.length > 0) {
          const imobIds = parceirasData.map(p => p.imobiliaria_id);
          const { data: imobsData } = await supabase
            .from('imobiliarias')
            .select('id, nome, email')
            .in('id', imobIds);

          setParceiras(parceirasData.map(p => ({
            ...p,
            imobiliaria: imobsData?.find(i => i.id === p.imobiliaria_id),
          })));
        }
      } catch (error) {
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
        .from('construtoras')
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
      toast.success('Construtora atualizada com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleAtribuirPlano = async () => {
    if (!id || !selectedPlano) return;
    setSavingPlano(true);
    try {
      if (assinatura) {
        const { error } = await supabase.from('assinaturas').update({ plano_id: selectedPlano, status: 'ativa' }).eq('id', assinatura.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('assinaturas').insert({ construtora_id: id, plano_id: selectedPlano, status: 'ativa', data_inicio: new Date().toISOString().split('T')[0] });
        if (error) throw error;
      }
      toast.success('Plano atribuído com sucesso!');
      // Refresh
      const { data: newAss } = await supabase.from('assinaturas').select('*').eq('construtora_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (newAss) {
        const { data: planoData } = await supabase.from('planos').select('id, nome, valor_mensal').eq('id', newAss.plano_id).maybeSingle();
        setAssinatura({ ...newAss, plano: planoData || undefined });
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atribuir plano');
    } finally {
      setSavingPlano(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !id) return;
    if (!file.type.startsWith('image/')) { toast.error('Selecione uma imagem'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Máximo 2MB'); return; }
    setUploadingLogo(true);
    try {
      if (logoUrl) {
        const match = logoUrl.match(/logos-construtoras\/(.+)/);
        if (match) await supabase.storage.from('logos-construtoras').remove([match[1]]);
      }
      const ext = file.name.split('.').pop();
      const path = `${id}/logo.${ext}`;
      const { error: uploadError } = await supabase.storage.from('logos-construtoras').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('logos-construtoras').getPublicUrl(path);
      const { error: updateError } = await supabase.from('construtoras').update({ logo_url: publicUrl }).eq('id', id);
      if (updateError) throw updateError;
      setLogoUrl(publicUrl);
      toast.success('Logo atualizado!');
    } catch (error) {
      toast.error('Erro ao enviar logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!id || !logoUrl) return;
    try {
      const match = logoUrl.match(/logos-construtoras\/(.+)/);
      if (match) await supabase.storage.from('logos-construtoras').remove([match[1]]);
      await supabase.from('construtoras').update({ logo_url: null }).eq('id', id);
      setLogoUrl(null);
      toast.success('Logo removido!');
    } catch { toast.error('Erro ao remover logo'); }
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
      if (!newPassword || newPassword.length < 6) { toast.error('Senha deve ter pelo menos 6 caracteres'); return; }
      if (newPassword !== confirmPassword) { toast.error('Senhas não coincidem'); return; }
    }
    setIsResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: { user_id: selectedUser.id, action: resetAction, new_password: resetAction === 'set_password' ? newPassword : undefined },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(data?.message || 'Senha redefinida!');
      setResetDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao redefinir senha');
    } finally {
      setIsResetting(false);
    }
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/construtoras')}><ArrowLeft className="h-5 w-5" /></Button>
            <div><div className="h-8 w-48 bg-muted rounded animate-pulse" /><div className="h-4 w-32 bg-muted rounded animate-pulse mt-2" /></div>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/construtoras')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">{form.getValues('nome')}</h1>
            <p className="text-muted-foreground">Gerenciar construtora</p>
          </div>
        </div>

        <Tabs defaultValue="dados" className="space-y-4">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="dados"><HardHat className="h-4 w-4 mr-1.5" />Dados</TabsTrigger>
            <TabsTrigger value="assinatura"><CreditCard className="h-4 w-4 mr-1.5" />Assinatura</TabsTrigger>
            <TabsTrigger value="empreendimentos"><Building2 className="h-4 w-4 mr-1.5" />Empreendimentos</TabsTrigger>
            <TabsTrigger value="parceiras"><Building2 className="h-4 w-4 mr-1.5" />Parceiras</TabsTrigger>
            <TabsTrigger value="corretores"><Users className="h-4 w-4 mr-1.5" />Corretores</TabsTrigger>
          </TabsList>

          {/* Dados Tab */}
          <TabsContent value="dados">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="md:col-span-2">
                <CardHeader><CardTitle>Informações</CardTitle></CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField control={form.control} name="nome" render={({ field }) => (
                          <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="cnpj" render={({ field }) => (
                          <FormItem><FormLabel>CNPJ</FormLabel><FormControl><Input {...field} onChange={e => field.onChange(formatCNPJ(e.target.value))} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="email" render={({ field }) => (
                          <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="telefone" render={({ field }) => (
                          <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input {...field} onChange={e => field.onChange(formatPhone(e.target.value))} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="endereco" render={({ field }) => (
                          <FormItem className="md:col-span-2"><FormLabel>Endereço</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="cidade" render={({ field }) => (
                          <FormItem><FormLabel>Cidade</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="estado" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                              <SelectContent>{estadosBrasileiros.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="status" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="ativo">Ativo</SelectItem>
                                <SelectItem value="suspenso">Suspenso</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <Button type="submit" disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Salvar
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Logo card */}
              <Card>
                <CardHeader><CardTitle>Logo</CardTitle></CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                  {logoUrl ? (
                    <div className="relative">
                      <img src={logoUrl} alt="Logo" className="w-32 h-32 object-contain rounded-lg border" />
                      <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={handleRemoveLogo}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-lg border-2 border-dashed flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingLogo}>
                    {uploadingLogo ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                    {logoUrl ? 'Trocar' : 'Enviar'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Assinatura Tab */}
          <TabsContent value="assinatura">
            <Card>
              <CardHeader>
                <CardTitle>Assinatura</CardTitle>
                <CardDescription>
                  {assinatura ? (
                    <span>Status: <Badge className={getStatusColor(assinatura.status ?? '', subscriptionStatusColors)}>{assinatura.status}</Badge></span>
                  ) : 'Nenhuma assinatura ativa'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {assinatura?.plano && (
                  <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                    <p className="font-medium">{assinatura.plano.nome}</p>
                    <p className="text-sm text-muted-foreground">R$ {assinatura.plano.valor_mensal.toFixed(2).replace('.', ',')}/mês</p>
                  </div>
                )}
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <Label>Plano</Label>
                    <Select value={selectedPlano} onValueChange={setSelectedPlano}>
                      <SelectTrigger><SelectValue placeholder="Selecione um plano" /></SelectTrigger>
                      <SelectContent>
                        {planos.map(p => <SelectItem key={p.id} value={p.id}>{p.nome} — R$ {p.valor_mensal.toFixed(2).replace('.', ',')}/mês</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAtribuirPlano} disabled={savingPlano || !selectedPlano}>
                    {savingPlano ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
                    {assinatura ? 'Alterar' : 'Atribuir'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Empreendimentos Tab */}
          <TabsContent value="empreendimentos">
            <Card>
              <CardHeader><CardTitle>Empreendimentos ({empreendimentos.length})</CardTitle></CardHeader>
              <CardContent>
                {empreendimentos.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum empreendimento cadastrado</p>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Cidade/UF</TableHead>
                          <TableHead>Unidades</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {empreendimentos.map(e => (
                          <TableRow key={e.id}>
                            <TableCell className="font-medium">{e.nome}</TableCell>
                            <TableCell>{e.tipo}</TableCell>
                            <TableCell>{[e.cidade, e.estado].filter(Boolean).join('/') || '-'}</TableCell>
                            <TableCell>{e.total_unidades ?? '-'}</TableCell>
                            <TableCell><Badge variant={e.status === 'ativo' ? 'default' : 'secondary'}>{e.status}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Parceiras Tab */}
          <TabsContent value="parceiras">
            <Card>
              <CardHeader><CardTitle>Imobiliárias Parceiras ({parceiras.length})</CardTitle></CardHeader>
              <CardContent>
                {parceiras.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhuma parceria cadastrada</p>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Imobiliária</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Desde</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parceiras.map(p => (
                          <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/imobiliarias/${p.imobiliaria_id}`)}>
                            <TableCell className="font-medium">{p.imobiliaria?.nome || '-'}</TableCell>
                            <TableCell className="text-muted-foreground">{p.imobiliaria?.email || '-'}</TableCell>
                            <TableCell><Badge variant={p.status === 'ativa' ? 'default' : 'secondary'}>{p.status}</Badge></TableCell>
                            <TableCell className="text-muted-foreground">{format(new Date(p.created_at), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Corretores Tab */}
          <TabsContent value="corretores">
            <Card>
              <CardHeader><CardTitle>Corretores ({corretores.length})</CardTitle></CardHeader>
              <CardContent>
                {corretores.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum corretor vinculado</p>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Desde</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {corretores.map(c => (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium">{c.profile?.nome || 'Sem nome'}</TableCell>
                            <TableCell><Badge variant="outline">{c.role}</Badge></TableCell>
                            <TableCell className="text-muted-foreground">{format(new Date(c.created_at), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openResetDialog(c)}>
                                <KeyRound className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Reset Password Dialog */}
        <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Redefinir Senha</DialogTitle>
              <DialogDescription>Redefinir senha de {selectedUser?.nome}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <RadioGroup value={resetAction} onValueChange={(v) => setResetAction(v as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="set_password" id="set_password" />
                  <Label htmlFor="set_password">Definir nova senha</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="send_reset_email" id="send_reset_email" />
                  <Label htmlFor="send_reset_email">Enviar email de redefinição</Label>
                </div>
              </RadioGroup>
              {resetAction === 'set_password' && (
                <div className="space-y-3">
                  <div>
                    <Label>Nova senha</Label>
                    <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                  </div>
                  <div>
                    <Label>Confirmar senha</Label>
                    <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResetDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleResetPassword} disabled={isResetting}>
                {isResetting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  );
}
