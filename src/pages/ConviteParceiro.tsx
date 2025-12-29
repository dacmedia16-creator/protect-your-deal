import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Building2,
  User,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  Loader2,
  Send,
  AlertCircle,
  Shield,
  MapPin,
  UserPlus,
  MessageCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { validateCPF, formatCPF } from '@/lib/cpf';

interface Ficha {
  id: string;
  protocolo: string;
  imovel_endereco: string;
  imovel_tipo: string;
  data_visita: string;
  status: string;
  proprietario_nome: string | null;
  proprietario_cpf: string | null;
  proprietario_telefone: string | null;
  proprietario_confirmado_em: string | null;
  comprador_nome: string | null;
  comprador_cpf: string | null;
  comprador_telefone: string | null;
  comprador_confirmado_em: string | null;
}

export default function ConviteParceiro() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [savingData, setSavingData] = useState(false);
  
  const [conviteValido, setConviteValido] = useState(false);
  const [conviteAceito, setConviteAceito] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [parteFaltante, setParteFaltante] = useState<'proprietario' | 'comprador' | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    autopreenchimento: false,
  });

  const [lastOtpResult, setLastOtpResult] = useState<{
    simulation: boolean;
    codigo?: string;
    verification_url?: string;
  } | null>(null);

  // Check convite validity on load
  useEffect(() => {
    const checkConvite = async () => {
      if (!token) {
        setError('Token não fornecido');
        setLoading(false);
        return;
      }

      try {
        // Query convite info (public access for checking)
        const { data: convite, error: conviteError } = await supabase
          .from('convites_parceiro')
          .select('*, fichas_visita(*)')
          .eq('token', token)
          .maybeSingle();

        if (conviteError || !convite) {
          setError('Convite não encontrado');
          setLoading(false);
          return;
        }

        if (new Date(convite.expira_em) < new Date()) {
          setError('Este convite expirou');
          setLoading(false);
          return;
        }

        if (convite.status === 'aceito' && convite.corretor_parceiro_id !== user?.id) {
          setError('Este convite já foi aceito por outro corretor');
          setLoading(false);
          return;
        }

        setConviteValido(true);
        setParteFaltante(convite.parte_faltante as 'proprietario' | 'comprador');
        
        if (convite.fichas_visita) {
          setFicha(convite.fichas_visita as Ficha);
        }

        // If already accepted by this user
        if (convite.status === 'aceito' && convite.corretor_parceiro_id === user?.id) {
          setConviteAceito(true);
        }

      } catch (err) {
        console.error('Erro ao verificar convite:', err);
        setError('Erro ao verificar convite');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      if (!user) {
        // Redirect to login with return URL
        navigate(`/auth?returnUrl=/convite-parceiro/${token}`);
        return;
      }
      checkConvite();
    }
  }, [token, user, authLoading, navigate]);

  const handleAceitarConvite = async () => {
    if (!token) return;

    setAccepting(true);
    try {
      const { data, error } = await supabase.functions.invoke('aceitar-convite-parceiro', {
        body: { token },
      });

      if (error || data.error) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: data?.error || error?.message || 'Erro ao aceitar convite',
        });
        return;
      }

      setConviteAceito(true);
      setFicha(data.ficha);
      setParteFaltante(data.parte_faltante);

      toast({
        title: 'Convite aceito!',
        description: 'Agora você pode preencher os dados faltantes.',
      });

    } catch (err) {
      console.error('Erro ao aceitar convite:', err);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao aceitar convite',
      });
    } finally {
      setAccepting(false);
    }
  };

  const formatPhoneInput = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleSaveData = async () => {
    if (!ficha || !parteFaltante) return;

    // Validate
    if (!formData.telefone || formData.telefone.replace(/\D/g, '').length < 10) {
      toast({
        variant: 'destructive',
        title: 'Erro de validação',
        description: 'Telefone é obrigatório',
      });
      return;
    }

    if (!formData.autopreenchimento && (!formData.nome || formData.nome.length < 2)) {
      toast({
        variant: 'destructive',
        title: 'Erro de validação',
        description: 'Nome é obrigatório',
      });
      return;
    }

    if (formData.cpf && !validateCPF(formData.cpf)) {
      toast({
        variant: 'destructive',
        title: 'Erro de validação',
        description: 'CPF inválido',
      });
      return;
    }

    setSavingData(true);
    try {
      const updateData = parteFaltante === 'proprietario'
        ? {
            proprietario_telefone: formData.telefone.replace(/\D/g, ''),
            proprietario_nome: formData.autopreenchimento ? null : formData.nome,
            proprietario_cpf: formData.cpf || null,
            proprietario_autopreenchimento: formData.autopreenchimento,
          }
        : {
            comprador_telefone: formData.telefone.replace(/\D/g, ''),
            comprador_nome: formData.autopreenchimento ? null : formData.nome,
            comprador_cpf: formData.cpf || null,
            comprador_autopreenchimento: formData.autopreenchimento,
          };

      const { error } = await supabase
        .from('fichas_visita')
        .update(updateData)
        .eq('id', ficha.id);

      if (error) throw error;

      // Update local ficha state
      setFicha(prev => prev ? { ...prev, ...updateData } : null);

      toast({
        title: 'Dados salvos!',
        description: 'Agora você pode enviar o código de confirmação.',
      });

      // Auto-send OTP after saving
      setTimeout(() => handleSendOtp(), 500);

    } catch (err) {
      console.error('Erro ao salvar dados:', err);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao salvar os dados',
      });
    } finally {
      setSavingData(false);
    }
  };

  const handleSendOtp = async () => {
    if (!ficha || !parteFaltante) return;

    setSendingOtp(true);
    setLastOtpResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { ficha_id: ficha.id, tipo: parteFaltante, app_url: window.location.origin },
      });

      if (error || data.error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao enviar OTP',
          description: data?.error || error?.message || 'Erro desconhecido',
        });
        return;
      }

      setLastOtpResult({
        simulation: data.simulation,
        codigo: data.codigo,
        verification_url: data.verification_url,
      });

      if (data.simulation) {
        toast({
          title: 'OTP gerado (modo simulação)',
          description: `Código: ${data.codigo}`,
        });
      } else {
        toast({
          title: 'OTP enviado!',
          description: `Código enviado para ${parteFaltante === 'proprietario' ? 'o proprietário' : 'o comprador'} via WhatsApp.`,
        });
      }

    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao enviar OTP',
      });
    } finally {
      setSendingOtp(false);
    }
  };

  const openWhatsApp = () => {
    if (!ficha || !lastOtpResult || !parteFaltante) return;

    const phone = parteFaltante === 'proprietario' ? ficha.proprietario_telefone : ficha.comprador_telefone;
    const nome = parteFaltante === 'proprietario' ? ficha.proprietario_nome : ficha.comprador_nome;

    if (!phone) return;

    const message = `🏠 *VisitaSegura*\n\nOlá ${nome || ''}!\n\nVocê está confirmando uma visita ao imóvel:\n📍 ${ficha.imovel_endereco}\n\nSeu código de confirmação é:\n\n🔐 *${lastOtpResult.codigo}*\n\nOu acesse o link:\n${lastOtpResult.verification_url}\n\n⏰ Este código expira em 30 minutos.`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/55${phone}?text=${encodedMessage}`, '_blank');
  };

  // Check if data is already filled for the missing part
  const dadosJaPreenchidos = parteFaltante === 'proprietario'
    ? !!ficha?.proprietario_telefone
    : !!ficha?.comprador_telefone;

  const confirmacaoRecebida = parteFaltante === 'proprietario'
    ? !!ficha?.proprietario_confirmado_em
    : !!ficha?.comprador_confirmado_em;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 p-4">
        <div className="max-w-md text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-xl font-semibold">{error}</h1>
          <Button onClick={() => navigate('/dashboard')}>Ir para o Dashboard</Button>
        </div>
      </div>
    );
  }

  if (!conviteValido) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/fichas')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-display text-xl font-bold">Convite de Parceria</h1>
              <p className="text-sm text-muted-foreground">
                {ficha?.protocolo && `Ficha #${ficha.protocolo}`}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          {/* Ficha Info Card */}
          {ficha && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Detalhes do Imóvel</CardTitle>
                    <CardDescription>Informações da ficha de visita</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{ficha.imovel_endereco}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{ficha.imovel_tipo}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(ficha.data_visita), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Sua tarefa:</p>
                  <Badge variant="outline" className="gap-2">
                    {parteFaltante === 'proprietario' ? (
                      <>
                        <User className="h-3 w-3" />
                        Preencher dados do Proprietário
                      </>
                    ) : (
                      <>
                        <Users className="h-3 w-3" />
                        Preencher dados do Comprador
                      </>
                    )}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Accept Invite Card */}
          {!conviteAceito && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <UserPlus className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Aceitar Convite</h3>
                      <p className="text-sm text-muted-foreground">
                        Clique para aceitar e ter acesso à ficha
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleAceitarConvite}
                    disabled={accepting}
                    className="gap-2 min-w-[150px]"
                  >
                    {accepting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    Aceitar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success State - Already confirmed */}
          {conviteAceito && confirmacaoRecebida && (
            <Card className="border-success/50 bg-success/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-success" />
                  <div>
                    <h3 className="font-semibold text-success">Confirmação recebida!</h3>
                    <p className="text-sm text-muted-foreground">
                      {parteFaltante === 'proprietario' ? 'O proprietário' : 'O comprador'} já confirmou a visita.
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <Button onClick={() => navigate(`/fichas/${ficha?.id}`)} className="w-full gap-2">
                    Ver Ficha Completa
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Form to fill missing data */}
          {conviteAceito && !confirmacaoRecebida && !dadosJaPreenchidos && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    {parteFaltante === 'proprietario' ? (
                      <User className="h-5 w-5 text-primary" />
                    ) : (
                      <Users className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      Dados do {parteFaltante === 'proprietario' ? 'Proprietário' : 'Comprador'}
                    </CardTitle>
                    <CardDescription>
                      Preencha os dados para enviar o código de confirmação
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                  <Checkbox
                    id="autopreenchimento"
                    checked={formData.autopreenchimento}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        autopreenchimento: checked === true,
                        nome: checked ? '' : formData.nome,
                        cpf: checked ? '' : formData.cpf,
                      })
                    }
                  />
                  <label htmlFor="autopreenchimento" className="text-sm cursor-pointer">
                    <span className="font-medium">
                      Deixar {parteFaltante === 'proprietario' ? 'o proprietário' : 'o comprador'} preencher
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Os dados serão preenchidos ao confirmar
                    </p>
                  </label>
                </div>

                {!formData.autopreenchimento && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nome completo *</Label>
                      <Input
                        placeholder="Nome completo"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CPF</Label>
                      <Input
                        placeholder="000.000.000-00"
                        value={formData.cpf}
                        onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                        maxLength={14}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Telefone (WhatsApp) *</Label>
                  <Input
                    placeholder="(00) 00000-0000"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: formatPhoneInput(e.target.value) })}
                    maxLength={15}
                  />
                </div>

                <Button
                  onClick={handleSaveData}
                  disabled={savingData}
                  className="w-full gap-2"
                >
                  {savingData ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Salvar e Enviar OTP
                </Button>
              </CardContent>
            </Card>
          )}

          {/* OTP already sent - waiting for confirmation */}
          {conviteAceito && !confirmacaoRecebida && dadosJaPreenchidos && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Aguardando Confirmação</CardTitle>
                    <CardDescription>
                      Dados preenchidos. Aguardando {parteFaltante === 'proprietario' ? 'o proprietário' : 'o comprador'} confirmar.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleSendOtp}
                  disabled={sendingOtp}
                  className="w-full gap-2"
                  variant="outline"
                >
                  {sendingOtp ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Reenviar Código OTP
                </Button>
              </CardContent>
            </Card>
          )}

          {/* OTP Simulation Result */}
          {lastOtpResult?.simulation && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Modo Simulação</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>
                  A API do WhatsApp não está configurada. O código foi gerado mas não enviado automaticamente.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <code className="bg-muted px-2 py-1 rounded font-mono text-lg">
                    {lastOtpResult.codigo}
                  </code>
                  <Button size="sm" variant="outline" onClick={openWhatsApp} className="gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Enviar via WhatsApp
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Link to ficha */}
          {conviteAceito && (
            <Button
              variant="outline"
              onClick={() => navigate(`/fichas/${ficha?.id}`)}
              className="w-full gap-2"
            >
              <Shield className="h-4 w-4" />
              Ver Ficha Completa
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
