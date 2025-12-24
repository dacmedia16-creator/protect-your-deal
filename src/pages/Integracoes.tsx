import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plug, RefreshCw, CheckCircle, XCircle, Building, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Integracoes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const [imoviewStatus, setImoviewStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<{
    imoveis?: number;
    clientes?: number;
  }>({});

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4">
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

        {/* Future integrations placeholder */}
        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Plug className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">Z-API WhatsApp</CardTitle>
                <CardDescription>Envio de mensagens automáticas</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Em breve: Configure para enviar OTPs reais via WhatsApp.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Integracoes;
