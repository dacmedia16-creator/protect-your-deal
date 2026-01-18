import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { SurveyRatingButtons } from '@/components/SurveyRatingButtons';
import { Loader2, CheckCircle, AlertCircle, MapPin, Calendar, User, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SurveyData {
  survey: {
    id: string;
    status: string;
    client_name: string | null;
  };
  ficha: {
    imovel_endereco: string;
    imovel_tipo: string;
    data_visita: string;
    comprador_nome: string | null;
  } | null;
  corretor_nome: string | null;
  imobiliaria_nome: string | null;
}

interface RatingItem {
  key: string;
  label: string;
  value: number | null;
}

export default function SurveyPublic() {
  const { token } = useParams<{ token: string }>();
  
  const [ratings, setRatings] = useState<Record<string, number | null>>({
    rating_location: null,
    rating_size: null,
    rating_layout: null,
    rating_finishes: null,
    rating_conservation: null,
    rating_common_areas: null,
    rating_price: null,
  });
  const [likedMost, setLikedMost] = useState('');
  const [likedLeast, setLikedLeast] = useState('');
  const [wouldBuy, setWouldBuy] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Fetch survey data
  const { data: surveyData, isLoading, error } = useQuery({
    queryKey: ['survey-public', token],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<SurveyData>('get-survey-by-token', {
        body: { token },
      });
      
      if (error) {
        const errorData = data as { error?: string; code?: string } | null;
        throw new Error(errorData?.error || error.message || 'Erro ao carregar pesquisa');
      }
      
      return data;
    },
    enabled: !!token,
    retry: false,
  });

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      const response = await supabase.functions.invoke('submit-survey-response', {
        body: {
          token,
          ...ratings,
          liked_most: likedMost || null,
          liked_least: likedLeast || null,
          would_buy: wouldBuy === 'yes',
        },
      });
      
      if (response.error) {
        const errorData = response.data as { error?: string } | null;
        throw new Error(errorData?.error || response.error.message || 'Erro ao enviar resposta');
      }
      
      return response.data;
    },
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const ratingItems: RatingItem[] = [
    { key: 'rating_location', label: 'Localização do imóvel', value: ratings.rating_location },
    { key: 'rating_size', label: 'Tamanho', value: ratings.rating_size },
    { key: 'rating_layout', label: 'Planta do imóvel (disposição dos cômodos)', value: ratings.rating_layout },
    { key: 'rating_finishes', label: 'Qualidade / Acabamentos', value: ratings.rating_finishes },
    { key: 'rating_conservation', label: 'Estado de Conservação', value: ratings.rating_conservation },
    { key: 'rating_common_areas', label: 'Áreas comuns', value: ratings.rating_common_areas },
    { key: 'rating_price', label: 'Preço', value: ratings.rating_price },
  ];

  const handleRatingChange = (key: string, value: number) => {
    setRatings(prev => ({ ...prev, [key]: value }));
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    ratingItems.forEach(item => {
      if (item.value === null) {
        errors.push(`Avalie "${item.label}"`);
      }
    });
    
    if (wouldBuy === null) {
      errors.push('Responda se compraria este imóvel');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    submitMutation.mutate();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Carregando pesquisa...</p>
        </div>
      </div>
    );
  }

  // Error states
  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    const isNotFound = errorMessage.includes('não encontrada');
    const isExpired = errorMessage.includes('expirou');
    const isAlreadyResponded = errorMessage.includes('já foi respondida');

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className={`h-12 w-12 mx-auto mb-4 ${isAlreadyResponded ? 'text-green-500' : 'text-destructive'}`} />
            <h2 className="text-xl font-semibold mb-2">
              {isAlreadyResponded ? 'Pesquisa já respondida' : isNotFound ? 'Pesquisa não encontrada' : isExpired ? 'Pesquisa expirada' : 'Erro'}
            </h2>
            <p className="text-muted-foreground">
              {isAlreadyResponded 
                ? 'Você já respondeu esta pesquisa. Obrigado pelo seu feedback!'
                : isExpired 
                  ? 'O prazo para responder esta pesquisa expirou.'
                  : errorMessage
              }
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-2xl font-semibold mb-2">Obrigado!</h2>
            <p className="text-muted-foreground">
              Sua resposta foi registrada com sucesso. Agradecemos pelo seu feedback!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Pesquisa do Imóvel Visitado
          </h1>
          <p className="text-muted-foreground">
            Por favor, avalie sua experiência com o imóvel
          </p>
        </div>

        {/* Property Info Card */}
        {surveyData?.ficha && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Imóvel</p>
                    <p className="font-medium">{surveyData.ficha.imovel_endereco}</p>
                    <p className="text-sm text-muted-foreground">{surveyData.ficha.imovel_tipo}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Data da visita</p>
                    <p className="font-medium">
                      {format(new Date(surveyData.ficha.data_visita), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                {surveyData.corretor_nome && (
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Corretor</p>
                      <p className="font-medium">{surveyData.corretor_nome}</p>
                    </div>
                  </div>
                )}

                {surveyData.imobiliaria_nome && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Imobiliária</p>
                      <p className="font-medium">{surveyData.imobiliaria_nome}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Survey Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Avaliação do Imóvel</CardTitle>
              <CardDescription>
                Avalie cada item de 1 (ruim) a 5 (excelente)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Rating Items */}
              {ratingItems.map((item) => (
                <div key={item.key} className="space-y-2">
                  <Label className="text-sm font-medium">{item.label}</Label>
                  <SurveyRatingButtons
                    value={item.value}
                    onChange={(value) => handleRatingChange(item.key, value)}
                    disabled={submitMutation.isPending}
                  />
                </div>
              ))}

              {/* Text Fields */}
              <div className="space-y-2">
                <Label htmlFor="liked-most">O que mais gostou? (opcional)</Label>
                <Textarea
                  id="liked-most"
                  value={likedMost}
                  onChange={(e) => setLikedMost(e.target.value)}
                  placeholder="Conte o que mais chamou sua atenção positivamente..."
                  disabled={submitMutation.isPending}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="liked-least">O que menos gostou? (opcional)</Label>
                <Textarea
                  id="liked-least"
                  value={likedLeast}
                  onChange={(e) => setLikedLeast(e.target.value)}
                  placeholder="Conte o que poderia ser melhor..."
                  disabled={submitMutation.isPending}
                  rows={3}
                />
              </div>

              {/* Would Buy */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Compraria este imóvel?</Label>
                <RadioGroup
                  value={wouldBuy || ''}
                  onValueChange={setWouldBuy}
                  disabled={submitMutation.isPending}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="would-buy-yes" />
                    <Label htmlFor="would-buy-yes" className="cursor-pointer">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="would-buy-no" />
                    <Label htmlFor="would-buy-no" className="cursor-pointer">Não</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="text-sm font-medium text-destructive mb-2">
                    Por favor, preencha os campos obrigatórios:
                  </p>
                  <ul className="text-sm text-destructive list-disc list-inside">
                    {validationErrors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Submit Error */}
              {submitMutation.error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="text-sm text-destructive">
                    {submitMutation.error instanceof Error 
                      ? submitMutation.error.message 
                      : 'Erro ao enviar resposta'}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Resposta'
                )}
              </Button>
            </CardContent>
          </Card>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          VisitaSegura © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
