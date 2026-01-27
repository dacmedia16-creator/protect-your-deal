import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle, XCircle, Clock, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DesktopNav } from "@/components/DesktopNav";
import { MobileNav } from "@/components/MobileNav";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EmailLog {
  id: string;
  to_email: string;
  subject: string;
  template_tipo: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

const HistoricoEmails = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadLogs();
    }
  }, [user]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar histórico",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Enviado
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Falhou
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
    }
  };

  const getTemplateLabel = (tipo: string | null) => {
    if (!tipo) return 'Email direto';
    const labels: Record<string, string> = {
      boas_vindas: 'Boas-vindas',
      assinatura_ativa: 'Assinatura Ativada',
      lembrete_pagamento: 'Lembrete Pagamento',
      reset_senha: 'Reset de Senha',
      confirmacao_visita: 'Confirmação Visita',
    };
    return labels[tipo] || tipo;
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
          <Button variant="ghost" size="icon" onClick={() => navigate('/integracoes/email')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Histórico de Emails</h1>
            <p className="text-sm text-muted-foreground">Últimos 100 emails enviados</p>
          </div>
        </div>
      </header>
      
      {/* Desktop Header */}
      <div className="hidden sm:block container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/integracoes/email')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Histórico de Emails</h1>
              <p className="text-muted-foreground">Últimos 100 emails enviados</p>
            </div>
          </div>
          <Button variant="outline" onClick={loadLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <main className="p-4 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Emails Enviados
            </CardTitle>
            <CardDescription>
              Histórico de todos os emails enviados pelo sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum email enviado ainda.
              </p>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div 
                    key={log.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{log.to_email}</span>
                        {getStatusBadge(log.status)}
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {log.subject}
                      </p>
                      {log.error_message && (
                        <p className="text-xs text-destructive mt-1">
                          Erro: {log.error_message}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground shrink-0">
                      <Badge variant="outline">{getTemplateLabel(log.template_tipo)}</Badge>
                      <span>
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mobile refresh button */}
        <Button 
          variant="outline" 
          className="w-full mt-4 sm:hidden"
          onClick={loadLogs} 
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </main>
      
      <MobileNav />
    </div>
  );
};

export default HistoricoEmails;
