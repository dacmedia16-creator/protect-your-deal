import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { APP_URL } from '@/lib/appConfig';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  User,
  Users,
  Calendar,
  CheckCircle,
  Loader2,
  Send,
  AlertCircle,
  Shield,
  MapPin,
  MessageCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { validateCPF, formatCPF } from '@/lib/cpf';

interface Convite {
  id: string;
  ficha_id: string;
  token: string;
  status: string;
  parte_faltante: 'proprietario' | 'comprador';
  expira_em: string;
  permite_externo: boolean;
}

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

export default function ConviteParceiroExterno() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  
  const [convite, setConvite] = useState<Convite | null>(null);
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conviteAceito, setConviteAceito] = useState(false);
  const [dadosSalvos, setDadosSalvos] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    autopreenchimento: false,
  });

  // Dados do corretor parceiro externo
  const [parceiroData, setParceiroData] = useState({
    nome: '',
    cpf: '',
    creci: '',
    imobiliaria: '',
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
        // Fetch convite AND ficha through edge function (bypasses RLS)
        const { data: result, error: fetchError } = await supabase.functions.invoke('get-ficha-externa', {
          body: { token }
        });

        if (fetchError) {
          console.error('Erro ao buscar convite:', fetchError);
          setError('Erro ao carregar convite');
          setLoading(false);
          return;
        }

        if (result?.error) {
          setError(result.error);
          setLoading(false);
          return;
        }

        const conviteData = result.convite;
        const fichaData = result.ficha;

        // Check if external access is allowed
        if (!conviteData.permite_externo) {
          navigate(`/convite-parceiro/${token}`);
          return;
        }

        if (new Date(conviteData.expira_em) < new Date()) {
          setError('Este convite expirou');
          setLoading(false);
          return;
        }

        if (conviteData.status === 'aceito') {
          setConviteAceito(true);
        }

        setConvite(conviteData as Convite);
        setFicha(fichaData as Ficha);

        // Check if data is already filled
        if (conviteData.status === 'aceito') {
          const parteFaltante = conviteData.parte_faltante as 'proprietario' | 'comprador';
          const telefonePreenchido = parteFaltante === 'proprietario' 
            ? fichaData.proprietario_telefone 
            : fichaData.comprador_telefone;
          
          if (telefonePreenchido) {
            setDadosSalvos(true);
          }
        }

      } catch (err) {
        console.error('Erro ao verificar convite:', err);
        setError('Erro ao verificar convite');
      } finally {
        setLoading(false);
      }
    };

    checkConvite();
  }, [token, navigate]);

  const formatPhoneInput = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleAceitarEPreencher = async () => {
    if (!token || !convite) return;

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

    setProcessing(true);
    try {
      // Call edge function to accept invite and save data
      const { data, error } = await supabase.functions.invoke('aceitar-convite-externo', {
        body: {
          token,
          dados: {
            nome: formData.autopreenchimento ? null : formData.nome,
            cpf: formData.cpf || null,
            telefone: formData.telefone.replace(/\D/g, ''),
            autopreenchimento: formData.autopreenchimento,
          },
          // Dados do corretor parceiro externo
          parceiro_nome: parceiroData.nome || undefined,
          parceiro_cpf: parceiroData.cpf || undefined,
          parceiro_creci: parceiroData.creci || undefined,
          parceiro_imobiliaria: parceiroData.imobiliaria || undefined,
        }
      });

      if (error || data?.error) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: data?.error || error?.message || 'Erro ao processar convite',
        });
        return;
      }

      setConviteAceito(true);
      setDadosSalvos(true);
      setFicha(data.ficha);

      toast({
        title: 'Dados salvos!',
        description: 'Enviando código de confirmação...',
      });

      // Send OTP
      await handleSendOtp(data.ficha);

    } catch (err) {
      console.error('Erro ao processar:', err);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro inesperado ao processar',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleSendOtp = async (fichaData?: Ficha) => {
    const currentFicha = fichaData || ficha;
    if (!currentFicha || !convite) return;

    setSendingOtp(true);
    setLastOtpResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { 
          ficha_id: currentFicha.id, 
          tipo: convite.parte_faltante, 
          app_url: APP_URL 
        },
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
          description: `Código enviado para ${convite.parte_faltante === 'proprietario' ? 'o proprietário' : 'o comprador'} via WhatsApp.`,
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
    if (!ficha || !lastOtpResult || !convite) return;

    const phone = convite.parte_faltante === 'proprietario' ? ficha.proprietario_telefone : ficha.comprador_telefone;
    const nome = convite.parte_faltante === 'proprietario' ? ficha.proprietario_nome : ficha.comprador_nome;

    if (!phone) return;

    const message = `🏠 *VisitaProva*\n\nOlá ${nome || ''}!\n\nVocê está confirmando uma visita ao imóvel:\n📍 ${ficha.imovel_endereco}\n\nSeu código de confirmação é:\n\n🔐 *${lastOtpResult.codigo}*\n\nOu acesse o link:\n${lastOtpResult.verification_url}\n\n⏰ Este código expira em 30 minutos.`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/55${phone}?text=${encodedMessage}`, '_blank');
  };

  // Check confirmation status
  const confirmacaoRecebida = convite?.parte_faltante === 'proprietario'
    ? !!ficha?.proprietario_confirmado_em
    : !!ficha?.comprador_confirmado_em;

  if (loading) {
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
          <p className="text-muted-foreground">
            Se você precisar de acesso, entre em contato com o corretor que enviou o convite.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold">VisitaProva</h1>
              <p className="text-sm text-muted-foreground">
                Convite de Parceria
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
                    <CardDescription>Registro #{ficha.protocolo}</CardDescription>
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
                    {convite?.parte_faltante === 'proprietario' ? (
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

          {/* Confirmation received */}
          {confirmacaoRecebida && (
            <Card className="border-success/50 bg-success/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-success">
                  <CheckCircle className="h-6 w-6" />
                  <div>
                    <h3 className="font-semibold">Confirmação Recebida!</h3>
                    <p className="text-sm text-muted-foreground">
                      O {convite?.parte_faltante} já confirmou a visita. A ficha está completa.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data already saved - show OTP section */}
          {dadosSalvos && !confirmacaoRecebida && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="font-semibold">Dados Preenchidos</h3>
                    <p className="text-sm text-muted-foreground">
                      Agora é só aguardar a confirmação do {convite?.parte_faltante} via WhatsApp.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => handleSendOtp()}
                  disabled={sendingOtp}
                  className="gap-2 w-full"
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

          {/* OTP Result */}
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
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={openWhatsApp}
                    className="gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Enviar via WhatsApp
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Form to fill data - only show if not yet saved */}
          {!dadosSalvos && !confirmacaoRecebida && convite && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Preencher Dados do {convite.parte_faltante === 'proprietario' ? 'Proprietário' : 'Comprador'}
                </CardTitle>
                <CardDescription>
                  Preencha os dados abaixo para enviar o código de confirmação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Dados do Corretor Parceiro (você) */}
                <div className="space-y-4 pb-4 border-b">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium">Seus Dados como Corretor <span className="text-xs text-muted-foreground">(opcional)</span></h3>
                  </div>
                  <p className="text-xs text-muted-foreground -mt-2">
                    Identifique-se para que seus dados fiquem registrados na ficha
                  </p>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Seu Nome</Label>
                      <Input
                        placeholder="Seu nome completo"
                        value={parceiroData.nome}
                        onChange={(e) => setParceiroData({ ...parceiroData, nome: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Seu CPF</Label>
                      <Input
                        placeholder="000.000.000-00"
                        value={parceiroData.cpf}
                        onChange={(e) => setParceiroData({ ...parceiroData, cpf: formatCPF(e.target.value) })}
                        maxLength={14}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Seu CRECI</Label>
                      <Input
                        placeholder="Ex: 12345-F"
                        value={parceiroData.creci}
                        onChange={(e) => setParceiroData({ ...parceiroData, creci: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-3">
                      <Label>Sua Imobiliária</Label>
                      <Input
                        placeholder="Nome da sua imobiliária"
                        value={parceiroData.imobiliaria}
                        onChange={(e) => setParceiroData({ ...parceiroData, imobiliaria: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Dados do Proprietário/Comprador */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {convite.parte_faltante === 'proprietario' ? (
                      <User className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Users className="h-4 w-4 text-muted-foreground" />
                    )}
                    <h3 className="font-medium">
                      Dados do {convite.parte_faltante === 'proprietario' ? 'Proprietário' : 'Comprador'}
                    </h3>
                  </div>

                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                  <Checkbox 
                    id="autopreenchimento"
                    checked={formData.autopreenchimento}
                    onCheckedChange={(checked) => setFormData({ 
                      ...formData, 
                      autopreenchimento: checked === true,
                      nome: checked ? '' : formData.nome,
                      cpf: checked ? '' : formData.cpf
                    })}
                  />
                  <label htmlFor="autopreenchimento" className="text-sm cursor-pointer">
                    <span className="font-medium">
                      Deixar {convite.parte_faltante === 'proprietario' ? 'o proprietário' : 'o comprador'} preencher
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {convite.parte_faltante === 'proprietario' ? 'O proprietário' : 'O comprador'} preencherá nome e CPF ao confirmar
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
                  <p className="text-xs text-muted-foreground">
                    O código de confirmação será enviado para este número
                  </p>
                </div>

                <Button 
                  onClick={handleAceitarEPreencher}
                  disabled={processing}
                  className="gap-2 w-full"
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Salvar e Enviar Confirmação
                </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info card */}
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Sobre o VisitaProva</p>
                  <p>
                    Esta ficha digital substitui a antiga ficha de papel com a mesma validade jurídica. 
                    Todas as confirmações são registradas com data, hora e localização para sua proteção.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
