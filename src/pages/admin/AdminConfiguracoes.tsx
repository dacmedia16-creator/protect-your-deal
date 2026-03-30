import { useState } from "react";
import { formatPhone, unformatPhone, isValidPhone } from "@/lib/phone";
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
  Send,
  MessageSquare,
  Gift,
  Database,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Smartphone,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { forceAppRefresh, getBuildVersion } from "@/lib/forceAppRefresh";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatedContent, AnimatedList, AnimatedItem } from "@/components/AnimatedContent";

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

  const [testingChannel, setTestingChannel] = useState<Record<string, boolean>>({});
  const [channelStatus, setChannelStatus] = useState<Record<string, 'unknown' | 'connected' | 'error'>>({});
  const [testPhone, setTestPhone] = useState<Record<string, string>>({});
  const [sendingTest, setSendingTest] = useState<Record<string, boolean>>({});

  const testWhatsappConnection = async (channel: 'default' | 'meta' | 'meta2') => {
    setTestingChannel(prev => ({ ...prev, [channel]: true }));
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: { action: 'test-connection', channel }
      });
      if (error) throw error;
      if (data?.connected) {
        setChannelStatus(prev => ({ ...prev, [channel]: 'connected' }));
        toast.success(`${data.message || 'Conexão OK'}`);
      } else {
        setChannelStatus(prev => ({ ...prev, [channel]: 'error' }));
        toast.error(data?.message || 'Falha na conexão');
      }
    } catch (err: any) {
      setChannelStatus(prev => ({ ...prev, [channel]: 'error' }));
      toast.error(err?.message || 'Erro ao testar conexão');
    } finally {
      setTestingChannel(prev => ({ ...prev, [channel]: false }));
    }
  };

  const sendTestMessage = async (channel: 'default' | 'meta' | 'meta2') => {
    const phone = unformatPhone(testPhone[channel] || '');
    if (!isValidPhone(phone)) {
      toast.error('Informe um número de telefone válido');
      return;
    }
    setSendingTest(prev => ({ ...prev, [channel]: true }));
    try {
      const body = channel === 'default'
        ? { action: 'send-text', phone, message: '✅ Mensagem de teste do sistema VisitaProva — canal WhatsApp Padrão funcionando!', channel }
        : { action: 'send-template', phone, templateName: 'visita_prova_2', templateParams: { nome: 'Teste', imovel: 'Endereço de teste', codigo: '000000', lembrete: 'Esta é uma mensagem de teste do sistema.' }, language: 'pt_BR', channel };
      const { data, error } = await supabase.functions.invoke('send-whatsapp', { body });
      if (error) throw error;
      if (data?.success) {
        toast.success(`Mensagem de teste enviada para ${formatPhone(phone)}`);
      } else {
        toast.error(data?.error || 'Erro ao enviar mensagem de teste');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao enviar mensagem de teste');
    } finally {
      setSendingTest(prev => ({ ...prev, [channel]: false }));
    }
  };

  const whatsappChannels = [
    { key: 'default' as const, nome: 'WhatsApp Padrão', descricao: 'Envio de texto livre via ZionTalk' },
    { key: 'meta' as const, nome: 'ZionTalk Meta (API Oficial)', descricao: 'Templates via API Oficial Meta' },
    { key: 'meta2' as const, nome: 'ZionTalk Meta 2 (API Oficial 2)', descricao: 'Templates via API Oficial Meta 2' },
  ];

  const integracoes = [
    {
      nome: "ImoView",
      descricao: "Integração com sistema ImoView",
      status: "conectado",
      icon: Database,
    },
  ];

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

          {/* Integrações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plug className="h-5 w-5" />
                Integrações
              </CardTitle>
              <CardDescription>
                Status das integrações externas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {whatsappChannels.map((ch) => {
                const status = channelStatus[ch.key] || 'unknown';
                const isTesting = testingChannel[ch.key] || false;
                return (
                  <div key={ch.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{ch.nome}</p>
                        <p className="text-sm text-muted-foreground">{ch.descricao}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {status !== 'unknown' && (
                        <Badge variant={status === 'connected' ? 'default' : 'destructive'} className="flex items-center gap-1">
                          {status === 'connected' ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {status === 'connected' ? 'Conectado' : 'Erro'}
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testWhatsappConnection(ch.key)}
                        disabled={isTesting}
                      >
                        <RefreshCw className={`h-3 w-3 mr-1 ${isTesting ? 'animate-spin' : ''}`} />
                        Testar
                      </Button>
                    </div>
                  </div>
                );
              })}
              {integracoes.map((integracao) => (
                <div key={integracao.nome} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <integracao.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{integracao.nome}</p>
                      <p className="text-sm text-muted-foreground">{integracao.descricao}</p>
                    </div>
                  </div>
                  <Badge variant="default" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Conectado
                  </Badge>
                </div>
              ))}
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label>Canal WhatsApp Padrão</Label>
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Número utilizado para envios automáticos do sistema (OTP, lembretes, etc.)
                  </p>
                </div>
                {isLoadingConfig ? (
                  <Skeleton className="h-9 w-48" />
                ) : (
                  <Select
                    value={getConfigStringValue('whatsapp_channel_padrao', 'default')}
                    onValueChange={(value) => updateConfigMutation.mutate({ chave: 'whatsapp_channel_padrao', valor: value })}
                    disabled={updateConfigMutation.isPending}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Número Padrão</SelectItem>
                      <SelectItem value="meta">API Oficial Meta</SelectItem>
                      <SelectItem value="meta2">API Oficial Meta 2</SelectItem>
                    </SelectContent>
                  </Select>
                )}
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

              <Separator />
              
              <div className="space-y-0.5 mb-2">
                <Label className="font-medium">Comissões Multinível</Label>
                <p className="text-sm text-muted-foreground">
                  Defina os percentuais de comissão direta e indireta para afiliados
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>% Comissão Direta</Label>
                  <p className="text-sm text-muted-foreground">
                    Afiliado que fechou o cliente diretamente
                  </p>
                </div>
                {isLoadingConfig ? (
                  <Skeleton className="h-9 w-20" />
                ) : (
                  <Input
                    type="number"
                    className="w-20 text-center"
                    value={getConfigNumberValue('comissao_direta_percentual', 10)}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                      updateConfigMutation.mutate({ chave: 'comissao_direta_percentual', valor: val as any });
                    }}
                    min="0"
                    max="100"
                    disabled={updateConfigMutation.isPending}
                  />
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>% Comissão Indireta (2º nível)</Label>
                  <p className="text-sm text-muted-foreground">
                    Afiliado que indicou quem fechou o cliente
                  </p>
                </div>
                {isLoadingConfig ? (
                  <Skeleton className="h-9 w-20" />
                ) : (
                  <Input
                    type="number"
                    className="w-20 text-center"
                    value={getConfigNumberValue('comissao_indireta_percentual', 5)}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                      updateConfigMutation.mutate({ chave: 'comissao_indireta_percentual', valor: val as any });
                    }}
                    min="0"
                    max="100"
                    disabled={updateConfigMutation.isPending}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Indicações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Indicações
              </CardTitle>
              <CardDescription>
                Configurações de comissão do programa Indique e Ganhe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Tipo de Comissão</Label>
                  <p className="text-sm text-muted-foreground">
                    Como o indicador será recompensado
                  </p>
                </div>
                {isLoadingConfig ? (
                  <Skeleton className="h-9 w-56" />
                ) : (
                  <Select
                    value={getConfigStringValue('indicacao_tipo_comissao', 'percentual')}
                    onValueChange={(value) => updateConfigMutation.mutate({ chave: 'indicacao_tipo_comissao', valor: value })}
                    disabled={updateConfigMutation.isPending}
                  >
                    <SelectTrigger className="w-56">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentual">Percentual (%)</SelectItem>
                      <SelectItem value="primeira_mensalidade">Primeira mensalidade (100%)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {getConfigStringValue('indicacao_tipo_comissao', 'percentual') === 'percentual' && (
                <>
                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>% Comissão por Indicar Corretor</Label>
                      <p className="text-sm text-muted-foreground">
                        Percentual sobre o primeiro pagamento do corretor indicado
                      </p>
                    </div>
                    {isLoadingConfig ? (
                      <Skeleton className="h-9 w-20" />
                    ) : (
                      <Input
                        type="number"
                        className="w-20 text-center"
                        value={getConfigNumberValue('indicacao_comissao_corretor', 10)}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                          updateConfigMutation.mutate({ chave: 'indicacao_comissao_corretor', valor: val as any });
                        }}
                        min="0"
                        max="100"
                        disabled={updateConfigMutation.isPending}
                      />
                    )}
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>% Comissão por Indicar Imobiliária</Label>
                      <p className="text-sm text-muted-foreground">
                        Percentual sobre o primeiro pagamento da imobiliária indicada
                      </p>
                    </div>
                    {isLoadingConfig ? (
                      <Skeleton className="h-9 w-20" />
                    ) : (
                      <Input
                        type="number"
                        className="w-20 text-center"
                        value={getConfigNumberValue('indicacao_comissao_imobiliaria', 10)}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                          updateConfigMutation.mutate({ chave: 'indicacao_comissao_imobiliaria', valor: val as any });
                        }}
                        min="0"
                        max="100"
                        disabled={updateConfigMutation.isPending}
                      />
                    )}
                  </div>
                </>
              )}

              {getConfigStringValue('indicacao_tipo_comissao', 'percentual') === 'primeira_mensalidade' && (
                <>
                  <Separator />
                  <div className="rounded-md bg-muted/50 p-3">
                    <p className="text-sm text-muted-foreground">
                      O indicador receberá <span className="font-semibold text-foreground">100%</span> do valor da primeira mensalidade paga pelo indicado como comissão.
                    </p>
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