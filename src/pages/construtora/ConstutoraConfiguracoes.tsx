import { useState, useEffect, useRef } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ConstutoraLayout } from '@/components/layouts/ConstutoraLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Building2, Upload, Image, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ConstutoraConfiguracoes() {
  useDocumentTitle('Configurações | Construtora');
  const { construtora, construtoraId, refetch } = useUserRole();

  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (construtora) {
      setNome(construtora.nome || '');
      setCnpj(construtora.cnpj || '');
      setEmail(construtora.email || '');
      setTelefone(construtora.telefone || '');
      setEndereco(construtora.endereco || '');
      setCidade(construtora.cidade || '');
      setEstado(construtora.estado || '');
      setLogoUrl(construtora.logo_url || null);
    }
  }, [construtora]);

  const extractFilePathFromUrl = (url: string): string | null => {
    const urlParts = url.split('/logos-construtoras/');
    if (urlParts.length > 1) {
      return urlParts[1].split('?')[0];
    }
    return null;
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !construtoraId) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB');
      return;
    }

    setUploadingLogo(true);

    try {
      if (logoUrl) {
        const oldFilePath = extractFilePathFromUrl(logoUrl);
        if (oldFilePath) {
          await supabase.storage.from('logos-construtoras').remove([oldFilePath]);
        }
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${construtoraId}/logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('logos-construtoras')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('logos-construtoras')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('construtoras')
        .update({ logo_url: publicUrl })
        .eq('id', construtoraId);

      if (updateError) throw updateError;

      setLogoUrl(publicUrl);
      toast.success('Logo atualizado com sucesso!');
      refetch();
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error(error.message || 'Erro ao fazer upload do logo');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!construtoraId || !logoUrl) return;

    setUploadingLogo(true);

    try {
      const filePath = extractFilePathFromUrl(logoUrl);
      if (filePath) {
        await supabase.storage.from('logos-construtoras').remove([filePath]);
      }

      const { error: updateError } = await supabase
        .from('construtoras')
        .update({ logo_url: null })
        .eq('id', construtoraId);

      if (updateError) throw updateError;

      setLogoUrl(null);
      toast.success('Logo removido com sucesso!');
      refetch();
    } catch (error: any) {
      console.error('Error removing logo:', error);
      toast.error(error.message || 'Erro ao remover logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!construtoraId) throw new Error('Construtora not found');
      const { error } = await supabase
        .from('construtoras')
        .update({ nome, cnpj: cnpj || null, email, telefone: telefone || null, endereco: endereco || null, cidade: cidade || null, estado: estado || null })
        .eq('id', construtoraId);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success('Dados atualizados com sucesso!');
      await refetch();
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao atualizar'),
  });

  return (
    <ConstutoraLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold">Configurações</h1>
          <p className="text-muted-foreground">Dados cadastrais da construtora</p>
        </div>

        {/* Logo Upload Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Image className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Logo da Empresa</CardTitle>
                <CardDescription>O logo aparecerá nos comprovantes de visita em PDF</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative">
                {logoUrl ? (
                  <div className="h-24 w-24 rounded-lg border-2 border-dashed border-border overflow-hidden bg-muted flex items-center justify-center">
                    <img
                      src={logoUrl}
                      alt="Logo da construtora"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-24 w-24 rounded-lg border-2 border-dashed border-border bg-muted flex items-center justify-center">
                    <Building2 className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png,image/jpeg,image/jpg"
                    className="hidden"
                    onChange={handleLogoUpload}
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
                </div>
                <p className="text-xs text-muted-foreground">
                  Formatos aceitos: PNG, JPG. Tamanho máximo: 2MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Dados da Empresa</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>Nome *</Label><Input value={nome} onChange={e => setNome(e.target.value)} /></div>
              <div><Label>CNPJ</Label><Input value={cnpj} onChange={e => setCnpj(e.target.value)} /></div>
              <div><Label>Email *</Label><Input value={email} onChange={e => setEmail(e.target.value)} type="email" /></div>
              <div><Label>Telefone</Label><Input value={telefone} onChange={e => setTelefone(e.target.value)} /></div>
              <div><Label>Endereço</Label><Input value={endereco} onChange={e => setEndereco(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Cidade</Label><Input value={cidade} onChange={e => setCidade(e.target.value)} /></div>
                <div><Label>Estado</Label><Input value={estado} onChange={e => setEstado(e.target.value)} maxLength={2} /></div>
              </div>
            </div>
            <Button onClick={() => updateMutation.mutate()} disabled={!nome || !email || updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Salvar Alterações
            </Button>
          </CardContent>
        </Card>
      </div>
    </ConstutoraLayout>
  );
}
