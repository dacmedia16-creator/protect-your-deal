import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { APP_URL, SURVEY_URL } from '@/lib/appConfig';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ClipboardList,
  Send,
  Copy,
  MessageCircle,
  Loader2,
  CheckCircle,
  Clock,
  ExternalLink,
  Star,
} from 'lucide-react';

interface SurveyResponse {
  id: string;
  rating_location: number;
  rating_size: number;
  rating_layout: number;
  rating_finishes: number;
  rating_conservation: number;
  rating_common_areas: number;
  rating_price: number;
  liked_most: string | null;
  liked_least: string | null;
  would_buy: boolean;
  created_at: string;
}

interface Survey {
  id: string;
  token: string;
  status: string;
  sent_at: string | null;
  responded_at: string | null;
  client_name: string | null;
  survey_responses: SurveyResponse[];
}

interface SurveySectionProps {
  fichaId: string;
  compradorNome: string | null;
  imovelEndereco: string;
}

export function SurveySection({ fichaId, compradorNome, imovelEndereco }: SurveySectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showResponseDialog, setShowResponseDialog] = useState(false);

  // Fetch existing survey for this ficha
  const { data: survey, isLoading } = useQuery({
    queryKey: ['survey', fichaId],
    refetchInterval: 30000,      // Revalidar a cada 30 segundos
    staleTime: 10000,            // Dados ficam "frescos" por 10 segundos
    refetchOnWindowFocus: true,  // Revalidar ao voltar para a aba
    queryFn: async () => {
      const { data, error } = await supabase
        .from('surveys')
        .select(`
          id,
          token,
          status,
          sent_at,
          responded_at,
          client_name,
          survey_responses (
            id,
            rating_location,
            rating_size,
            rating_layout,
            rating_finishes,
            rating_conservation,
            rating_common_areas,
            rating_price,
            liked_most,
            liked_least,
            would_buy,
            created_at
          )
        `)
        .eq('ficha_id', fichaId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      // Transform the data to match our interface
      return {
        ...data,
        survey_responses: Array.isArray(data.survey_responses) 
          ? data.survey_responses 
          : data.survey_responses ? [data.survey_responses] : []
      } as Survey;
    },
  });

  // Create survey mutation
  const createSurveyMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('create-survey', {
        body: { ficha_id: fichaId, app_url: APP_URL },
      });

      if (error) {
        const errorData = data as { error?: string } | null;
        throw new Error(errorData?.error || error.message || 'Erro ao criar pesquisa');
      }

      return data as { link: string; token: string; already_exists: boolean };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['survey', fichaId] });
      
      if (data.already_exists) {
        toast({
          title: 'Pesquisa já existe',
          description: 'O link da pesquisa foi recuperado.',
        });
      } else {
        toast({
          title: 'Pesquisa criada!',
          description: 'Agora você pode enviar o link para o cliente.',
        });
      }
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao criar pesquisa',
      });
    },
  });

  // Link para compartilhamento - usa domínio separado para pesquisas
  // Nota: Prévias personalizadas do WhatsApp não funcionam devido a limitação de infraestrutura
  const shareLink = survey ? `${SURVEY_URL}/survey/${survey.token}` : null;
  
  // Link direto para visualização (mesmo que shareLink)
  const viewLink = shareLink;

  const handleCreateAndSend = async () => {
    if (!survey) {
      await createSurveyMutation.mutateAsync();
    }
    setShowSendDialog(true);
  };

  const handleCopyLink = () => {
    if (shareLink) {
      // Adiciona cache-buster para forçar atualização da prévia do WhatsApp
      const linkWithCacheBuster = `${shareLink}&v=${Date.now()}`;
      navigator.clipboard.writeText(linkWithCacheBuster);
      toast({
        title: 'Link copiado!',
        description: 'O link da pesquisa foi copiado para a área de transferência.',
      });
    }
  };

  const handleSendWhatsApp = () => {
    if (!shareLink) return;
    
    // Adiciona cache-buster para forçar atualização da prévia do WhatsApp
    const linkWithCacheBuster = `${shareLink}&v=${Date.now()}`;
    
    const message = `Olá! 😊

Você pode responder uma pesquisa rápida sobre o imóvel que visitou? Leva menos de 1 minuto:

${linkWithCacheBuster}

Agradecemos seu feedback!`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const response = survey?.survey_responses?.[0];

  const ratingLabels: Record<string, string> = {
    rating_location: 'Localização',
    rating_size: 'Tamanho',
    rating_layout: 'Planta',
    rating_finishes: 'Acabamentos',
    rating_conservation: 'Conservação',
    rating_common_areas: 'Áreas comuns',
    rating_price: 'Preço',
  };

  const getStatusBadge = () => {
    if (!survey) return null;
    
    switch (survey.status) {
      case 'sent':
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-600">
            <Clock className="h-3 w-3 mr-1" />
            Aguardando resposta
          </Badge>
        );
      case 'responded':
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Respondida
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-purple-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Pesquisa Pós-Visita</CardTitle>
                <CardDescription>Colete feedback do cliente sobre o imóvel</CardDescription>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          {!survey ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <p className="text-sm text-muted-foreground text-center">
                Envie uma pesquisa rápida para {compradorNome || 'o cliente'} avaliar o imóvel visitado.
              </p>
              <Button 
                onClick={handleCreateAndSend}
                disabled={createSurveyMutation.isPending}
              >
                {createSurveyMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Enviar Pesquisa
              </Button>
            </div>
          ) : survey.status === 'sent' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  Enviada em {survey.sent_at && format(new Date(survey.sent_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyLink}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Link
                </Button>
                <Button variant="outline" size="sm" onClick={handleSendWhatsApp}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Reenviar via WhatsApp
                </Button>
                <Button variant="ghost" size="sm" onClick={() => window.open(viewLink!, '_blank')}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visualizar
                </Button>
              </div>
            </div>
          ) : survey.status === 'responded' && response ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>
                  Respondida em {survey.responded_at && format(new Date(survey.responded_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
              
              {/* Quick summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="text-center p-3 rounded-lg bg-muted">
                  <p className="text-2xl font-bold text-primary">
                    {(
                      (response.rating_location + response.rating_size + response.rating_layout + 
                       response.rating_finishes + response.rating_conservation + 
                       response.rating_common_areas + response.rating_price) / 7
                    ).toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">Média geral</p>
                </div>
                <div className={`text-center p-3 rounded-lg ${response.would_buy ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  <p className={`text-lg font-bold ${response.would_buy ? 'text-green-600' : 'text-red-600'}`}>
                    {response.would_buy ? 'Sim' : 'Não'}
                  </p>
                  <p className="text-xs text-muted-foreground">Compraria?</p>
                </div>
              </div>

              <Button variant="outline" onClick={() => setShowResponseDialog(true)}>
                Ver detalhes da resposta
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Send Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Pesquisa</DialogTitle>
            <DialogDescription>
              Escolha como deseja enviar a pesquisa para {compradorNome || 'o cliente'}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Imóvel: <span className="font-medium text-foreground">{imovelEndereco}</span>
            </p>

            <div className="flex flex-col gap-3">
              <Button onClick={handleCopyLink} variant="outline" className="justify-start">
                <Copy className="h-4 w-4 mr-2" />
                Copiar link da pesquisa
              </Button>
              <Button onClick={handleSendWhatsApp} className="justify-start bg-green-600 hover:bg-green-700">
                <MessageCircle className="h-4 w-4 mr-2" />
                Enviar via WhatsApp
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Response Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Resposta da Pesquisa</DialogTitle>
            <DialogDescription>
              Feedback de {survey?.client_name || compradorNome || 'cliente'}
            </DialogDescription>
          </DialogHeader>

          {response && (
            <div className="space-y-6 py-4">
              {/* Ratings */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Avaliações</h4>
                <div className="space-y-2">
                {Object.entries(ratingLabels).map(([key, label]) => {
                    const ratingValue = response[key as keyof SurveyResponse];
                    const numericValue = typeof ratingValue === 'number' ? ratingValue : 0;
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{label}</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= numericValue 
                                  ? 'fill-amber-400 text-amber-400' 
                                  : 'text-muted'
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm font-medium">
                            {numericValue}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Would Buy */}
              <div className={`p-4 rounded-lg ${response.would_buy ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                <p className="text-sm font-medium">Compraria este imóvel?</p>
                <p className={`text-lg font-bold ${response.would_buy ? 'text-green-600' : 'text-red-600'}`}>
                  {response.would_buy ? 'Sim' : 'Não'}
                </p>
              </div>

              {/* Comments */}
              {response.liked_most && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">O que mais gostou:</p>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">{response.liked_most}</p>
                </div>
              )}

              {response.liked_least && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">O que menos gostou:</p>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">{response.liked_least}</p>
                </div>
              )}

              <p className="text-xs text-muted-foreground text-center">
                Respondido em {format(new Date(response.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResponseDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
