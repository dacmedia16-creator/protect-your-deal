import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Loader2, Save, User, CheckCircle2, AlertCircle, Bell, Volume2, VolumeX, Smartphone, Download, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { usePWAInstallContext } from '@/contexts/PWAInstallContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { MobileNav } from '@/components/MobileNav';
import { ThemeToggle } from '@/components/ThemeToggle';
import { toast } from 'sonner';
import { formatPhone, unformatPhone, isValidPhone } from '@/lib/phone';

interface Profile {
  id: string;
  user_id: string;
  nome: string;
  creci: string | null;
  telefone: string | null;
  foto_url: string | null;
  imobiliaria: string | null;
}

export default function Perfil() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { soundEnabled, toggleSound } = useNotificationSettings();
  const { playNotificationSound } = useNotificationSound();
  const { isInstalled } = usePWAInstall();
  const { showInstallPrompt } = usePWAInstallContext();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [nome, setNome] = useState('');
  const [creci, setCreci] = useState('');
  const [telefone, setTelefone] = useState('');
  const [imobiliaria, setImobiliaria] = useState('');


  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelefone(formatPhone(e.target.value));
  };
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setNome(data.nome || '');
      setCreci(data.creci || '');
      setTelefone(formatPhone(data.telefone || ''));
      setImobiliaria(data.imobiliaria || '');
      setFotoUrl(data.foto_url);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      toast.error('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

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

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ foto_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setFotoUrl(publicUrl);
      toast.success('Foto atualizada com sucesso');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload da foto');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nome: nome.trim(),
          creci: creci.trim() || null,
          telefone: unformatPhone(telefone) || null,
          imobiliaria: imobiliaria.trim() || null,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Perfil atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-sm safe-area-top">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-display font-semibold text-lg">Meu Perfil</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Avatar Section */}
        <Card>
          <CardContent className="flex flex-col items-center py-8">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={fotoUrl || undefined} alt={nome} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {nome.charAt(0).toUpperCase() || <User className="h-10 w-10" />}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="photo-upload"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-md hover:bg-primary/90 transition-colors"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
                disabled={uploading}
              />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Toque na câmera para alterar a foto
            </p>
          </CardContent>
        </Card>

        {/* Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="creci">CRECI</Label>
              <Input
                id="creci"
                value={creci}
                onChange={(e) => setCreci(e.target.value)}
                placeholder="Ex: 12345-F"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <div className="relative">
                <Input
                  id="telefone"
                  type="tel"
                  value={telefone}
                  onChange={handleTelefoneChange}
                  placeholder="(00) 00000-0000"
                  className={telefone.length > 0 ? (isValidPhone(telefone) ? 'border-green-500 pr-10' : 'border-destructive pr-10') : ''}
                />
                {telefone.length > 0 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isValidPhone(telefone) ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                )}
              </div>
              {telefone.length > 0 && !isValidPhone(telefone) && (
                <p className="text-xs text-destructive">Mínimo 10 dígitos</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="imobiliaria">Imobiliária</Label>
              <Input
                id="imobiliaria"
                value={imobiliaria}
                onChange={(e) => setImobiliaria(e.target.value)}
                placeholder="Nome da imobiliária"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {soundEnabled ? (
                  <Volume2 className="h-5 w-5 text-primary" />
                ) : (
                  <VolumeX className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">Som de notificação</p>
                  <p className="text-sm text-muted-foreground">
                    Tocar som ao receber confirmações
                  </p>
                </div>
              </div>
              <Switch
                checked={soundEnabled}
                onCheckedChange={() => {
                  toggleSound();
                  if (!soundEnabled) {
                    // Play a test sound when enabling
                    setTimeout(() => playNotificationSound('success'), 100);
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Aparência</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Modo escuro</p>
                <p className="text-sm text-muted-foreground">
                  Alterne entre tema claro e escuro
                </p>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        {/* App Installation Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Aplicativo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isInstalled ? (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-600">App instalado</p>
                  <p className="text-sm text-muted-foreground">
                    Você está usando o app instalado
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Instalar app</p>
                  <p className="text-sm text-muted-foreground">
                    Acesse rapidamente pela tela inicial
                  </p>
                </div>
                <Button onClick={showInstallPrompt} size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Instalar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving || !nome.trim()}
          className="w-full h-12"
        >
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <Save className="h-5 w-5 mr-2" />
          )}
          Salvar Alterações
        </Button>
      </main>

      <MobileNav />
    </div>
  );
}
