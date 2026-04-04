import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Send, Loader2, CheckCircle, XCircle, RefreshCw, Eye, Edit, Save, X, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SuperAdminLayout } from "@/components/layouts/SuperAdminLayout";

interface EmailTemplate {
  id: string;
  tipo: string;
  nome: string;
  assunto: string;
  conteudo_html: string;
  conteudo_texto: string | null;
  ativo: boolean;
  remetente_email?: string;
}

interface EmailRemetente {
  id: string;
  email: string;
  nome_exibicao: string;
  categoria: string;
  ativo: boolean;
  created_at: string;
}

const ConfiguracoesEmail = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  // Connection status
  const [smtpStatus, setSmtpStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [testingConnection, setTestingConnection] = useState(false);
  const [testingRemetente, setTestingRemetente] = useState<string | null>(null);

  // Test email
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [selectedTestRemetente, setSelectedTestRemetente] = useState('');

  // Templates
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  
  // Remetentes
  const [remetentes, setRemetentes] = useState<EmailRemetente[]>([]);
  const [loadingRemetentes, setLoadingRemetentes] = useState(true);
  
  // Edit modal
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [editForm, setEditForm] = useState({ assunto: '', conteudo_html: '', conteudo_texto: '', remetente_email: '' });
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Preview modal
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    if (user) {
      loadTemplates();
      loadRemetentes();
    }
  }, [user]);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates_email')
        .select('*')
        .order('nome');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar templates",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingTemplates(false);
    }
  };

  const loadRemetentes = async () => {
    try {
      const { data, error } = await supabase
        .from('email_remetentes')
        .select('*')
        .order('categoria');

      if (error) throw error;
      setRemetentes(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar remetentes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingRemetentes(false);
    }
  };

  const testSmtpConnection = async (fromEmail?: string) => {
    const targetEmail = fromEmail || 'noreply@visitaprova.com.br';
    
    if (fromEmail) {
      setTestingRemetente(fromEmail);
    } else {
      setTestingConnection(true);
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { action: 'test-connection', from_email: targetEmail }
      });

      if (error) throw error;

      if (data?.connected) {
        if (!fromEmail) setSmtpStatus('connected');
        toast({
          title: "Conexão estabelecida!",
          description: data?.message || "O servidor SMTP está funcionando corretamente.",
        });
      } else {
        if (!fromEmail) setSmtpStatus('error');
        toast({
          title: "Falha na conexão",
          description: data?.message || "Não foi possível conectar ao servidor SMTP.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      if (!fromEmail) setSmtpStatus('error');
      toast({
        title: "Erro ao testar conexão",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
      setTestingRemetente(null);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: "Email obrigatório",
        description: "Digite um email para enviar o teste.",
        variant: "destructive",
      });
      return;
    }

    setSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          action: 'send',
          to: testEmail,
          subject: '✅ Teste de Email - VisitaProva',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #2563eb;">VisitaProva</h1>
              <h2>Email de Teste</h2>
              <p>Este é um email de teste enviado pelo sistema VisitaProva.</p>
              <p>Se você recebeu este email, a integração está funcionando corretamente!</p>
              <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
                Enviado em: ${new Date().toLocaleString('pt-BR')}<br/>
                Remetente: ${selectedTestRemetente || 'noreply@visitaprova.com.br'}
              </p>
            </div>
          `,
          text: 'Este é um email de teste enviado pelo sistema VisitaProva. Se você recebeu este email, a integração está funcionando!',
          from_email: selectedTestRemetente || undefined,
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Email enviado!",
          description: `Email de teste enviado de ${data.from} para ${testEmail}.`,
        });
        setTestEmail('');
      } else {
        toast({
          title: "Erro ao enviar",
          description: data?.error || "Não foi possível enviar o email.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao enviar email",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSendingTest(false);
    }
  };

  const toggleRemetenteAtivo = async (remetente: EmailRemetente) => {
    try {
      const { error } = await supabase
        .from('email_remetentes')
        .update({ ativo: !remetente.ativo })
        .eq('id', remetente.id);

      if (error) throw error;

      toast({
        title: remetente.ativo ? "Remetente desativado" : "Remetente ativado",
        description: `${remetente.email} foi ${remetente.ativo ? 'desativado' : 'ativado'}.`,
      });
      loadRemetentes();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar remetente",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openEditModal = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setEditForm({
      assunto: template.assunto,
      conteudo_html: template.conteudo_html,
      conteudo_texto: template.conteudo_texto || '',
      remetente_email: template.remetente_email || 'noreply@visitaprova.com.br',
    });
  };

  const saveTemplate = async () => {
    if (!editingTemplate) return;

    setSavingTemplate(true);
    try {
      const { error } = await supabase
        .from('templates_email')
        .update({
          assunto: editForm.assunto,
          conteudo_html: editForm.conteudo_html,
          conteudo_texto: editForm.conteudo_texto || null,
          remetente_email: editForm.remetente_email,
        })
        .eq('id', editingTemplate.id);

      if (error) throw error;

      toast({
        title: "Template salvo!",
        description: "As alterações foram salvas com sucesso.",
      });
      setEditingTemplate(null);
      loadTemplates();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingTemplate(false);
    }
  };

  const getCategoriaLabel = (categoria: string) => {
    const labels: Record<string, string> = {
      sistema: 'Sistema',
      suporte: 'Suporte',
      comercial: 'Comercial',
      admin: 'Admin',
    };
    return labels[categoria] || categoria;
  };

  const getCategoriaColor = (categoria: string) => {
    const colors: Record<string, string> = {
      sistema: 'bg-blue-500/10 text-blue-500',
      suporte: 'bg-orange-500/10 text-orange-500',
      comercial: 'bg-green-500/10 text-green-500',
      admin: 'bg-purple-500/10 text-purple-500',
    };
    return colors[categoria] || 'bg-muted text-muted-foreground';
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

  const activeRemetentes = remetentes.filter(r => r.ativo);

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
      
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Email Sistema</h1>
          <p className="text-muted-foreground">Gerenciamento de emails transacionais via Zoho Mail SMTP</p>
        </div>

      
        <Tabs defaultValue="remetentes">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="remetentes">Remetentes</TabsTrigger>
            <TabsTrigger value="conexao">Conexão</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          {/* Tab Remetentes */}
          <TabsContent value="remetentes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Remetentes de Email
                </CardTitle>
                <CardDescription>
                  Gerencie os emails disponíveis para envio. Cada template pode usar um remetente diferente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingRemetentes ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : remetentes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum remetente configurado.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {remetentes.map((remetente) => (
                      <div 
                        key={remetente.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${getCategoriaColor(remetente.categoria)}`}>
                            <Mail className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{remetente.nome_exibicao}</span>
                              <Badge variant="outline" className="text-xs">
                                {getCategoriaLabel(remetente.categoria)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{remetente.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => testSmtpConnection(remetente.email)}
                            disabled={testingRemetente === remetente.email}
                          >
                            {testingRemetente === remetente.email ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Testar
                              </>
                            )}
                          </Button>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={remetente.ativo}
                              onCheckedChange={() => toggleRemetenteAtivo(remetente)}
                            />
                            <span className="text-sm text-muted-foreground">
                              {remetente.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Uso Recomendado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-500/10 text-blue-500 border-0">Sistema</Badge>
                    <span>OTPs, confirmações automáticas, lembretes de visita</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-orange-500/10 text-orange-500 border-0">Suporte</Badge>
                    <span>Respostas a tickets, notificações de problemas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500/10 text-green-500 border-0">Comercial</Badge>
                    <span>Boas-vindas, upsell, renovações de assinatura</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-500/10 text-purple-500 border-0">Admin</Badge>
                    <span>Comunicações especiais, clientes VIP</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conexao" className="space-y-4">
            {/* Connection Status */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Mail className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Conexão SMTP</CardTitle>
                      <CardDescription>Zoho Mail (smtppro.zoho.com)</CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant={
                      smtpStatus === 'connected' ? 'default' : 
                      smtpStatus === 'error' ? 'destructive' : 
                      'secondary'
                    }
                  >
                    {smtpStatus === 'connected' && <CheckCircle className="h-3 w-3 mr-1" />}
                    {smtpStatus === 'error' && <XCircle className="h-3 w-3 mr-1" />}
                    {smtpStatus === 'connected' ? 'Conectado' : 
                     smtpStatus === 'error' ? 'Erro' : 
                     'Não testado'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => testSmtpConnection()} 
                  disabled={testingConnection}
                  variant="outline"
                  className="w-full"
                >
                  {testingConnection ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Testar Conexão SMTP (noreply)
                </Button>

                {/* Test Email */}
                <div className="space-y-3 pt-2 border-t">
                  <Label>Enviar email de teste</Label>
                  
                  {activeRemetentes.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Remetente</Label>
                      <Select value={selectedTestRemetente} onValueChange={setSelectedTestRemetente}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o remetente" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeRemetentes.map((r) => (
                            <SelectItem key={r.id} value={r.email}>
                              {r.nome_exibicao} ({r.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={sendTestEmail}
                      disabled={sendingTest || !testEmail}
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
                    Digite um email para testar o envio de mensagens.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Link to history */}
            <Button 
              variant="secondary"
              className="w-full"
              onClick={() => navigate('/admin/email/historico')}
            >
              Ver Histórico de Emails Enviados
            </Button>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Templates de Email</CardTitle>
                <CardDescription>
                  Personalize os emails enviados pelo sistema. Use variáveis como {'{nome}'}, {'{email}'}, {'{protocolo}'}, etc.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTemplates ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : templates.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum template encontrado.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {templates.map((template) => (
                      <div 
                        key={template.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium truncate">{template.nome}</h4>
                            <Badge variant={template.ativo ? 'default' : 'secondary'} className="shrink-0">
                              {template.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {template.assunto}
                          </p>
                          {template.remetente_email && (
                            <p className="text-xs text-muted-foreground mt-1">
                              De: {template.remetente_email}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPreviewTemplate(template)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Variables Reference */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Variáveis Disponíveis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><code className="bg-muted px-1 rounded">{'{nome}'}</code> - Nome do destinatário</div>
                  <div><code className="bg-muted px-1 rounded">{'{email}'}</code> - Email do destinatário</div>
                  <div><code className="bg-muted px-1 rounded">{'{protocolo}'}</code> - Protocolo da ficha</div>
                  <div><code className="bg-muted px-1 rounded">{'{endereco}'}</code> - Endereço do imóvel</div>
                  <div><code className="bg-muted px-1 rounded">{'{data_visita}'}</code> - Data da visita</div>
                  <div><code className="bg-muted px-1 rounded">{'{link}'}</code> - Link para ação</div>
                  <div><code className="bg-muted px-1 rounded">{'{valor}'}</code> - Valor monetário</div>
                  <div><code className="bg-muted px-1 rounded">{'{plano}'}</code> - Nome do plano</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      

      {/* Edit Template Modal */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Template: {editingTemplate?.nome}</DialogTitle>
            <DialogDescription>
              Modifique o conteúdo do template de email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Remetente selector */}
            <div className="space-y-2">
              <Label htmlFor="remetente">Remetente</Label>
              <Select 
                value={editForm.remetente_email} 
                onValueChange={(value) => setEditForm(prev => ({ ...prev, remetente_email: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o remetente" />
                </SelectTrigger>
                <SelectContent>
                  {remetentes.map((r) => (
                    <SelectItem key={r.id} value={r.email}>
                      {r.nome_exibicao} ({r.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Define qual email será usado para enviar este tipo de mensagem.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assunto">Assunto</Label>
              <Input
                id="assunto"
                value={editForm.assunto}
                onChange={(e) => setEditForm(prev => ({ ...prev, assunto: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conteudo_html">Conteúdo HTML</Label>
              <Textarea
                id="conteudo_html"
                value={editForm.conteudo_html}
                onChange={(e) => setEditForm(prev => ({ ...prev, conteudo_html: e.target.value }))}
                className="min-h-[300px] font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conteudo_texto">Conteúdo Texto (opcional)</Label>
              <Textarea
                id="conteudo_texto"
                value={editForm.conteudo_texto}
                onChange={(e) => setEditForm(prev => ({ ...prev, conteudo_texto: e.target.value }))}
                className="min-h-[150px]"
                placeholder="Versão em texto puro para clientes de email que não suportam HTML"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={saveTemplate} disabled={savingTemplate}>
              {savingTemplate ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Template Modal */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview: {previewTemplate?.nome}</DialogTitle>
            <DialogDescription>
              Assunto: {previewTemplate?.assunto}
              {previewTemplate?.remetente_email && (
                <span className="block mt-1">De: {previewTemplate.remetente_email}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div 
            className="border rounded-lg p-4 bg-white"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewTemplate?.conteudo_html || '') }}
          />
        </DialogContent>
      </Dialog>
      </div>
    </SuperAdminLayout>
  );
};

export default ConfiguracoesEmail;
