import { useState, useEffect } from "react";
import { SuperAdminLayout } from "@/components/layouts/SuperAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
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
  Users
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

  // Mutation to update configuration
  const updateConfigMutation = useMutation({
    mutationFn: async ({ chave, valor }: { chave: string; valor: boolean }) => {
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

  const integracoes = [
    {
      nome: "WhatsApp (ZionTalk)",
      descricao: "Envio de mensagens via WhatsApp",
      status: "conectado",
      icon: MessageSquare,
    },
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
              {integracoes.map((integracao) => (
                <div key={integracao.nome} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <integracao.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{integracao.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {integracao.descricao}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={integracao.status === "conectado" ? "default" : "secondary"}
                    className="flex items-center gap-1"
                  >
                    {integracao.status === "conectado" ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    {integracao.status === "conectado" ? "Conectado" : "Desconectado"}
                  </Badge>
                </div>
              ))}
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
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-muted-foreground">Versão</Label>
                <p className="font-medium">1.0.0</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Ambiente</Label>
                <p className="font-medium">Produção</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Última Atualização</Label>
                <p className="font-medium">26/12/2024</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}