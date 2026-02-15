import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, Loader2, MessageCircle, Send, FileText, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DesktopNav } from "@/components/DesktopNav";
import { MobileNav } from "@/components/MobileNav";

type ConnectionStatus = 'unknown' | 'connected' | 'error';

const StatusBadge = ({ status }: { status: ConnectionStatus }) => (
  <Badge 
    variant={status === 'connected' ? 'default' : status === 'error' ? 'destructive' : 'secondary'}
  >
    {status === 'connected' && <CheckCircle className="h-3 w-3 mr-1" />}
    {status === 'error' && <XCircle className="h-3 w-3 mr-1" />}
    {status === 'connected' ? 'Conectado' : status === 'error' ? 'Erro' : 'Não testado'}
  </Badge>
);

const Integracoes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  // Default channel state
  const [ziontalkStatus, setZiontalkStatus] = useState<ConnectionStatus>('unknown');
  const [testingZiontalk, setTestingZiontalk] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testPhone, setTestPhone] = useState('');

  // Meta channel state
  const [metaStatus, setMetaStatus] = useState<ConnectionStatus>('unknown');
  const [testingMeta, setTestingMeta] = useState(false);
  const [sendingMetaTest, setSendingMetaTest] = useState(false);
  const [metaTestPhone, setMetaTestPhone] = useState('');

  const testConnection = async (channel: 'default' | 'meta') => {
    const setTesting = channel === 'meta' ? setTestingMeta : setTestingZiontalk;
    const setStatus = channel === 'meta' ? setMetaStatus : setZiontalkStatus;
    const label = channel === 'meta' ? 'ZionTalk Meta' : 'ZionTalk';

    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: { action: 'test-connection', channel }
      });
      if (error) throw error;

      if (data?.connected) {
        setStatus('connected');
        toast({ title: "Conexão estabelecida!", description: `A integração com ${label} está funcionando.` });
      } else {
        setStatus('error');
        toast({ title: "Falha na conexão", description: data?.message || `Não foi possível conectar ao ${label}.`, variant: "destructive" });
      }
    } catch (error: any) {
      setStatus('error');
      toast({ title: "Erro ao testar conexão", description: error.message || "Verifique a chave API.", variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  const sendTestMessage = async () => {
    if (!testPhone) {
      toast({ title: "Telefone obrigatório", description: "Digite um número de telefone para enviar a mensagem de teste.", variant: "destructive" });
      return;
    }
    setSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: { 
          action: 'send-text',
          phone: testPhone,
          message: '✅ Teste de integração ZionTalk realizado com sucesso! Este é um envio automático do sistema de Registros de Visita.',
          channel: 'default'
        }
      });
      if (error) throw error;
      if (data?.success) {
        toast({ title: "Mensagem enviada!", description: `Mensagem de teste enviada para ${testPhone}.` });
        setTestPhone('');
      } else {
        toast({ title: "Erro ao enviar", description: data?.error || "Não foi possível enviar a mensagem.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Erro ao enviar mensagem", description: error.message, variant: "destructive" });
    } finally {
      setSendingTest(false);
    }
  };

  const sendMetaTestMessage = async () => {
    if (!metaTestPhone) {
      toast({ title: "Telefone obrigatório", description: "Digite um número de telefone para enviar o template de teste.", variant: "destructive" });
      return;
    }
    setSendingMetaTest(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: { 
          action: 'send-template',
          phone: metaTestPhone,
          templateName: 'visita_prova',
          templateParams: {
            nome: 'Teste',
            imovel: 'Rua Exemplo, 123 - Centro',
            codigo: '123456',
            lembrete: 'Este é um envio de teste via API Oficial Meta.'
          },
          buttonUrlDynamicParams: ['confirmar/teste-123'],
          language: 'pt_BR',
          channel: 'meta'
        }
      });
      if (error) throw error;
      if (data?.success) {
        toast({ title: "Template enviado!", description: `Template de teste enviado para ${metaTestPhone} via API Oficial Meta.` });
        setMetaTestPhone('');
      } else {
        toast({ title: "Erro ao enviar", description: data?.error || "Não foi possível enviar o template.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Erro ao enviar template", description: error.message, variant: "destructive" });
    } finally {
      setSendingMetaTest(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      <DesktopNav />
      
      <header className="sm:hidden bg-card border-b border-border px-4 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Integrações</h1>
            <p className="text-sm text-muted-foreground">Conecte sistemas externos</p>
          </div>
        </div>
      </header>
      
      <div className="hidden sm:block container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold">Integrações</h1>
        <p className="text-muted-foreground">Conecte sistemas externos</p>
      </div>

      <main className="p-4 space-y-4">
        {/* ZionTalk Default WhatsApp Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <MessageCircle className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">ZionTalk WhatsApp</CardTitle>
                  <CardDescription>Envio de mensagens automáticas (número padrão)</CardDescription>
                </div>
              </div>
              <StatusBadge status={ziontalkStatus} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Envie OTPs e confirmações de visita automaticamente via WhatsApp.
            </p>

            <Button 
              onClick={() => testConnection('default')} 
              disabled={testingZiontalk}
              variant="outline"
              className="w-full"
            >
              {testingZiontalk ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Testar Conexão
            </Button>

            {ziontalkStatus === 'connected' && (
              <div className="space-y-3 pt-2 border-t">
                <Label htmlFor="testPhone">Enviar mensagem de teste</Label>
                <div className="flex gap-2">
                  <Input
                    id="testPhone"
                    placeholder="(11) 99999-9999"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={sendTestMessage} disabled={sendingTest || !testPhone} size="icon">
                    {sendingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Digite um número para testar o envio de mensagens.
                </p>
              </div>
            )}

            <Button variant="secondary" className="w-full" onClick={() => navigate('/integracoes/templates')}>
              <FileText className="h-4 w-4 mr-2" />
              Configurar Templates de Mensagem
            </Button>
          </CardContent>
        </Card>

        {/* ZionTalk Meta (API Oficial) Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Shield className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">ZionTalk Meta (API Oficial)</CardTitle>
                  <CardDescription>Envio via API oficial do WhatsApp Business</CardDescription>
                </div>
              </div>
              <StatusBadge status={metaStatus} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Segundo número usando a API oficial da Meta. Envia apenas templates aprovados pelo WhatsApp Business.
            </p>

            <Button 
              onClick={() => testConnection('meta')} 
              disabled={testingMeta}
              variant="outline"
              className="w-full"
            >
              {testingMeta ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Testar Conexão
            </Button>

            {metaStatus === 'connected' && (
              <div className="space-y-3 pt-2 border-t">
                <Label htmlFor="metaTestPhone">Enviar template de teste</Label>
                <div className="flex gap-2">
                  <Input
                    id="metaTestPhone"
                    placeholder="(11) 99999-9999"
                    value={metaTestPhone}
                    onChange={(e) => setMetaTestPhone(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={sendMetaTestMessage} disabled={sendingMetaTest || !metaTestPhone} size="icon">
                    {sendingMetaTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Envia o template <strong>visita_prova</strong> com dados de teste para o número informado.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      
      <MobileNav />
    </div>
  );
};

export default Integracoes;
