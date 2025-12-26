import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plug, RefreshCw, CheckCircle, XCircle, Building, Users, Loader2, MessageCircle, Send, FileText } from "lucide-react";
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

const Integracoes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  // Imoview state
  const [imoviewStatus, setImoviewStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<{
    imoveis?: number;
    clientes?: number;
  }>({});

  // ZionTalk state
  const [ziontalkStatus, setZiontalkStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [testingZiontalk, setTestingZiontalk] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testPhone, setTestPhone] = useState('');

  const testImoviewConnection = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('imoview-sync', {
        body: { action: 'testar-conexao' }
      });

      if (error) throw error;

      if (data?.connected) {
        setImoviewStatus('connected');
        toast({
          title: "Conexão estabelecida!",
          description: "A integração com Imoview está funcionando.",
        });
      } else {
        setImoviewStatus('error');
        toast({
          title: "Falha na conexão",
          description: data?.message || "Não foi possível conectar ao Imoview.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setImoviewStatus('error');
      toast({
        title: "Erro ao testar conexão",
        description: error.message || "Verifique a chave API.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const syncImoveis = async () => {
    setSyncing('imoveis');
    try {
      const { data, error } = await supabase.functions.invoke('imoview-sync', {
        body: { action: 'listar-imoveis', data: { limite: 100 } }
      });

      if (error) throw error;

      const count = data?.imoveis?.length || 0;
      setSyncResults(prev => ({ ...prev, imoveis: count }));
      
      toast({
        title: "Imóveis sincronizados!",
        description: `${count} imóveis encontrados no Imoview.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao sincronizar imóveis",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSyncing(null);
    }
  };

  const syncClientes = async () => {
    setSyncing('clientes');
    try {
      const { data, error } = await supabase.functions.invoke('imoview-sync', {
        body: { action: 'listar-clientes', data: { limite: 100 } }
      });

      if (error) throw error;

      const count = data?.clientes?.length || 0;
      setSyncResults(prev => ({ ...prev, clientes: count }));
      
      toast({
        title: "Clientes sincronizados!",
        description: `${count} clientes encontrados no Imoview.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao sincronizar clientes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSyncing(null);
    }
  };

  const testZiontalkConnection = async () => {
    setTestingZiontalk(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: { action: 'test-connection' }
      });

      if (error) throw error;

      if (data?.connected) {
        setZiontalkStatus('connected');
        toast({
          title: "Conexão estabelecida!",
          description: "A integração com ZionTalk está funcionando.",
        });
      } else {
        setZiontalkStatus('error');
        toast({
          title: "Falha na conexão",
          description: data?.message || "Não foi possível conectar ao ZionTalk.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setZiontalkStatus('error');
      toast({
        title: "Erro ao testar conexão",
        description: error.message || "Verifique a chave API.",
        variant: "destructive",
      });
    } finally {
      setTestingZiontalk(false);
    }
  };

  const sendTestMessage = async () => {
    if (!testPhone) {
      toast({
        title: "Telefone obrigatório",
        description: "Digite um número de telefone para enviar a mensagem de teste.",
        variant: "destructive",
      });
      return;
    }

    setSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: { 
          action: 'send-text',
          phone: testPhone,
          message: '✅ Teste de integração ZionTalk realizado com sucesso! Este é um envio automático do sistema de Fichas de Visita.'
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Mensagem enviada!",
          description: `Mensagem de teste enviada para ${testPhone}.`,
        });
        setTestPhone('');
      } else {
        toast({
          title: "Erro ao enviar",
          description: data?.error || "Não foi possível enviar a mensagem.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSendingTest(false);
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
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Desktop Navigation */}
      <DesktopNav />
      
      {/* Mobile Header */}
      <header className="md:hidden bg-card border-b border-border px-4 py-4">
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
      
      {/* Desktop Header */}
      <div className="hidden md:block container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold">Integrações</h1>
        <p className="text-muted-foreground">Conecte sistemas externos</p>
      </div>

      <main className="p-4 space-y-4">
        {/* Imoview Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Plug className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Imoview CRM</CardTitle>
                  <CardDescription>Sistema de gestão imobiliária</CardDescription>
                </div>
              </div>
              <Badge 
                variant={
                  imoviewStatus === 'connected' ? 'default' : 
                  imoviewStatus === 'error' ? 'destructive' : 
                  'secondary'
                }
              >
                {imoviewStatus === 'connected' && <CheckCircle className="h-3 w-3 mr-1" />}
                {imoviewStatus === 'error' && <XCircle className="h-3 w-3 mr-1" />}
                {imoviewStatus === 'connected' ? 'Conectado' : 
                 imoviewStatus === 'error' ? 'Erro' : 
                 'Não testado'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Integre com o Imoview para sincronizar imóveis, clientes e visitas automaticamente.
            </p>

            {/* Test Connection */}
            <Button 
              onClick={testImoviewConnection} 
              disabled={testing}
              variant="outline"
              className="w-full"
            >
              {testing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Testar Conexão
            </Button>

            {/* Sync Options - only show if connected */}
            {imoviewStatus === 'connected' && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button 
                  onClick={syncImoveis}
                  disabled={syncing !== null}
                  variant="secondary"
                  className="flex-col h-auto py-4"
                >
                  {syncing === 'imoveis' ? (
                    <Loader2 className="h-5 w-5 animate-spin mb-1" />
                  ) : (
                    <Building className="h-5 w-5 mb-1" />
                  )}
                  <span className="text-xs">Sincronizar Imóveis</span>
                  {syncResults.imoveis !== undefined && (
                    <span className="text-xs text-muted-foreground mt-1">
                      {syncResults.imoveis} encontrados
                    </span>
                  )}
                </Button>

                <Button 
                  onClick={syncClientes}
                  disabled={syncing !== null}
                  variant="secondary"
                  className="flex-col h-auto py-4"
                >
                  {syncing === 'clientes' ? (
                    <Loader2 className="h-5 w-5 animate-spin mb-1" />
                  ) : (
                    <Users className="h-5 w-5 mb-1" />
                  )}
                  <span className="text-xs">Sincronizar Clientes</span>
                  {syncResults.clientes !== undefined && (
                    <span className="text-xs text-muted-foreground mt-1">
                      {syncResults.clientes} encontrados
                    </span>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ZionTalk WhatsApp Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <MessageCircle className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">ZionTalk WhatsApp</CardTitle>
                  <CardDescription>Envio de mensagens automáticas</CardDescription>
                </div>
              </div>
              <Badge 
                variant={
                  ziontalkStatus === 'connected' ? 'default' : 
                  ziontalkStatus === 'error' ? 'destructive' : 
                  'secondary'
                }
              >
                {ziontalkStatus === 'connected' && <CheckCircle className="h-3 w-3 mr-1" />}
                {ziontalkStatus === 'error' && <XCircle className="h-3 w-3 mr-1" />}
                {ziontalkStatus === 'connected' ? 'Conectado' : 
                 ziontalkStatus === 'error' ? 'Erro' : 
                 'Não testado'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Envie OTPs e confirmações de visita automaticamente via WhatsApp.
            </p>

            {/* Test Connection */}
            <Button 
              onClick={testZiontalkConnection} 
              disabled={testingZiontalk}
              variant="outline"
              className="w-full"
            >
              {testingZiontalk ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Testar Conexão
            </Button>

            {/* Send Test Message - only show if connected */}
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
                  <Button 
                    onClick={sendTestMessage}
                    disabled={sendingTest || !testPhone}
                    size="icon"
                  >
                    {sendingTest ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Digite um número para testar o envio de mensagens.
                </p>
              </div>
            )}

            {/* Templates Link */}
            <Button 
              variant="secondary"
              className="w-full"
              onClick={() => navigate('/integracoes/templates')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Configurar Templates de Mensagem
            </Button>
          </CardContent>
        </Card>
      </main>
      
      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
};

export default Integracoes;
