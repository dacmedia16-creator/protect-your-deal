import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { getRedirectPathByRole } from '@/lib/roleRedirect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, 
  FileCheck, 
  MessageSquare, 
  QrCode, 
  Users, 
  CheckCircle2,
  ArrowRight,
  ClipboardCheck,
  Send,
  Download,
  Check,
  Sparkles
} from 'lucide-react';

interface Plano {
  id: string;
  nome: string;
  descricao: string | null;
  max_corretores: number;
  max_fichas_mes: number;
  max_clientes: number;
  max_imoveis: number;
  valor_mensal: number;
}

const Index = () => {
  const { user, loading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [planos, setPlanos] = useState<Plano[]>([]);

  useEffect(() => {
    async function fetchPlanos() {
      const { data } = await supabase
        .from('planos')
        .select('*')
        .eq('ativo', true)
        .order('valor_mensal', { ascending: true });
      setPlanos(data || []);
    }
    fetchPlanos();
  }, []);

  useEffect(() => {
    if (!loading && !roleLoading && user && role) {
      navigate(getRedirectPathByRole(role));
    }
  }, [user, loading, role, roleLoading, navigate]);

  if (loading || (user && roleLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const features = [
    {
      icon: FileCheck,
      title: 'Fichas Digitais',
      description: 'Crie fichas de visita completas com todos os dados do imóvel, comprador e proprietário.'
    },
    {
      icon: MessageSquare,
      title: 'Confirmação via OTP',
      description: 'Envie códigos de confirmação via WhatsApp para ambas as partes com segurança.'
    },
    {
      icon: QrCode,
      title: 'QR Code de Verificação',
      description: 'Cada comprovante possui um QR Code único para verificação de autenticidade.'
    },
    {
      icon: Users,
      title: 'CRM Integrado',
      description: 'Gerencie seus clientes, proprietários e compradores em um só lugar.'
    },
    {
      icon: Shield,
      title: 'Protocolo Único',
      description: 'Cada visita recebe um protocolo exclusivo para rastreabilidade completa.'
    },
    {
      icon: Download,
      title: 'Comprovante PDF',
      description: 'Gere comprovantes profissionais em PDF após a confirmação de ambas as partes.'
    }
  ];

  const steps = [
    {
      icon: ClipboardCheck,
      number: '01',
      title: 'Crie a Ficha',
      description: 'Preencha os dados do imóvel, proprietário e comprador interessado.'
    },
    {
      icon: Send,
      number: '02',
      title: 'Envie o OTP',
      description: 'Dispare códigos de confirmação via WhatsApp para proprietário e comprador.'
    },
    {
      icon: CheckCircle2,
      number: '03',
      title: 'Aguarde Confirmação',
      description: 'Ambas as partes confirmam a visita inserindo o código recebido.'
    },
    {
      icon: Download,
      number: '04',
      title: 'Baixe o Comprovante',
      description: 'Com a confirmação completa, baixe o PDF com QR Code de verificação.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            <span className="font-heading text-xl font-bold">VisitaSegura</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/registro?plano=gratuito">Teste Grátis</Link>
            </Button>
            <Button asChild>
              <Link to="/registro">Cadastrar</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Shield className="h-4 w-4" />
              Segurança e praticidade para corretores
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold tracking-tight mb-6">
              Fichas de Visita Digitais com{' '}
              <span className="text-primary">Confirmação Segura</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Elimine papéis e ganhe segurança jurídica. Confirme visitas via WhatsApp, 
              gere comprovantes PDF com QR Code e gerencie todos os seus clientes em um só lugar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-base" asChild>
                <Link to="/auth">
                  Começar Agora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base" asChild>
                <a href="#como-funciona">Como Funciona</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Funcionalidades pensadas para facilitar o dia a dia do corretor de imóveis.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-6 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300"
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="como-funciona" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Como Funciona
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Em 4 passos simples, você garante a segurança jurídica das suas visitas.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-6xl font-heading font-bold text-primary/10 absolute -top-4 -left-2">
                  {step.number}
                </div>
                <div className="relative pt-8">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <step.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Planos e Preços
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Escolha o plano ideal para o seu negócio. Comece gratuitamente!
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {planos.slice(0, 4).map((plano) => {
              const isFreePlan = plano.nome.toLowerCase() === 'gratuito' || (plano.valor_mensal === 0 && plano.nome.toLowerCase() !== 'enterprise');
              
              return (
                <Card 
                  key={plano.id} 
                  className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                    isFreePlan 
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-gradient-to-b from-emerald-50/80 to-transparent dark:from-emerald-950/30 dark:to-transparent scale-105 z-10' 
                      : 'hover:border-primary/50'
                  }`}
                >
                  {isFreePlan && (
                    <div className="absolute top-0 left-0 right-0 px-4 py-1.5 bg-emerald-500 text-white text-xs font-medium text-center flex items-center justify-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      Recomendado para começar
                    </div>
                  )}
                  <CardHeader className={isFreePlan ? 'pt-10' : ''}>
                    <CardTitle className={isFreePlan ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                      {plano.nome}
                    </CardTitle>
                    <CardDescription>{plano.descricao}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className={`text-3xl font-bold ${isFreePlan ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary'}`}>
                      {isFreePlan ? (
                        <>
                          Grátis
                          <span className="text-sm font-normal text-muted-foreground ml-1">para sempre</span>
                        </>
                      ) : plano.valor_mensal === 0 ? (
                        'Sob consulta'
                      ) : (
                        <>
                          R$ {plano.valor_mensal.toFixed(2).replace('.', ',')}
                          <span className="text-sm font-normal text-muted-foreground">/mês</span>
                        </>
                      )}
                    </div>

                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className={`h-4 w-4 ${isFreePlan ? 'text-emerald-500' : 'text-primary'}`} />
                        {plano.max_corretores === 999 ? 'Corretores ilimitados' : `Até ${plano.max_corretores} corretor${plano.max_corretores > 1 ? 'es' : ''}`}
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className={`h-4 w-4 ${isFreePlan ? 'text-emerald-500' : 'text-primary'}`} />
                        {plano.max_fichas_mes >= 99999 ? 'Fichas ilimitadas' : `${plano.max_fichas_mes} fichas/mês`}
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className={`h-4 w-4 ${isFreePlan ? 'text-emerald-500' : 'text-primary'}`} />
                        {plano.max_clientes >= 99999 ? 'Clientes ilimitados' : `${plano.max_clientes} clientes`}
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className={`h-4 w-4 ${isFreePlan ? 'text-emerald-500' : 'text-primary'}`} />
                        {plano.max_imoveis >= 99999 ? 'Imóveis ilimitados' : `${plano.max_imoveis} imóveis`}
                      </li>
                    </ul>

                    <Button 
                      className={`w-full ${isFreePlan ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : ''}`}
                      variant={isFreePlan ? 'default' : 'outline'}
                      asChild
                    >
                      <Link to={isFreePlan ? '/registro?plano=gratuito' : '/registro'}>
                        {isFreePlan ? (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Começar Grátis
                          </>
                        ) : (
                          'Escolher Plano'
                        )}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {planos.length > 4 && (
            <div className="text-center mt-8">
              <Button variant="outline" asChild>
                <Link to="/registro">
                  Ver todos os planos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary-foreground mb-4">
            Pronto para modernizar suas visitas?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de corretores que já utilizam o VisitaSegura para 
            garantir segurança e profissionalismo em cada visita.
          </p>
          <Button size="lg" variant="secondary" className="text-base" asChild>
            <Link to="/auth">
              Criar Conta Gratuita
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-heading font-bold">VisitaSegura</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} VisitaSegura. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
