import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Send, Loader2, CheckCircle, XCircle, RefreshCw, Eye, Edit, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DesktopNav } from "@/components/DesktopNav";
import { MobileNav } from "@/components/MobileNav";

interface EmailTemplate {
  id: string;
  tipo: string;
  nome: string;
  assunto: string;
  conteudo_html: string;
  conteudo_texto: string | null;
  ativo: boolean;
}

const ConfiguracoesEmail = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  // Connection status
  const [smtpStatus, setSmtpStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [testingConnection, setTestingConnection] = useState(false);

  // Test email
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  // Templates
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  
  // Edit modal
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [editForm, setEditForm] = useState({ assunto: '', conteudo_html: '', conteudo_texto: '' });
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Preview modal
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    if (user) {
      loadTemplates();
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

  const testSmtpConnection = async () => {
    setTestingConnection(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { action: 'test-connection' }
      });

      if (error) throw error;

      if (data?.connected) {
        setSmtpStatus('connected');
        toast({
          title: "Conexão estabelecida!",
          description: "O servidor SMTP está funcionando corretamente.",
        });
      } else {
        setSmtpStatus('error');
        toast({
          title: "Falha na conexão",
          description: data?.message || "Não foi possível conectar ao servidor SMTP.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setSmtpStatus('error');
      toast({
        title: "Erro ao testar conexão",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
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
              <p>Se você recebeu este email, a integração com o Zoho Mail está funcionando corretamente!</p>
              <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
                Enviado em: ${new Date().toLocaleString('pt-BR')}
              </p>
            </div>
          `,
          text: 'Este é um email de teste enviado pelo sistema VisitaProva. Se você recebeu este email, a integração está funcionando!',
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Email enviado!",
          description: `Email de teste enviado para ${testEmail}.`,
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

  const openEditModal = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setEditForm({
      assunto: template.assunto,
      conteudo_html: template.conteudo_html,
      conteudo_texto: template.conteudo_texto || '',
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
      
      {/* Mobile Header */}
      <header className="sm:hidden bg-card border-b border-border px-4 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/integracoes')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Configurar Email</h1>
            <p className="text-sm text-muted-foreground">Zoho Mail SMTP</p>
          </div>
        </div>
      </header>
      
      {/* Desktop Header */}
      <div className="hidden sm:block container mx-auto px-4 py-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/integracoes')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Configurar Email</h1>
            <p className="text-muted-foreground">Zoho Mail SMTP</p>
          </div>
        </div>
      </div>

      <main className="p-4 space-y-4 max-w-4xl mx-auto">
        <Tabs defaultValue="conexao">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="conexao">Conexão</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

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
                  onClick={testSmtpConnection} 
                  disabled={testingConnection}
                  variant="outline"
                  className="w-full"
                >
                  {testingConnection ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Testar Conexão SMTP
                </Button>

                {/* Test Email */}
                {smtpStatus === 'connected' && (
                  <div className="space-y-3 pt-2 border-t">
                    <Label htmlFor="testEmail">Enviar email de teste</Label>
                    <div className="flex gap-2">
                      <Input
                        id="testEmail"
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
                )}
              </CardContent>
            </Card>

            {/* Link to history */}
            <Button 
              variant="secondary"
              className="w-full"
              onClick={() => navigate('/integracoes/email/historico')}
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
      </main>

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
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg p-4 bg-white">
            <div 
              dangerouslySetInnerHTML={{ __html: previewTemplate?.conteudo_html || '' }}
            />
          </div>
        </DialogContent>
      </Dialog>
      
      <MobileNav />
    </div>
  );
};

export default ConfiguracoesEmail;
