import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Loader2, Save, User, CheckCircle2, AlertCircle, Bell, Volume2, VolumeX, Smartphone, Download, Check, RefreshCw, Info, Lock, KeyRound, HelpCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { usePWAInstall } from '@/hooks/usePWAInstall';
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
import { formatCPF, validateCPF } from '@/lib/cpf';
import { forceAppRefresh, getAppExecutionModeLabel, getBuildVersion } from '@/lib/forceAppRefresh';
import { PasswordInput } from '@/components/PasswordInput';
import { getPasswordStrength } from '@/lib/password';

interface Profile {
  id: string;
  user_id: string;
  nome: string;
  creci: string | null;
  telefone: string | null;
  cpf: string | null;
  email: string | null;
  foto_url: string | null;
  imobiliaria: string | null;
}

export default function Perfil() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { soundEnabled, toggleSound } = useNotificationSettings();
  const { playNotificationSound } = useNotificationSound();
  const { isInstalled, isIOS, install } = usePWAInstall();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Password change states
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  
  const handleInstallApp = async () => {
    if (isIOS) {
      navigate('/instalar');
    } else {
      const success = await install();
      if (!success) {
        navigate('/instalar');
      }
    }
  };

  const handleForceRefresh = async () => {
    setRefreshing(true);
    toast.info('Atualizando app...');
    await forceAppRefresh();
  };

  const handleChangePassword = async () => {
    if (!user?.email) {
      toast.error('Erro ao identificar usuário');
      return;
    }

    if (novaSenha.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      toast.error('As senhas não coincidem');
      return;
    }

    setChangingPassword(true);

    try {
      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: senhaAtual,
      });

      if (signInError) {
        toast.error('Senha atual incorreta');
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: novaSenha,
      });

      if (updateError) {
        throw updateError;
      }

      toast.success('Senha alterada com sucesso!');
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      setIsChangingPassword(false);
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      toast.error('Erro ao alterar senha');
    } finally {
      setChangingPassword(false);
    }
  };

  const [nome, setNome] = useState('');
  const [creci, setCreci] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [imobiliaria, setImobiliaria] = useState('');


  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelefone(formatPhone(e.target.value));
  };
  
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
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
      setCpf(formatCPF(data.cpf || ''));
      setEmail(data.email || user!.email || '');
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
          cpf: cpf.replace(/\D/g, '') || null,
          email: email.trim() || null,
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
              <Label htmlFor="cpf">CPF</Label>
              <div className="relative">
                <Input
                  id="cpf"
                  type="text"
                  inputMode="numeric"
                  value={cpf}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className={cpf.length > 0 ? (validateCPF(cpf) ? 'border-green-500 pr-10' : 'border-destructive pr-10') : ''}
                />
                {cpf.length > 0 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {validateCPF(cpf) ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                )}
              </div>
              {cpf.length > 0 && !validateCPF(cpf) && (
                <p className="text-xs text-destructive">CPF inválido</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
              />
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

        {/* Security Card - Password Change */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Segurança
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsChangingPassword(!isChangingPassword);
                  if (isChangingPassword) {
                    setSenhaAtual('');
                    setNovaSenha('');
                    setConfirmarSenha('');
                  }
                }}
              >
                {isChangingPassword ? 'Cancelar' : 'Alterar Senha'}
              </Button>
            </CardTitle>
          </CardHeader>

          {isChangingPassword && (
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="senhaAtual">Senha Atual</Label>
                <PasswordInput
                  value={senhaAtual}
                  onChange={setSenhaAtual}
                  placeholder="Digite sua senha atual"
                  showGenerator={false}
                  showStrength={false}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="novaSenha">Nova Senha</Label>
                <PasswordInput
                  value={novaSenha}
                  onChange={setNovaSenha}
                  placeholder="Mínimo 6 caracteres"
                  showGenerator={true}
                  showStrength={true}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                <PasswordInput
                  value={confirmarSenha}
                  onChange={setConfirmarSenha}
                  placeholder="Repita a nova senha"
                  showGenerator={false}
                  showStrength={false}
                />
                {confirmarSenha && novaSenha !== confirmarSenha && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    As senhas não coincidem
                  </p>
                )}
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={changingPassword || !senhaAtual || !novaSenha || !confirmarSenha || novaSenha !== confirmarSenha}
                className="w-full"
              >
                {changingPassword ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <KeyRound className="h-4 w-4 mr-2" />
                )}
                Salvar Nova Senha
              </Button>
            </CardContent>
          )}
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
          <CardContent className="space-y-4">
            {/* Diagnóstico do app */}
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Modo:</span>
                <span className="font-medium">{getAppExecutionModeLabel()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Versão:</span>
                <span className="font-mono text-xs">{getBuildVersion()}</span>
              </div>
            </div>

            {/* Status de instalação */}
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
                <Button onClick={handleInstallApp} size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Instalar
                </Button>
              </div>
            )}

            {/* Botão de forçar atualização */}
            <div className="pt-2 border-t">
              <Button 
                variant="outline" 
                className="w-full gap-2" 
                onClick={handleForceRefresh}
                disabled={refreshing}
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Forçar atualização do app
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Limpa cache e recarrega a versão mais recente
              </p>
            </div>
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
