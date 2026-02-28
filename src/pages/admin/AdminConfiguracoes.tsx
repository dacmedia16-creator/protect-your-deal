import { useState } from "react";
import { SuperAdminLayout } from "@/components/layouts/SuperAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Settings, 
  Bell, 
  Shield, 
  Plug, 
  MessageSquare,
  Database,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Smartphone,
  RefreshCw,
  Loader2,
  Wifi,
  WifiOff,
  Radio
} from "lucide-react";
import { format } from "date-fns";
import { forceAppRefresh, getBuildVersion } from "@/lib/forceAppRefresh";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatedContent, AnimatedList, AnimatedItem } from "@/components/AnimatedContent";

type ChannelKey = 'default' | 'meta' | 'meta2';
type ChannelStatus = 'unknown' | 'connected' | 'error';

const WHATSAPP_CHANNELS: { key: ChannelKey; name: string; description: string }[] = [
  { key: 'default', name: 'ZionTalk Padrão', description: 'Canal de texto livre (API não-oficial)' },
  { key: 'meta', name: 'API Oficial Meta', description: 'Canal oficial Meta Business – Template visita_prova_2' },
  { key: 'meta2', name: 'API Oficial Meta 2', description: 'Segundo canal oficial Meta Business' },
];

type ConfiguracaoSistema = {
  id: string;
  chave: string;
  valor: boolean | string | number;
  descricao: string | null;
};

export default function AdminConfiguracoes() {
  const queryClient = useQueryClient();
  
  const [settings, setSettings] = useState({
    notificacoesEmail: true,
    notificacoesWhatsApp: true,
    manutencaoAtiva: false,
    registroAberto: true,
  });

  const [serverVersion, setServerVersion] = useState<string | null>(null);
  const [lastPublished, setLastPublished] = useState<string | null>(null);
  const [isCheckingVersion, setIsCheckingVersion] = useState(false);
  const [testingChannel, setTestingChannel] = useState<ChannelKey | null>(null);
  const [channelStatuses, setChannelStatuses] = useState<Record<ChannelKey, ChannelStatus>>({
    default: 'unknown',
    meta: 'unknown',
    meta2: 'unknown',
  });

  const localVersion = getBuildVersion();

  const checkLatestVersion = async () => {
    setIsCheckingVersion(true);
    try {
      const { data, error } = await supabase.functions.invoke('app-version');
      if (error) throw error;
      setServerVersion(data?.version || null);
      setLastPublished(data?.published_at || null);
      toast.success("Versão verificada com sucesso");
    } catch (err) {
      console.error('Erro ao verificar versão:', err);
      toast.error("Erro ao verificar versão");
    } finally {
      setIsCheckingVersion(false);
    }
  };

  const hasUpdate = serverVersion && serverVersion !== localVersion;

  // Fetch system configurations from database
  const { data: configuracoes, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['configuracoes-sistema'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracoes_sistema')
        .select('*');
      
      if (error) throw error;
      return data as ConfiguracaoSistema[];
    },
  });

  // Get specific configuration value (boolean)
  const getConfigValue = (chave: string): boolean => {
    const config = configuracoes?.find(c => c.chave === chave);
    if (!config) return false; // default to false
    return config.valor === true || config.valor === 'true';
  };

  // Get specific configuration value (number)
  const getConfigNumberValue = (chave: string, defaultValue: number = 12): number => {
    const config = configuracoes?.find(c => c.chave === chave);
    if (!config) return defaultValue;
    const numValue = Number(config.valor);
    return isNaN(numValue) ? defaultValue : numValue;
  };

  // Get specific configuration string value
  const getConfigStringValue = (chave: string, defaultValue: string = ''): string => {
    const config = configuracoes?.find(c => c.chave === chave);
    if (!config) return defaultValue;
    // valor is JSON, so it might be a quoted string like "default"
    if (typeof config.valor === 'string') return config.valor;
    return String(config.valor);
  };

  // Mutation to update configuration
  const updateConfigMutation = useMutation({
    mutationFn: async ({ chave, valor }: { chave: string; valor: boolean | string | number }) => {
      const { error } = await supabase
        .from('configuracoes_sistema')
        .update({ valor: valor })
        .eq('chave', chave);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes-sistema'] });
      toast.success("Configuração atualizada");
    },
    onError: (error) => {
      console.error('Error updating configuration:', error);
      toast.error("Erro ao atualizar configuração");
    },
  });

  const handleSettingChange = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    toast.success("Configuração atualizada");
  };

  const handleToggleLembretesOtp = () => {
    const currentValue = getConfigValue('lembretes_otp_ativo');
    updateConfigMutation.mutate({ 
      chave: 'lembretes_otp_ativo', 
      valor: !currentValue 
    });
  };

  const handleToggleLimiteComissao = () => {
    const currentValue = getConfigValue('limite_meses_comissao_ativo');
    updateConfigMutation.mutate({ 
      chave: 'limite_meses_comissao_ativo', 
      valor: !currentValue 
    });
  };

  const handleUpdateLimiteMeses = (valor: string) => {
    const numValue = Math.max(1, Math.min(48, Number(valor) || 12));
    updateConfigMutation.mutate({ 
      chave: 'limite_meses_comissao_valor', 
      valor: numValue as any
    });
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações globais do sistema
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Configurações Gerais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Geral
              </CardTitle>
              <CardDescription>
                Configurações gerais do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Modo Manutenção</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativa o modo de manutenção para todos os usuários
                  </p>
                </div>
                <Switch
                  checked={settings.manutencaoAtiva}
                  onCheckedChange={() => handleSettingChange("manutencaoAtiva")}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Registro Aberto</Label>
                  <p className="text-sm text-muted-foreground">
                    Permite novas imobiliárias se registrarem
                  </p>
                </div>
                <Switch
                  checked={settings.registroAberto}
                  onCheckedChange={() => handleSettingChange("registroAberto")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notificações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações
              </CardTitle>
              <CardDescription>
                Configurações de notificações do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar emails de notificação para usuários
                  </p>
                </div>
                <Switch
                  checked={settings.notificacoesEmail}
                  onCheckedChange={() => handleSettingChange("notificacoesEmail")}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações por WhatsApp</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar notificações via WhatsApp
                  </p>
                </div>
                <Switch
                  checked={settings.notificacoesWhatsApp}
                  onCheckedChange={() => handleSettingChange("notificacoesWhatsApp")}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label>Lembretes Automáticos OTP</Label>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enviar lembrete via WhatsApp quando OTP estiver próximo de expirar (15 min)
                  </p>
                </div>
                {isLoadingConfig ? (
                  <Skeleton className="h-6 w-11" />
                ) : (
                  <Switch
                    checked={getConfigValue('lembretes_otp_ativo')}
                    onCheckedChange={handleToggleLembretesOtp}
                    disabled={updateConfigMutation.isPending}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Canais WhatsApp */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Canais WhatsApp
              </CardTitle>
              <CardDescription>
                Gerencie os canais de envio de WhatsApp e selecione o canal ativo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingConfig ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-3">
                  {WHATSAPP_CHANNELS.map((ch) => {
                    const activeChannel = getConfigStringValue('whatsapp_channel_padrao', 'default');
                    const isActive = activeChannel === ch.key;
                    const status = channelStatuses[ch.key];
                    const isTesting = testingChannel === ch.key;

                    return (
                      <div
                        key={ch.key}
                        className={`relative rounded-lg border-2 p-4 space-y-3 transition-colors ${
                          isActive
                            ? 'border-primary bg-primary/5'
                            : 'border-border'
                        }`}
                      >
                        {/* Active indicator */}
                        {isActive && (
                          <Badge variant="default" className="absolute -top-2.5 left-3 flex items-center gap-1">
                            <Radio className="h-3 w-3" />
                            Ativo
                          </Badge>
                        )}

                        <div className="pt-1">
                          <p className="font-semibold">{ch.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{ch.description}</p>
                        </div>

                        {/* Status indicator */}
                        <div className="flex items-center gap-1.5 text-xs">
                          {status === 'connected' && (
                            <>
                              <Wifi className="h-3.5 w-3.5 text-success" />
                              <span className="text-success">Conectado</span>
                            </>
                          )}
                          {status === 'error' && (
                            <>
                              <WifiOff className="h-3.5 w-3.5 text-destructive" />
                              <span className="text-destructive">Falha na conexão</span>
                            </>
                          )}
                          {status === 'unknown' && (
                            <>
                              <Wifi className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground">Não testado</span>
                            </>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            disabled={isTesting}
                            onClick={async () => {
                              setTestingChannel(ch.key);
                              try {
                                const { data, error } = await supabase.functions.invoke('send-whatsapp', {
                                  body: { action: 'test-connection', channel: ch.key },
                                });
                                if (error) throw error;
                                const connected = data?.connected === true;
                                setChannelStatuses(prev => ({ ...prev, [ch.key]: connected ? 'connected' : 'error' }));
                                toast[connected ? 'success' : 'error'](data?.message || (connected ? 'Conectado' : 'Falha'));
                              } catch (err: any) {
                                setChannelStatuses(prev => ({ ...prev, [ch.key]: 'error' }));
                                toast.error('Erro ao testar conexão');
                              } finally {
                                setTestingChannel(null);
                              }
                            }}
                          >
                            {isTesting ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Wifi className="h-3.5 w-3.5" />
                            )}
                            Testar
                          </Button>
                          {!isActive && (
                            <Button
                              size="sm"
                              className="flex-1"
                              disabled={updateConfigMutation.isPending}
                              onClick={() => updateConfigMutation.mutate({ chave: 'whatsapp_channel_padrao', valor: ch.key })}
                            >
                              Ativar
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <Separator className="my-4" />

              {/* ImoView integration kept */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Database className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">ImoView</p>
                    <p className="text-sm text-muted-foreground">Integração com sistema ImoView</p>
                  </div>
                </div>
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Conectado
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Afiliados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Afiliados
              </CardTitle>
              <CardDescription>
                Configurações do programa de afiliados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Limitar Meses de Comissão</Label>
                  <p className="text-sm text-muted-foreground">
                    Pagar comissão apenas nos primeiros meses da assinatura
                  </p>
                </div>
                {isLoadingConfig ? (
                  <Skeleton className="h-6 w-11" />
                ) : (
                  <Switch
                    checked={getConfigValue('limite_meses_comissao_ativo')}
                    onCheckedChange={handleToggleLimiteComissao}
                    disabled={updateConfigMutation.isPending}
                  />
                )}
              </div>
              
              {getConfigValue('limite_meses_comissao_ativo') && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Quantidade de Meses</Label>
                      <p className="text-sm text-muted-foreground">
                        Número máximo de meses para pagamento de comissão
                      </p>
                    </div>
                    {isLoadingConfig ? (
                      <Skeleton className="h-9 w-20" />
                    ) : (
                      <Input
                        type="number"
                        className="w-20 text-center"
                        value={getConfigNumberValue('limite_meses_comissao_valor')}
                        onChange={(e) => handleUpdateLimiteMeses(e.target.value)}
                        min="1"
                        max="48"
                        disabled={updateConfigMutation.isPending}
                      />
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Segurança */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Segurança
              </CardTitle>
              <CardDescription>
                Configurações de segurança do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Política de Senhas</Label>
                <p className="text-sm text-muted-foreground">
                  Mínimo de 6 caracteres obrigatório
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Timeout de Sessão</Label>
                <p className="text-sm text-muted-foreground">
                  Sessões expiram após 7 dias de inatividade
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Autenticação</Label>
                <p className="text-sm text-muted-foreground">
                  Email e senha com confirmação automática ativada
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-muted-foreground">Versão Local</Label>
                <p className="font-medium font-mono text-sm">{localVersion}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Ambiente</Label>
                <p className="font-medium">Produção</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Última Atualização</Label>
                <p className="font-medium">
                  {lastPublished 
                    ? format(new Date(lastPublished), 'dd/MM/yyyy HH:mm') 
                    : '—'}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 space-y-1">
                <Label className="text-muted-foreground">Versão no Servidor</Label>
                <p className="font-medium font-mono text-sm">
                  {serverVersion || 'Não verificada'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {hasUpdate && (
                  <>
                    <Badge variant="destructive" className="whitespace-nowrap">Nova versão disponível</Badge>
                    <Button size="sm" onClick={() => forceAppRefresh()}>
                      Atualizar Agora
                    </Button>
                  </>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={checkLatestVersion} 
                  disabled={isCheckingVersion}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${isCheckingVersion ? 'animate-spin' : ''}`} />
                  Verificar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}