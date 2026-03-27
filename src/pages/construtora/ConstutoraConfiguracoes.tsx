import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUserRole } from '@/hooks/useUserRole';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ConstutoraLayout } from '@/components/layouts/ConstutoraLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Building2, Settings, Bell, Link as LinkIcon, Save, Upload, Image, Trash2, Copy, Check } from 'lucide-react';
import { formatPhone } from '@/lib/phone';
import { formatCNPJ } from '@/lib/cnpj';

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
});

type FormData = z.infer<typeof formSchema>;

export default function ConstutoraConfiguracoes() {
  useDocumentTitle('Configurações | Construtora');
  const { construtora, construtoraId, refetch } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [codigoCopied, setCodigoCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { nome: '', cnpj: '', email: '', telefone: '', endereco: '', cidade: '', estado: '' },
  });

  useEffect(() => {
    if (construtora) {
      form.reset({
        nome: construtora.nome || '',
        cnpj: construtora.cnpj || '',
        email: construtora.email || '',
        telefone: construtora.telefone || '',
        endereco: construtora.endereco || '',
        cidade: construtora.cidade || '',
        estado: construtora.estado || '',
      });
      setLogoUrl(construtora.logo_url || null);
      setLoading(false);
    }
  }, [construtora, form]);

  const extractFilePathFromUrl = (url: string): string | null => {
    const parts = url.split('/logos-construtoras/');
    return parts.length > 1 ? parts[1].split('?')[0] : null;
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !construtoraId) return;
    if (!file.type.startsWith('image/')) { toast.error('Selecione uma imagem válida'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Máximo 2MB'); return; }

    setUploadingLogo(true);
    try {
      if (logoUrl) {
        const old = extractFilePathFromUrl(logoUrl);
        if (old) await supabase.storage.from('logos-construtoras').remove([old]);
      }
      const ext = file.name.split('.').pop();
      const fileName = `${construtoraId}/logo-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('logos-construtoras').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('logos-construtoras').getPublicUrl(fileName);
      const { error: updateError } = await supabase.from('construtoras').update({ logo_url: publicUrl }).eq('id', construtoraId);
      if (updateError) throw updateError;
      setLogoUrl(publicUrl);
      toast.success('Logo atualizado!');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer upload');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    if (!construtoraId || !logoUrl) return;
    setUploadingLogo(true);
    try {
      const filePath = extractFilePathFromUrl(logoUrl);
      if (filePath) await supabase.storage.from('logos-construtoras').remove([filePath]);
      const { error } = await supabase.from('construtoras').update({ logo_url: null }).eq('id', construtoraId);
      if (error) throw error;
      setLogoUrl(null);
      toast.success('Logo removido!');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao remover logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!construtoraId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('construtoras').update({
        nome: data.nome, cnpj: data.cnpj || null, email: data.email,
        telefone: data.telefone || null, endereco: data.endereco || null,
        cidade: data.cidade || null, estado: data.estado || null,
      }).eq('id', construtoraId);
      if (error) throw error;
      toast.success('Configurações salvas!');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ConstutoraLayout><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></ConstutoraLayout>;
  }

  return (
    <ConstutoraLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10"><Settings className="h-6 w-6 text-primary" /></div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Configurações</h1>
            <p className="text-muted-foreground">Gerencie as configurações da construtora</p>
          </div>
        </div>

        <Tabs defaultValue="dados" className="space-y-6">
          <TabsList>
            <TabsTrigger value="dados">Dados da Empresa</TabsTrigger>
            <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="space-y-6">
            {/* Código */}
            {construtora?.codigo && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle>Código da Construtora</CardTitle>
                      <CardDescription>Compartilhe este código com corretores para vinculação</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="px-6 py-3 bg-background rounded-lg border-2 border-primary">
                      <span className="text-3xl font-mono font-bold text-primary">{construtora.codigo}</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => {
                      navigator.clipboard.writeText(String(construtora.codigo));
                      setCodigoCopied(true);
                      toast.success('Código copiado!');
                      setTimeout(() => setCodigoCopied(false), 2000);
                    }}>
                      {codigoCopied ? <><Check className="h-4 w-4 mr-2" />Copiado</> : <><Copy className="h-4 w-4 mr-2" />Copiar</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Logo */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Image className="h-5 w-5 text-primary" />
                  <div><CardTitle>Logo da Empresa</CardTitle><CardDescription>O logo aparecerá nos comprovantes de visita em PDF</CardDescription></div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {logoUrl ? (
                      <div className="h-24 w-24 rounded-lg border-2 border-dashed border-border overflow-hidden bg-muted flex items-center justify-center">
                        <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                      </div>
                    ) : (
                      <div className="h-24 w-24 rounded-lg border-2 border-dashed border-border bg-muted flex items-center justify-center">
                        <Building2 className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input type="file" ref={fileInputRef} accept="image/png,image/jpeg,image/jpg" className="hidden" onChange={handleLogoUpload} />
                      <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingLogo}>
                        {uploadingLogo ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                        {logoUrl ? 'Alterar Logo' : 'Fazer Upload'}
                      </Button>
                      {logoUrl && (
                        <Button type="button" variant="ghost" size="sm" onClick={handleRemoveLogo} disabled={uploadingLogo} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />Remover
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">PNG, JPG. Máximo: 2MB</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-primary" />
                  <div><CardTitle>Dados da Empresa</CardTitle><CardDescription>Informações cadastrais da construtora</CardDescription></div>
                </div>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField control={form.control} name="nome" render={({ field }) => (
                        <FormItem className="md:col-span-2"><FormLabel>Nome da Empresa *</FormLabel><FormControl><Input placeholder="Nome da construtora" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="cnpj" render={({ field }) => (
                        <FormItem><FormLabel>CNPJ</FormLabel><FormControl><Input placeholder="00.000.000/0000-00" {...field} onChange={(e) => field.onChange(formatCNPJ(e.target.value))} maxLength={18} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>Email *</FormLabel><FormControl><Input type="email" placeholder="email@exemplo.com" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="telefone" render={({ field }) => (
                        <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input placeholder="(00) 00000-0000" value={field.value} onChange={(e) => field.onChange(formatPhone(e.target.value))} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="endereco" render={({ field }) => (
                        <FormItem className="md:col-span-2"><FormLabel>Endereço</FormLabel><FormControl><Input placeholder="Rua, número, bairro" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="cidade" render={({ field }) => (
                        <FormItem><FormLabel>Cidade</FormLabel><FormControl><Input placeholder="Cidade" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="estado" render={({ field }) => (
                        <FormItem><FormLabel>Estado</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                            <SelectContent>{estadosBrasileiros.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                          </Select><FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <Button type="submit" disabled={saving}>
                      {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      <Save className="h-4 w-4 mr-2" />Salvar Alterações
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
                  <div><CardTitle>Notificações</CardTitle><CardDescription>Configure como deseja receber notificações</CardDescription></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div><p className="font-medium">Notificações por Email</p><p className="text-sm text-muted-foreground">Receba notificações de fichas confirmadas</p></div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div><p className="font-medium">Resumo Diário</p><p className="text-sm text-muted-foreground">Receba um resumo diário das atividades</p></div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div><p className="font-medium">Alertas de Assinatura</p><p className="text-sm text-muted-foreground">Alertas sobre vencimento da assinatura</p></div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ConstutoraLayout>
  );
}
