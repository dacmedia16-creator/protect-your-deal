import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Building2, 
  Calendar, 
  User,
  Shield,
  Home,
  Upload,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Info,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VerificationData {
  valid: boolean;
  confirmacao_completa?: boolean;
  confirmacao_parcial?: boolean;
  protocolo?: string;
  data_visita?: string;
  imovel_tipo?: string;
  imovel_endereco?: string;
  proprietario_nome?: string;
  comprador_nome?: string;
  corretor_nome?: string;
  corretor_creci?: string;
  proprietario_confirmado_em?: string;
  comprador_confirmado_em?: string;
  integridade_verificavel?: boolean;
  documento_hash?: string;
  documento_gerado_em?: string;
  error?: string;
}

interface IntegrityResult {
  integro: boolean;
  protocolo?: string;
  hash_original?: string;
  hash_enviado?: string;
  documento_gerado_em?: string;
  mensagem?: string;
  error?: string;
}

export default function VerificarComprovante() {
  const { protocolo } = useParams<{ protocolo: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<VerificationData | null>(null);
  
  // Integrity verification state
  const [integrityLoading, setIntegrityLoading] = useState(false);
  const [integrityResult, setIntegrityResult] = useState<IntegrityResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Hash display state
  const [hashCopied, setHashCopied] = useState(false);
  const [hashExpanded, setHashExpanded] = useState(false);

  const copyHash = useCallback(async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setHashCopied(true);
      setTimeout(() => setHashCopied(false), 2000);
    } catch {
      // Fallback: select text
      const textArea = document.createElement('textarea');
      textArea.value = hash;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setHashCopied(true);
      setTimeout(() => setHashCopied(false), 2000);
    }
  }, []);

  useEffect(() => {
    const verificar = async () => {
      if (!protocolo) {
        setData({ valid: false, error: 'Protocolo não informado' });
        setLoading(false);
        return;
      }

      try {
        const { data: result, error } = await supabase.functions.invoke('verify-comprovante', {
          body: { protocolo },
        });

        if (error) {
          setData({ valid: false, error: 'Erro ao verificar comprovante' });
        } else {
          setData(result);
        }
      } catch (err) {
        setData({ valid: false, error: 'Erro de conexão' });
      } finally {
        setLoading(false);
      }
    };

    verificar();
  }, [protocolo]);

  const maskName = (name: string) => {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length === 1) {
      return name.charAt(0) + '***';
    }
    return parts[0] + ' ' + parts.slice(1).map(p => p.charAt(0) + '.').join(' ');
  };

  const handleFileUpload = useCallback(async (file: File) => {
    if (!protocolo) return;
    
    if (file.type !== 'application/pdf') {
      setIntegrityResult({ integro: false, error: 'Por favor, envie um arquivo PDF.' });
      return;
    }

    setIntegrityLoading(true);
    setIntegrityResult(null);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        const { data: result, error } = await supabase.functions.invoke('verify-pdf-integrity', {
          body: { protocolo, pdf_base64: base64 },
        });

        if (error) {
          setIntegrityResult({ integro: false, error: 'Erro ao verificar integridade' });
        } else {
          setIntegrityResult(result);
        }
        setIntegrityLoading(false);
      };
      reader.onerror = () => {
        setIntegrityResult({ integro: false, error: 'Erro ao ler o arquivo' });
        setIntegrityLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIntegrityResult({ integro: false, error: 'Erro de conexão' });
      setIntegrityLoading(false);
    }
  }, [protocolo]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  }, [handleFileUpload]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Verificando comprovante...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-display font-bold text-lg">Visita</span>
            </div>
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <Home className="h-4 w-4" />
                Início
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-lg">
        {data?.valid ? (
          <div className="space-y-6">
            {/* Status Card - Different for complete vs partial */}
            {data.confirmacao_completa ? (
              <Card className="border-success/50 bg-success/5">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center">
                      <CheckCircle className="h-10 w-10 text-success" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-success">Comprovante Válido</h1>
                      <p className="text-sm text-muted-foreground mt-1">
                        Este documento é autêntico e foi verificado com sucesso.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-900/10">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <AlertTriangle className="h-10 w-10 text-amber-600 dark:text-amber-500" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-amber-600 dark:text-amber-500">Confirmação Parcial</h1>
                      <p className="text-sm text-muted-foreground mt-1">
                        Este documento possui confirmação de apenas uma das partes.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dados do Comprovante */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Dados da Visita
                </CardTitle>
                <CardDescription>Protocolo: {data.protocolo}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Imóvel</p>
                    <p className="font-medium">{data.imovel_tipo}</p>
                    <p className="text-sm text-muted-foreground">{data.imovel_endereco}</p>
                  </div>

                  <div className="border-t pt-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Data da Visita</p>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {data.data_visita && format(new Date(data.data_visita), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>

                  <div className="border-t pt-3 grid gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Proprietário</p>
                      <p className="font-medium flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {maskName(data.proprietario_nome || '')}
                      </p>
                      {data.proprietario_confirmado_em ? (
                        <p className="text-xs text-success flex items-center gap-1 mt-1">
                          <CheckCircle className="h-3 w-3" />
                          Confirmado em {format(new Date(data.proprietario_confirmado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      ) : (
                        <p className="text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          Aguardando confirmação
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Visitante</p>
                      <p className="font-medium flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {maskName(data.comprador_nome || '')}
                      </p>
                      {data.comprador_confirmado_em ? (
                        <p className="text-xs text-success flex items-center gap-1 mt-1">
                          <CheckCircle className="h-3 w-3" />
                          Confirmado em {format(new Date(data.comprador_confirmado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      ) : (
                        <p className="text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          Aguardando confirmação
                        </p>
                      )}
                    </div>
                  </div>

                  {data.corretor_nome && (
                    <div className="border-t pt-3">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Corretor Responsável</p>
                      <p className="font-medium">{data.corretor_nome}</p>
                      {data.corretor_creci && (
                        <Badge variant="secondary" className="mt-1">CRECI: {data.corretor_creci}</Badge>
                      )}
                    </div>
                  )}

                  {/* Integrity info with copy/expand */}
                  {data.integridade_verificavel && data.documento_hash && (
                    <div className="border-t pt-3">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-2">
                        <ShieldCheck className="h-3 w-3" />
                        Integridade Criptográfica
                      </p>
                      
                      <div className="bg-muted rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <code className="text-xs font-mono text-muted-foreground break-all">
                            {hashExpanded 
                              ? data.documento_hash 
                              : `${data.documento_hash.substring(0, 16)}...`}
                          </code>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => copyHash(data.documento_hash!)}
                              title="Copiar hash completa"
                            >
                              {hashCopied ? (
                                <Check className="h-3.5 w-3.5 text-success" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => setHashExpanded(!hashExpanded)}
                              title={hashExpanded ? "Ocultar" : "Mostrar completa"}
                            >
                              {hashExpanded ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Identificador técnico SHA-256 para conferência.
                        </p>
                      </div>

                      {data.documento_gerado_em && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Gerado em: {format(new Date(data.documento_gerado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Verificação de Integridade do PDF */}
            {data.integridade_verificavel && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Verificar Integridade do Documento
                  </CardTitle>
                  <CardDescription>
                    Envie o arquivo PDF para verificar se ele não foi alterado
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Upload Area */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      dragActive 
                        ? 'border-primary bg-primary/5' 
                        : 'border-muted-foreground/25 hover:border-primary/50'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    {integrityLoading ? (
                      <div className="space-y-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                        <p className="text-sm text-muted-foreground">Verificando integridade...</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Arraste o PDF aqui ou clique para selecionar
                        </p>
                        <label>
                          <input
                            type="file"
                            accept="application/pdf"
                            onChange={handleInputChange}
                            className="hidden"
                          />
                          <Button variant="outline" size="sm" asChild>
                            <span>Selecionar PDF</span>
                          </Button>
                        </label>
                      </>
                    )}
                  </div>

                  {/* Integrity Result */}
                  {integrityResult && (
                    <div className={`rounded-lg p-4 ${
                      integrityResult.integro 
                        ? 'bg-success/10 border border-success/30' 
                        : 'bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-700'
                    }`}>
                      <div className="flex items-start gap-3">
                        {integrityResult.integro ? (
                          <ShieldCheck className="h-6 w-6 text-success flex-shrink-0" />
                        ) : (
                          <Info className="h-6 w-6 text-amber-600 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold ${
                            integrityResult.integro ? 'text-success' : 'text-amber-600'
                          }`}>
                            {integrityResult.integro ? 'Documento Íntegro' : 'Verificação Inconclusiva'}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {integrityResult.mensagem || integrityResult.error}
                          </p>
                          
                          {/* Technical details */}
                          {integrityResult.hash_original && (
                            <div className="mt-3 space-y-1 text-xs">
                              <p className="text-muted-foreground">
                                <span className="font-medium">Hash original:</span>{' '}
                                <code className="bg-background/50 px-1 rounded">{integrityResult.hash_original}</code>
                              </p>
                              <p className="text-muted-foreground">
                                <span className="font-medium">Hash enviado:</span>{' '}
                                <code className="bg-background/50 px-1 rounded">{integrityResult.hash_enviado}</code>
                              </p>
                              {integrityResult.documento_gerado_em && (
                                <p className="text-muted-foreground">
                                  <span className="font-medium">Documento gerado em:</span>{' '}
                                  {format(new Date(integrityResult.documento_gerado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Info about integrity */}
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <p>
                      A verificação de integridade usa hash SHA-256 para garantir que o documento 
                      não foi alterado desde sua geração original.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <p className="text-xs text-center text-muted-foreground">
              Verificação realizada em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status de Erro */}
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="h-16 w-16 rounded-full bg-destructive/20 flex items-center justify-center">
                    <XCircle className="h-10 w-10 text-destructive" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-destructive">Comprovante Inválido</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      {data?.error || 'Não foi possível verificar este comprovante.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Isso pode acontecer se o protocolo não existe ou se a visita ainda não foi confirmada por ambas as partes.
              </p>
              <Link to="/">
                <Button>Ir para o Início</Button>
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground">
            Visita - Sistema de Registro de Intermediação Imobiliária
          </p>
        </div>
      </footer>
    </div>
  );
}
