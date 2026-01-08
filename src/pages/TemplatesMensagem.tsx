import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, RotateCcw, Loader2, MessageCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type TemplateType = 'criacao_proprietario' | 'criacao_comprador' | 'lembrete' | 'confirmacao_completa';

interface Template {
  id?: string;
  tipo: TemplateType;
  nome: string;
  conteudo: string;
  ativo: boolean;
}

const defaultTemplates: Record<TemplateType, Template> = {
  criacao_proprietario: {
    tipo: 'criacao_proprietario',
    nome: 'Criação - Proprietário',
    conteudo: `🏠 *VisitaSegura*

Olá {nome}!

Você está sendo convidado a confirmar uma visita ao seu imóvel:

📍 *{endereco}*
🏷️ {tipo_imovel}
📅 {data_visita}
📋 Protocolo: {protocolo}

Como proprietário, seu código de confirmação é:

🔐 *{codigo}*

Ou clique no link para confirmar:
{link}

⏰ Este código expira em 30 minutos.

_Não compartilhe este código com ninguém._`,
    ativo: true
  },
  criacao_comprador: {
    tipo: 'criacao_comprador',
    nome: 'Criação - Comprador',
    conteudo: `🏠 *VisitaSegura*

Olá {nome}!

Você está sendo convidado a confirmar uma visita ao imóvel:

📍 *{endereco}*
🏷️ {tipo_imovel}
📅 {data_visita}
📋 Protocolo: {protocolo}

Como visitante, seu código de confirmação é:

🔐 *{codigo}*

Ou clique no link para confirmar:
{link}

⏰ Este código expira em 30 minutos.

_Não compartilhe este código com ninguém._`,
    ativo: true
  },
  lembrete: {
    tipo: 'lembrete',
    nome: 'Lembrete de Visita',
    conteudo: `🏠 *VisitaSegura - Lembrete*

Olá {nome}!

Lembrete: Você tem uma visita agendada para breve!

📍 *{endereco}*
📅 {data_visita}
📋 Protocolo: {protocolo}

Não se esqueça de confirmar sua presença!

{link}`,
    ativo: true
  },
  confirmacao_completa: {
    tipo: 'confirmacao_completa',
    nome: 'Confirmação Completa',
    conteudo: `🏠 *VisitaSegura*

✅ *Visita Confirmada!*

Olá {nome}!

A visita ao imóvel foi confirmada por ambas as partes:

📍 *{endereco}*
📅 {data_visita}
📋 Protocolo: {protocolo}

O comprovante de visita está disponível para download.

Obrigado por usar o VisitaSegura!`,
    ativo: true
  }
};

const templateLabels: Record<TemplateType, { title: string; description: string; icon: string }> = {
  criacao_proprietario: {
    title: 'Criação - Proprietário',
    description: 'Enviada ao proprietário quando um registro é criado',
    icon: '👤'
  },
  criacao_comprador: {
    title: 'Criação - Comprador',
    description: 'Enviada ao comprador/visitante quando um registro é criado',
    icon: '👥'
  },
  lembrete: {
    title: 'Lembrete de Visita',
    description: 'Enviada como lembrete antes da visita',
    icon: '⏰'
  },
  confirmacao_completa: {
    title: 'Confirmação Completa',
    description: 'Enviada quando ambas as partes confirmam',
    icon: '✅'
  }
};

const variaveisDisponiveis = [
  { nome: '{nome}', descricao: 'Nome do destinatário' },
  { nome: '{endereco}', descricao: 'Endereço do imóvel' },
  { nome: '{tipo_imovel}', descricao: 'Tipo do imóvel (Casa, Apartamento, etc.)' },
  { nome: '{data_visita}', descricao: 'Data e hora da visita formatada' },
  { nome: '{protocolo}', descricao: 'Número do protocolo do registro' },
  { nome: '{codigo}', descricao: 'Código OTP de confirmação' },
  { nome: '{link}', descricao: 'Link para confirmação online' },
];

const TemplatesMensagem = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [templates, setTemplates] = useState<Record<TemplateType, Template>>(defaultTemplates);
  const [activeTab, setActiveTab] = useState<TemplateType>('criacao_proprietario');

  // Fetch existing templates
  const { data: savedTemplates, isLoading } = useQuery({
    queryKey: ['templates-mensagem', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('templates_mensagem')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Update local state when data loads
  useEffect(() => {
    if (savedTemplates && savedTemplates.length > 0) {
      const updatedTemplates = { ...defaultTemplates };
      savedTemplates.forEach((saved) => {
        const tipo = saved.tipo as TemplateType;
        if (updatedTemplates[tipo]) {
          updatedTemplates[tipo] = {
            id: saved.id,
            tipo: saved.tipo as TemplateType,
            nome: saved.nome,
            conteudo: saved.conteudo,
            ativo: saved.ativo,
          };
        }
      });
      setTemplates(updatedTemplates);
    }
  }, [savedTemplates]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (template: Template) => {
      if (!user) throw new Error('Não autenticado');
      
      const templateData = {
        user_id: user.id,
        tipo: template.tipo,
        nome: template.nome,
        conteudo: template.conteudo,
        ativo: template.ativo,
      };

      if (template.id) {
        // Update existing
        const { error } = await supabase
          .from('templates_mensagem')
          .update(templateData)
          .eq('id', template.id);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('templates_mensagem')
          .insert(templateData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates-mensagem'] });
      toast({
        title: 'Template salvo!',
        description: 'Suas alterações foram salvas com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSave = (tipo: TemplateType) => {
    saveMutation.mutate(templates[tipo]);
  };

  const handleReset = (tipo: TemplateType) => {
    setTemplates(prev => ({
      ...prev,
      [tipo]: { ...defaultTemplates[tipo], id: prev[tipo].id }
    }));
    toast({
      title: 'Template resetado',
      description: 'O template foi restaurado para o padrão. Clique em Salvar para confirmar.',
    });
  };

  const handleContentChange = (tipo: TemplateType, conteudo: string) => {
    setTemplates(prev => ({
      ...prev,
      [tipo]: { ...prev[tipo], conteudo }
    }));
  };

  if (authLoading || isLoading) {
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
          <Button variant="ghost" size="icon" onClick={() => navigate('/integracoes')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Templates de Mensagem</h1>
            <p className="text-sm text-muted-foreground">Personalize as mensagens do WhatsApp</p>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4 max-w-4xl mx-auto">
        {/* Variables Info */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Variáveis disponíveis:</strong> Use estas variáveis nos templates, elas serão substituídas pelos valores reais.
            <div className="flex flex-wrap gap-2 mt-2">
              {variaveisDisponiveis.map(v => (
                <Badge key={v.nome} variant="secondary" className="font-mono text-xs">
                  {v.nome}
                </Badge>
              ))}
            </div>
          </AlertDescription>
        </Alert>

        {/* Templates Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TemplateType)}>
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            {(Object.keys(templateLabels) as TemplateType[]).map((tipo) => (
              <TabsTrigger key={tipo} value={tipo} className="text-xs">
                {templateLabels[tipo].icon} {templateLabels[tipo].title.split(' - ')[0]}
              </TabsTrigger>
            ))}
          </TabsList>

          {(Object.keys(templates) as TemplateType[]).map((tipo) => (
            <TabsContent key={tipo} value={tipo}>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <MessageCircle className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{templateLabels[tipo].title}</CardTitle>
                      <CardDescription>{templateLabels[tipo].description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`template-${tipo}`}>Conteúdo da mensagem</Label>
                    <Textarea
                      id={`template-${tipo}`}
                      value={templates[tipo].conteudo}
                      onChange={(e) => handleContentChange(tipo, e.target.value)}
                      className="min-h-[300px] font-mono text-sm"
                      placeholder="Digite o template da mensagem..."
                    />
                  </div>

                  {/* Variables Reference */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm font-medium mb-2">Variáveis:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {variaveisDisponiveis.map(v => (
                        <div key={v.nome} className="text-xs">
                          <code className="bg-background px-1 py-0.5 rounded">{v.nome}</code>
                          <span className="text-muted-foreground ml-2">{v.descricao}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 justify-end pt-2">
                    <Button
                      variant="outline"
                      onClick={() => handleReset(tipo)}
                      disabled={saveMutation.isPending}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restaurar Padrão
                    </Button>
                    <Button
                      onClick={() => handleSave(tipo)}
                      disabled={saveMutation.isPending}
                    >
                      {saveMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Salvar Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
};

export default TemplatesMensagem;
