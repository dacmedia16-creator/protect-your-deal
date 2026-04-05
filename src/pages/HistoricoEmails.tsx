import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle, XCircle, Clock, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
  from_email: string | null;
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

  return (<div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Histórico de Emails</h1>
            <p className="text-muted-foreground">Últimos 100 emails enviados pelo sistema</p>
          </div>
          <Button variant="outline" onClick={loadLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

      
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
                      {log.from_email && (
                        <p className="text-xs text-muted-foreground mt-1">
                          De: {log.from_email}
                        </p>
                      )}
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
      </div>);
};

export default HistoricoEmails;
