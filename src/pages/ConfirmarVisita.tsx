import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { APP_URL } from '@/lib/appConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Shield, Building2, Calendar, CheckCircle, AlertCircle, Loader2, XCircle, RefreshCw, MapPin, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { validateCPF, formatCPF } from '@/lib/cpf';
import { invokeWithRetry } from '@/lib/invokeWithRetry';

interface FichaInfo {
  protocolo: string;
  imovel_endereco: string;
  imovel_tipo: string;
  data_visita: string;
  proprietario_nome: string | null;
  comprador_nome: string | null;
  proprietario_autopreenchimento?: boolean;
  comprador_autopreenchimento?: boolean;
  status: string;
  ficha_id?: string;
  corretor_nome?: string | null;
  corretor_creci?: string | null;
}

interface OtpInfo {
  tipo: 'proprietario' | 'comprador';
  confirmado: boolean;
  expira_em?: string;
  ficha_id?: string;
  tentativas?: number;
  max_tentativas?: number;
}

export default function ConfirmarVisita() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [alreadyConfirmed, setAlreadyConfirmed] = useState(false);
  const [expired, setExpired] = useState(false);
  const [ficha, setFicha] = useState<FichaInfo | null>(null);
  const [otpInfo, setOtpInfo] = useState<OtpInfo | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [tentativasRestantes, setTentativasRestantes] = useState<number>(5);

  // Legal acceptance fields
  const [aceiteLegal, setAceiteLegal] = useState(false);
  const [aceiteNome, setAceiteNome] = useState('');
  const [aceiteCpf, setAceiteCpf] = useState('');
  const [captandoLocalizacao, setCaptandoLocalizacao] = useState(false);

  const MAX_AUTO_RETRIES = 3;
  const RETRY_DELAY_MS = 1500;

  const loadOtpInfo = async (attempt = 1): Promise<void> => {
    if (!token) {
      setError('Link inválido');
      setLoading(false);
      return;
    }

    setConnectionError(false);
    setError(null);

    try {
      const { data, error } = await invokeWithRetry<{
        valid: boolean;
        error?: string;
        already_confirmed?: boolean;
        expired?: boolean;
        max_attempts_exceeded?: boolean;
        ficha?: FichaInfo;
        otp?: OtpInfo;
      }>('get-otp-info', {
        body: { token },
      });

      // SEMPRE salvar os dados quando disponíveis (mesmo se expirado/inválido)
      if (data?.ficha) setFicha(data.ficha);
      if (data?.otp) setOtpInfo(data.otp);
      
      // Set initial remaining attempts
      if (data?.otp?.tentativas !== undefined && data?.otp?.max_tentativas !== undefined) {
        setTentativasRestantes(data.otp.max_tentativas - data.otp.tentativas);
      }

      // Servidor respondeu com erro de validação (token inválido)
      if (data?.error && data?.valid === false && !data?.expired && !data?.already_confirmed) {
        setError(data.error);
        setLoading(false);
        return;
      }

      // Erro de rede real (não conseguiu conectar ao servidor)
      if (error && !data) {
        // Retry automático se ainda não atingiu o máximo
        if (attempt < MAX_AUTO_RETRIES) {
          console.log(`Tentativa ${attempt}/${MAX_AUTO_RETRIES} falhou, tentando novamente em ${RETRY_DELAY_MS}ms...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
          return loadOtpInfo(attempt + 1);
        }
        setConnectionError(true);
        setLoading(false);
        return;
      }

      // Já confirmado anteriormente
      if (data?.already_confirmed) {
        setAlreadyConfirmed(true);
      }

      // Código expirado ou tentativas esgotadas
      if (data?.expired || data?.max_attempts_exceeded) {
        setExpired(true);
      }
    } catch (err) {
      // Retry automático em caso de exceção
      if (attempt < MAX_AUTO_RETRIES) {
        console.log(`Tentativa ${attempt}/${MAX_AUTO_RETRIES} falhou com exceção, tentando novamente...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        return loadOtpInfo(attempt + 1);
      }
      setConnectionError(true);
    } finally {
      if (attempt >= MAX_AUTO_RETRIES || !connectionError) {
        setLoading(false);
        setRetrying(false);
      }
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    setLoading(true);
    await loadOtpInfo(1);
  };

  useEffect(() => {
    loadOtpInfo(1);
  }, [token]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate OTP code
    if (codigo.length !== 6) {
      toast({
        variant: 'destructive',
        title: 'Código inválido',
        description: 'O código deve ter 6 dígitos',
      });
      return;
    }

    // Validate legal acceptance
    if (!aceiteLegal) {
      toast({
        variant: 'destructive',
        title: 'Aceite obrigatório',
        description: 'Você deve aceitar a declaração para continuar',
      });
      return;
    }

    // Validate name
    if (aceiteNome.trim().length < 3) {
      toast({
        variant: 'destructive',
        title: 'Nome inválido',
        description: 'Digite seu nome completo',
      });
      return;
    }

    // Validate CPF with digit verification
    if (!validateCPF(aceiteCpf)) {
      toast({
        variant: 'destructive',
        title: 'CPF inválido',
        description: 'O CPF informado é inválido. Verifique os dígitos.',
      });
      return;
    }

    setVerifying(true);
    setCaptandoLocalizacao(true);

    // Try to get geolocation (optional)
    let latitude: number | null = null;
    let longitude: number | null = null;

    try {
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      }
    } catch (geoError) {
      // Geolocation is optional, continue without it
      console.log('Geolocation not available or denied');
    }

    setCaptandoLocalizacao(false);

    try {
      // Use retry for verify-otp
      const { data, error } = await invokeWithRetry<{
        error?: string;
        already_confirmed?: boolean;
        expired?: boolean;
        success?: boolean;
      }>('verify-otp', {
        body: { 
          token, 
          codigo,
          aceite_legal: aceiteLegal,
          aceite_nome: aceiteNome.trim(),
          aceite_cpf: aceiteCpf.replace(/\D/g, ''),
          aceite_latitude: latitude,
          aceite_longitude: longitude,
          aceite_user_agent: navigator.userAgent
        },
      });

      // Erro de rede real (não conseguiu conectar ao servidor)
      if (error && !data) {
        toast({
          variant: 'destructive',
          title: 'Erro de conexão',
          description: 'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.',
        });
        setVerifying(false);
        return;
      }

      // Erro retornado pelo servidor (conseguiu conectar, mas houve erro de validação)
      if (data?.error) {
        // Update remaining attempts if returned
        if (typeof (data as any).tentativas_restantes === 'number') {
          setTentativasRestantes((data as any).tentativas_restantes);
        }
        
        // Verificar se é erro de tentativas excedidas
        const errorLower = data.error.toLowerCase();
        if (errorLower.includes('tentativas') && (errorLower.includes('esgotadas') || errorLower.includes('excedido') || errorLower.includes('máximo'))) {
          setExpired(true); // Reutiliza expired para mostrar opção de reenvio
          setTentativasRestantes(0);
          toast({
            variant: 'destructive',
            title: 'Tentativas esgotadas',
            description: 'Você excedeu o número de tentativas. Solicite um novo código.',
          });
        } else if (data.already_confirmed) {
          setAlreadyConfirmed(true);
          toast({
            title: 'Já confirmado',
            description: 'Esta visita já foi confirmada anteriormente.',
          });
        } else if (data.expired) {
          setExpired(true);
          toast({
            variant: 'destructive',
            title: 'Código expirado',
            description: 'O código expirou. Solicite um novo código.',
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Código incorreto',
            description: data.error,
          });
        }
        setVerifying(false);
        return;
      }

      setSuccess(true);
      toast({
        title: 'Sucesso!',
        description: 'Visita confirmada com sucesso!',
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao verificar código. Tente novamente.',
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!otpInfo?.ficha_id || !otpInfo?.tipo) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Informações insuficientes para reenviar o código',
      });
      return;
    }

    setResending(true);

    try {
      // Use retry for resend
      const { data, error } = await invokeWithRetry<{
        error?: string;
        success?: boolean;
      }>('send-otp', {
        body: { 
          ficha_id: otpInfo.ficha_id, 
          tipo: otpInfo.tipo,
          app_url: APP_URL
        },
      });

      if (error || data?.error) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: data?.error || 'Erro ao reenviar código. Tente novamente.',
        });
        return;
      }

      setResendSuccess(true);
      setExpired(false);
      setCodigo('');
      setTentativasRestantes(5); // Reset attempt counter
      toast({
        title: 'Código reenviado!',
        description: 'Um novo código foi enviado para seu WhatsApp',
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao reenviar código. Tente novamente.',
      });
    } finally {
      setResending(false);
    }
  };

  // Form validation state
  const isFormValid = codigo.length === 6 && aceiteLegal && aceiteNome.trim().length >= 3 && validateCPF(aceiteCpf);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card py-4">
        <div className="container mx-auto px-4 flex items-center justify-center gap-3">
          <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold">VisitaSegura</span>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-md flex items-center justify-center">
        {connectionError ? (
          <Card className="w-full border-warning/50">
            <CardContent className="pt-6 text-center">
              <div className="h-16 w-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-warning" />
              </div>
              <h2 className="font-display text-xl font-bold mb-2">Erro de conexão</h2>
              <p className="text-muted-foreground mb-4">
                Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.
              </p>
              <Button 
                onClick={handleRetry} 
                disabled={retrying}
                className="w-full"
              >
                {retrying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Tentando novamente...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar novamente
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="w-full border-destructive/50">
            <CardContent className="pt-6 text-center">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="font-display text-xl font-bold mb-2">Link inválido</h2>
              <p className="text-muted-foreground">{error}</p>
            </CardContent>
          </Card>
        ) : expired && !resendSuccess ? (
          <Card className="w-full border-warning/50">
            <CardContent className="pt-6 text-center">
              <div className="h-16 w-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-warning" />
              </div>
              <h2 className="font-display text-xl font-bold mb-2">Código expirado</h2>
              <p className="text-muted-foreground mb-4">
                O código de confirmação expirou.
              </p>
              <Button 
                onClick={handleResendOtp} 
                disabled={resending}
                variant="outline"
                className="w-full"
              >
                {resending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Reenviando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reenviar código por WhatsApp
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : alreadyConfirmed || success ? (
          <Card className="w-full border-success/50 bg-success/5">
            <CardContent className="pt-6 text-center">
              <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <h2 className="font-display text-xl font-bold mb-2 text-success">
                {success ? 'Confirmado!' : 'Já confirmado'}
              </h2>
              <p className="text-muted-foreground mb-6">
                {success 
                  ? 'Sua confirmação foi registrada com sucesso.' 
                  : 'Esta visita já foi confirmada anteriormente.'}
              </p>

              {ficha && (
                <div className="text-left space-y-3 p-4 rounded-lg bg-card border">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <Building2 className="h-4 w-4" />
                    Registro #{ficha.protocolo}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Imóvel</p>
                    <p className="text-sm font-medium">{ficha.imovel_endereco}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Data da Visita</p>
                    <p className="text-sm font-medium">
                      {format(new Date(ficha.data_visita), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full">
            <CardHeader className="text-center">
              <CardTitle className="font-display text-xl">Confirmar Visita</CardTitle>
              <CardDescription>
                {otpInfo?.tipo === 'proprietario' 
                  ? 'Confirme que você autorizou esta visita ao seu imóvel'
                  : 'Confirme sua visita ao imóvel'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Ficha Info */}
              {ficha && (
                <div className="space-y-3 p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <Building2 className="h-4 w-4" />
                    Registro #{ficha.protocolo}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Imóvel</p>
                    <p className="text-sm font-medium">{ficha.imovel_endereco}</p>
                    <p className="text-xs text-muted-foreground">{ficha.imovel_tipo}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {format(new Date(ficha.data_visita), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </div>
                  {ficha.corretor_nome && (
                    <div>
                      <p className="text-xs text-muted-foreground">Corretor</p>
                      <p className="text-sm font-medium">{ficha.corretor_nome}</p>
                      {ficha.corretor_creci && (
                        <p className="text-xs text-muted-foreground">CRECI: {ficha.corretor_creci}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* OTP Form */}
              <form onSubmit={handleVerify} className="space-y-6">
                {/* OTP Code */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Digite o código de 6 dígitos</label>
                    {tentativasRestantes < 5 && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        tentativasRestantes <= 1 
                          ? 'bg-destructive/10 text-destructive' 
                          : tentativasRestantes <= 2 
                            ? 'bg-warning/10 text-warning' 
                            : 'bg-muted text-muted-foreground'
                      }`}>
                        {tentativasRestantes} {tentativasRestantes === 1 ? 'tentativa restante' : 'tentativas restantes'}
                      </span>
                    )}
                  </div>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                    className={`text-center text-2xl tracking-widest font-mono ${
                      tentativasRestantes <= 1 ? 'border-destructive focus-visible:ring-destructive' : ''
                    }`}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    O código foi enviado para seu WhatsApp
                  </p>
                </div>

                {/* Digital Signature Section */}
                <div className="space-y-4 p-4 rounded-lg bg-muted/30 border">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4 text-primary" />
                    Assinatura Digital
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nome completo</label>
                      <Input
                        type="text"
                        placeholder="Digite seu nome completo"
                        value={aceiteNome}
                        onChange={(e) => setAceiteNome(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">CPF</label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="000.000.000-00"
                        value={aceiteCpf}
                        onChange={(e) => setAceiteCpf(formatCPF(e.target.value))}
                        maxLength={14}
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Legal Acceptance */}
                <div className="flex items-start gap-3 p-4 rounded-lg border bg-primary/5">
                  <Checkbox 
                    id="aceite-legal"
                    checked={aceiteLegal}
                    onCheckedChange={(checked) => setAceiteLegal(checked === true)}
                    className="mt-0.5"
                  />
                <label htmlFor="aceite-legal" className="text-sm leading-relaxed cursor-pointer">
                    {otpInfo?.tipo === 'proprietario' 
                      ? 'Declaro que autorizei a visita ao meu imóvel por intermédio do corretor acima identificado.'
                      : 'Declaro que fui apresentado ao imóvel por intermédio do corretor acima identificado.'}
                  </label>
                </div>

                {/* Geolocation Notice */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 rounded-lg bg-muted/50">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span>
                    Sua localização e IP serão registrados para fins de segurança jurídica.
                  </span>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={verifying || !isFormValid}
                >
                  {verifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {captandoLocalizacao ? 'Capturando localização...' : 'Verificando...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirmar Visita
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 border-t text-center text-sm text-muted-foreground">
        © 2024 VisitaSegura
      </footer>
    </div>
  );
}
