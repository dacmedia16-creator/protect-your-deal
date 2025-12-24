import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Building2, 
  User, 
  Users, 
  Calendar, 
  CheckCircle,
  Clock,
  Copy,
  Loader2,
  Send,
  MessageCircle,
  AlertCircle,
  FileDown,
  Shield,
  MapPin,
  Fingerprint
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
  pendente: { label: 'Pendente', variant: 'secondary', icon: Clock },
  aguardando_comprador: { label: 'Aguardando Comprador', variant: 'outline', icon: Clock },
  aguardando_proprietario: { label: 'Aguardando Proprietário', variant: 'outline', icon: Clock },
  completo: { label: 'Confirmado', variant: 'default', icon: CheckCircle },
  expirado: { label: 'Expirado', variant: 'destructive', icon: Clock },
};

export default function DetalhesFicha() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [sendingOtp, setSendingOtp] = useState<'proprietario' | 'comprador' | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [lastOtpResult, setLastOtpResult] = useState<{
    tipo: string;
    simulation: boolean;
    codigo?: string;
    verification_url?: string;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const { data: ficha, isLoading, refetch } = useQuery({
    queryKey: ['ficha', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('fichas_visita')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });

  // Fetch legal acceptance data
  const { data: confirmacoes } = useQuery({
    queryKey: ['confirmacoes', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('confirmacoes_otp')
        .select('*')
        .eq('ficha_id', id)
        .eq('confirmado', true);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id && ficha?.status === 'completo',
  });

  const confirmacaoProprietario = confirmacoes?.find(c => c.tipo === 'proprietario');
  const confirmacaoComprador = confirmacoes?.find(c => c.tipo === 'comprador');

  const formatPhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length === 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }
    return phone;
  };

  const formatCPF = (cpf: string | null) => {
    if (!cpf) return '-';
    const numbers = cpf.replace(/\D/g, '');
    if (numbers.length === 11) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
    }
    return cpf;
  };

  const copyProtocolo = () => {
    if (ficha?.protocolo) {
      navigator.clipboard.writeText(ficha.protocolo);
      toast({
        title: 'Protocolo copiado!',
        description: ficha.protocolo,
      });
    }
  };

  const sendOtp = async (tipo: 'proprietario' | 'comprador') => {
    if (!ficha) return;
    
    setSendingOtp(tipo);
    setLastOtpResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { ficha_id: ficha.id, tipo, app_url: window.location.origin },
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
        tipo,
        simulation: data.simulation,
        codigo: data.codigo,
        verification_url: data.verification_url,
      });

      if (data.simulation) {
        toast({
          title: 'OTP gerado (modo simulação)',
          description: `Código: ${data.codigo}. Configure a API do WhatsApp para envio real.`,
        });
      } else {
        toast({
          title: 'OTP enviado!',
          description: `Código enviado para ${tipo === 'proprietario' ? 'o proprietário' : 'o comprador'} via WhatsApp.`,
        });
      }

      // Refresh ficha data
      refetch();
      
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao enviar OTP',
      });
    } finally {
      setSendingOtp(null);
    }
  };

  const openWhatsApp = (phone: string, message: string) => {
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/55${phone}?text=${encodedMessage}`, '_blank');
  };

  const sendManualWhatsApp = (tipo: 'proprietario' | 'comprador') => {
    if (!ficha || !lastOtpResult || lastOtpResult.tipo !== tipo) return;
    
    const phone = tipo === 'proprietario' ? ficha.proprietario_telefone : ficha.comprador_telefone;
    const nome = tipo === 'proprietario' ? ficha.proprietario_nome : ficha.comprador_nome;
    
    const message = `🏠 *VisitaSegura*\n\nOlá ${nome}!\n\nVocê está confirmando uma visita ao imóvel:\n📍 ${ficha.imovel_endereco}\n\nSeu código de confirmação é:\n\n🔐 *${lastOtpResult.codigo}*\n\nOu acesse o link:\n${lastOtpResult.verification_url}\n\n⏰ Este código expira em 30 minutos.`;
    
    openWhatsApp(phone, message);
  };

  const downloadPdf = async () => {
    if (!ficha) return;
    
    setDownloadingPdf(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-pdf', {
        body: { ficha_id: ficha.id, app_url: window.location.origin },
      });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao gerar PDF',
          description: error.message,
        });
        return;
      }

      // Create blob and download
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comprovante-${ficha.protocolo}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'PDF gerado com sucesso!',
        description: 'O comprovante foi baixado.',
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao gerar PDF',
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ficha) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">Ficha não encontrada</p>
        <Button onClick={() => navigate('/dashboard')}>Voltar ao Dashboard</Button>
      </div>
    );
  }

  const status = statusConfig[ficha.status] || statusConfig.pendente;
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/fichas')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-xl font-bold">Ficha #{ficha.protocolo}</h1>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyProtocolo}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Criada em {format(new Date(ficha.created_at), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
            <Badge variant={status.variant} className="gap-1">
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-6">
          {/* Status Card */}
          <Card className={ficha.status === 'completo' ? 'border-success/50 bg-success/5' : ''}>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex items-center gap-3">
                  {ficha.proprietario_confirmado_em ? (
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle className="h-5 w-5" />
                      <span className="text-sm font-medium">Proprietário confirmou</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-5 w-5" />
                      <span className="text-sm">Aguardando proprietário</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {ficha.comprador_confirmado_em ? (
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle className="h-5 w-5" />
                      <span className="text-sm font-medium">Comprador confirmou</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-5 w-5" />
                      <span className="text-sm">Aguardando comprador</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Download PDF - only when complete */}
          {ficha.status === 'completo' && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-foreground">Comprovante Disponível</h3>
                    <p className="text-sm text-muted-foreground">
                      Ambas as partes confirmaram. Baixe o comprovante com QR code de verificação.
                    </p>
                  </div>
                  <Button 
                    onClick={downloadPdf}
                    disabled={downloadingPdf}
                    className="gap-2 min-w-[180px]"
                  >
                    {downloadingPdf ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileDown className="h-4 w-4" />
                    )}
                    Baixar Comprovante PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

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
                    onClick={() => sendManualWhatsApp(lastOtpResult.tipo as 'proprietario' | 'comprador')}
                    className="gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Enviar via WhatsApp
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Ações */}
          {ficha.status !== 'completo' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Enviar para Confirmação</CardTitle>
                <CardDescription>
                  Envie o código OTP via WhatsApp para confirmar a visita
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-3">
                {!ficha.proprietario_confirmado_em && (
                  <Button 
                    className="gap-2 flex-1"
                    onClick={() => sendOtp('proprietario')}
                    disabled={sendingOtp !== null}
                  >
                    {sendingOtp === 'proprietario' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Enviar para Proprietário
                  </Button>
                )}
                {!ficha.comprador_confirmado_em && (
                  <Button 
                    variant={ficha.proprietario_confirmado_em ? 'default' : 'outline'}
                    className="gap-2 flex-1"
                    onClick={() => sendOtp('comprador')}
                    disabled={sendingOtp !== null}
                  >
                    {sendingOtp === 'comprador' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Enviar para Comprador
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Dados do Imóvel */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Dados do Imóvel</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Endereço</p>
                <p className="font-medium">{ficha.imovel_endereco}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo</p>
                <p className="font-medium">{ficha.imovel_tipo}</p>
              </div>
            </CardContent>
          </Card>

          {/* Dados do Proprietário */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                  <User className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Proprietário</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">{ficha.proprietario_nome}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CPF</p>
                  <p className="font-medium">{formatCPF(ficha.proprietario_cpf)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{formatPhone(ficha.proprietario_telefone)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados do Comprador */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Users className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Comprador/Visitante</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">{ficha.comprador_nome}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CPF</p>
                  <p className="font-medium">{formatCPF(ficha.comprador_cpf)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{formatPhone(ficha.comprador_telefone)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data e Observações */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Detalhes da Visita</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Data e Hora</p>
                <p className="font-medium">
                  {format(new Date(ficha.data_visita), "EEEE, d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              {ficha.observacoes && (
                <div>
                  <p className="text-sm text-muted-foreground">Observações</p>
                  <p className="font-medium">{ficha.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dados Jurídicos - Only when complete */}
          {ficha.status === 'completo' && (confirmacaoProprietario || confirmacaoComprador) && (
            <Card className="border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Dados Jurídicos das Confirmações</CardTitle>
                    <CardDescription>Assinaturas digitais e rastreabilidade</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Proprietário Legal Data */}
                {confirmacaoProprietario && (
                  <div className="space-y-3 p-4 rounded-lg bg-muted/30 border">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">Proprietário</span>
                      <Badge variant="outline" className="text-xs">Confirmado</Badge>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 text-sm">
                      <div className="flex items-start gap-2">
                        <Fingerprint className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-muted-foreground">Assinatura</p>
                          <p className="font-medium">{confirmacaoProprietario.aceite_nome || '-'}</p>
                          <p className="text-xs text-muted-foreground">CPF: {formatCPF(confirmacaoProprietario.aceite_cpf)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-muted-foreground">Localização</p>
                          {confirmacaoProprietario.aceite_latitude && confirmacaoProprietario.aceite_longitude ? (
                            <p className="font-medium text-xs">
                              {Number(confirmacaoProprietario.aceite_latitude).toFixed(6)}, {Number(confirmacaoProprietario.aceite_longitude).toFixed(6)}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">Não capturada</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground">IP</p>
                        <p className="font-medium font-mono text-xs">{confirmacaoProprietario.aceite_ip || '-'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Data/Hora do Aceite</p>
                        <p className="font-medium">
                          {confirmacaoProprietario.aceite_em 
                            ? format(new Date(confirmacaoProprietario.aceite_em), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })
                            : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comprador Legal Data */}
                {confirmacaoComprador && (
                  <div className="space-y-3 p-4 rounded-lg bg-muted/30 border">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">Comprador/Visitante</span>
                      <Badge variant="outline" className="text-xs">Confirmado</Badge>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 text-sm">
                      <div className="flex items-start gap-2">
                        <Fingerprint className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-muted-foreground">Assinatura</p>
                          <p className="font-medium">{confirmacaoComprador.aceite_nome || '-'}</p>
                          <p className="text-xs text-muted-foreground">CPF: {formatCPF(confirmacaoComprador.aceite_cpf)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-muted-foreground">Localização</p>
                          {confirmacaoComprador.aceite_latitude && confirmacaoComprador.aceite_longitude ? (
                            <p className="font-medium text-xs">
                              {Number(confirmacaoComprador.aceite_latitude).toFixed(6)}, {Number(confirmacaoComprador.aceite_longitude).toFixed(6)}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">Não capturada</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground">IP</p>
                        <p className="font-medium font-mono text-xs">{confirmacaoComprador.aceite_ip || '-'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Data/Hora do Aceite</p>
                        <p className="font-medium">
                          {confirmacaoComprador.aceite_em 
                            ? format(new Date(confirmacaoComprador.aceite_em), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })
                            : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  Dados coletados conforme Lei 14.063/2020 para validade jurídica da assinatura eletrônica.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
