import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, CheckCircle2, FileText, ArrowRight, Sparkles, Building2, Clock } from 'lucide-react';

const steps = [
  {
    icon: FileText,
    title: 'Crie seu primeiro registro de visita',
    description: 'Registre visitas a imóveis com segurança jurídica e confirmação via WhatsApp.',
    action: '/fichas/nova',
    actionText: 'Criar Registro',
  },
];

export default function CadastroConcluido() {
  const [searchParams] = useSearchParams();
  const isVinculado = searchParams.get('vinculado') === 'true';
  const imobiliariaNome = searchParams.get('imobiliaria');

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <span className="font-display font-bold text-2xl">VisitaProva</span>
        </div>

        {/* Success Card */}
        <Card className="max-w-2xl mx-auto mb-8 border-primary/20 bg-primary/5">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Cadastro Concluído!</h1>
            <p className="text-muted-foreground">
              Sua conta foi criada com sucesso. {isVinculado ? 'Aguarde a ativação pelo administrador.' : 'Agora você pode começar a usar o VisitaProva.'}
            </p>
          </CardContent>
        </Card>

        {/* Conditional content based on vinculado status */}
        {isVinculado ? (
          // Linked to agency - show waiting for activation panel
          <Card className="max-w-2xl mx-auto mb-8 border-amber-500/30 bg-amber-500/5">
            <CardHeader className="text-center pb-2">
              <div className="inline-flex items-center gap-2 justify-center mb-2">
                <Building2 className="h-5 w-5 text-amber-600" />
                <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  Vinculado à Imobiliária
                </span>
              </div>
              <CardTitle className="text-xl">{imobiliariaNome || 'Imobiliária'}</CardTitle>
              <CardDescription>
                Sua conta está vinculada a esta imobiliária
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex items-center justify-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <Clock className="h-6 w-6 text-amber-600 flex-shrink-0" />
                <div className="text-left">
                  <p className="font-medium text-amber-700 dark:text-amber-400">Aguardando Ativação</p>
                  <p className="text-sm text-muted-foreground">
                    O administrador da imobiliária precisa ativar sua conta antes que você possa acessar o sistema.
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Entre em contato com o administrador da sua imobiliária para solicitar a ativação.
              </p>
            </CardContent>
          </Card>
        ) : (
          // Autonomous - show free plan info
          <Card className="max-w-2xl mx-auto mb-8">
            <CardHeader className="text-center pb-2">
              <div className="inline-flex items-center gap-2 justify-center mb-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                  Plano Gratuito Ativo
                </span>
              </div>
              <CardTitle>Seus recursos disponíveis</CardTitle>
              <CardDescription>
                Explore o sistema com os recursos inclusos no seu plano
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-primary">2</div>
                  <div className="text-xs text-muted-foreground">Registros/mês</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-primary">1</div>
                  <div className="text-xs text-muted-foreground">Corretor</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Steps - only for autonomous users */}
        {!isVinculado && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold mb-4 text-center">Próximo passo</h2>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-4 p-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <step.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium">{step.title}</h3>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                      <Button variant="ghost" size="sm" asChild className="flex-shrink-0">
                        <Link to={step.action}>
                          {step.actionText}
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="max-w-2xl mx-auto mt-8 text-center space-y-4">
          <Button size="lg" asChild>
            <Link to="/auth">
              {isVinculado ? 'Ir para o Login' : 'Fazer Login e Começar'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          {!isVinculado && (
            <p className="text-sm text-muted-foreground">
              Precisa de mais recursos?{' '}
              <Link to="/empresa/assinatura" className="text-primary hover:underline">
                Conheça nossos planos
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
