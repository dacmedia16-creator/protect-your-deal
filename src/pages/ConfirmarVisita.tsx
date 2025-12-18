import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Shield, Building2, Calendar, CheckCircle, AlertCircle, Loader2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FichaInfo {
  protocolo: string;
  imovel_endereco: string;
  imovel_tipo: string;
  data_visita: string;
  proprietario_nome: string;
  comprador_nome: string;
  status: string;
}

interface OtpInfo {
  tipo: 'proprietario' | 'comprador';
  confirmado: boolean;
  expira_em?: string;
}

export default function ConfirmarVisita() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [alreadyConfirmed, setAlreadyConfirmed] = useState(false);
  const [expired, setExpired] = useState(false);
  const [ficha, setFicha] = useState<FichaInfo | null>(null);
  const [otpInfo, setOtpInfo] = useState<OtpInfo | null>(null);

  useEffect(() => {
    async function loadOtpInfo() {
      if (!token) {
        setError('Link inválido');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('get-otp-info', {
          body: { token },
        });

        if (error || !data.valid) {
          setError(data?.error || 'Link inválido ou expirado');
          setLoading(false);
          return;
        }

        if (data.already_confirmed) {
          setAlreadyConfirmed(true);
        }

        if (data.expired) {
          setExpired(true);
        }

        setFicha(data.ficha);
        setOtpInfo(data.otp);
      } catch (err) {
        setError('Erro ao carregar informações');
      } finally {
        setLoading(false);
      }
    }

    loadOtpInfo();
  }, [token]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (codigo.length !== 6) {
      toast({
        variant: 'destructive',
        title: 'Código inválido',
        description: 'O código deve ter 6 dígitos',
      });
      return;
    }

    setVerifying(true);

    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { token, codigo },
      });

      if (error || data.error) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: data?.error || 'Erro ao verificar código',
        });

        if (data?.already_confirmed) {
          setAlreadyConfirmed(true);
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
        description: 'Erro ao verificar código',
      });
    } finally {
      setVerifying(false);
    }
  };

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
        {error ? (
          <Card className="w-full border-destructive/50">
            <CardContent className="pt-6 text-center">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="font-display text-xl font-bold mb-2">Link inválido</h2>
              <p className="text-muted-foreground">{error}</p>
            </CardContent>
          </Card>
        ) : expired ? (
          <Card className="w-full border-warning/50">
            <CardContent className="pt-6 text-center">
              <div className="h-16 w-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-warning" />
              </div>
              <h2 className="font-display text-xl font-bold mb-2">Código expirado</h2>
              <p className="text-muted-foreground">
                O código de confirmação expirou. Solicite um novo código ao corretor.
              </p>
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
                    Ficha #{ficha.protocolo}
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
                    Ficha #{ficha.protocolo}
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
                </div>
              )}

              {/* OTP Form */}
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Digite o código de 6 dígitos</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                    className="text-center text-2xl tracking-widest font-mono"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    O código foi enviado para seu WhatsApp
                  </p>
                </div>
                
                <Button type="submit" className="w-full" disabled={verifying || codigo.length !== 6}>
                  {verifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Verificando...
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
