import { useState } from "react";
import { SuperAdminLayout } from "@/components/layouts/SuperAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Bell, 
  Shield, 
  Plug, 
  MessageSquare,
  Database,
  CheckCircle,
  XCircle
} from "lucide-react";
import { toast } from "sonner";

export default function AdminConfiguracoes() {
  const [settings, setSettings] = useState({
    notificacoesEmail: true,
    notificacoesWhatsApp: true,
    manutencaoAtiva: false,
    registroAberto: true,
  });

  const handleSettingChange = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    toast.success("Configuração atualizada");
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
