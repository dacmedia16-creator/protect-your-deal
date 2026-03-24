import { useEffect, useState } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { getRedirectPathByRole } from '@/lib/roleRedirect';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogoIcon } from '@/components/LogoIcon';
import { WhatsAppFAB } from '@/components/WhatsAppFAB';
import { DepoimentosSection } from '@/components/DepoimentosSection';
import MobileAppMockup from '@/components/mockups/MobileAppMockup';
import SofiaMockup from '@/components/mockups/SofiaMockup';
import AnimatedSection from '@/components/AnimatedSection';
import {
  FileCheck, 
  MessageSquare, 
  QrCode, 
  Users, 
  CheckCircle2,
  ClipboardCheck,
  Send,
  Download,
  Check,
  HelpCircle,
  Smartphone,
  Menu,
  MapPin,
  Phone,
  Star,
  Wand2,
  Shield,
  Award,
  Scale,
  FileX,
  Building,
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
  valor_anual: number | null;
  tipo_cadastro: string | null;
}

const Index = () => {
  const { user, loading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loadingPlanos, setLoadingPlanos] = useState(true);
  const [pricingCiclo, setPricingCiclo] = useState<'mensal' | 'anual'>('mensal');

  useEffect(() => {
    const fetchPlanos = async () => {
      const { data } = await supabase
        .from('planos')
        .select('*')
        .eq('ativo', true)
        .order('valor_mensal', { ascending: true });
      
      if (data) {
        setPlanos(data);
      }
      setLoadingPlanos(false);
    };
    
    fetchPlanos();
  }, []);

  if (loading || (user && roleLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Proposta de Valor - 4 benefícios diretos
  const valuePropositions = [
    {
      icon: Shield,
      title: 'Evite conflitos de comissão',
      description: 'Tenha prova documental de que foi você quem apresentou o imóvel ao comprador.'
    },
    {
      icon: FileCheck,
      title: 'Comprove cada visita',
      description: 'Registro com confirmação das duas partes via WhatsApp, com data, hora e aceite legal.'
    },
    {
      icon: Award,
      title: 'Mais profissionalismo',
      description: 'Impressione proprietários e compradores com um processo moderno e organizado.'
    },
    {
      icon: Scale,
      title: 'Segurança jurídica',
      description: 'Comprovante com QR Code verificável e protocolo único para cada visita.'
    }
  ];

  // Comparativo Papel vs VisitaProva
  const comparisons = [
    { paper: 'Pode ser contestada ou perdida', visitaprova: 'Registro digital com backup automático' },
    { paper: 'Sem validação das partes', visitaprova: 'Confirmação OTP via WhatsApp' },
    { paper: 'Difícil comprovar autenticidade', visitaprova: 'QR Code + Protocolo único verificável' },
    { paper: 'Informações incompletas', visitaprova: 'Formulário padronizado e completo' },
    { paper: 'Demora para localizar', visitaprova: 'Busca instantânea por cliente ou imóvel' }
  ];

  const features = [
    {
      icon: FileCheck,
      title: 'Nunca mais perca uma ficha',
      description: 'Todos os dados organizados na nuvem, acessíveis de qualquer lugar, a qualquer hora.'
    },
    {
      icon: MessageSquare,
      title: 'Prova irrefutável',
      description: 'Proprietário e comprador confirmam a visita via WhatsApp com código único.'
    },
    {
      icon: QrCode,
      title: 'Autenticidade verificável',
      description: 'Qualquer pessoa pode escanear o QR Code e confirmar a validade do comprovante.'
    },
    {
      icon: Download,
      title: 'Documento profissional',
      description: 'PDF pronto para apresentar em qualquer negociação ou disputa de comissão.'
    },
    {
      icon: Users,
      title: 'Trabalho em parceria',
      description: 'Divida visitas com outros corretores mantendo proteção jurídica para ambos.'
    },
    {
      icon: Smartphone,
      title: 'App no seu celular',
      description: 'Instale o app e acesse seus registros rapidamente, de qualquer lugar.'
    },
    {
      icon: Star,
      title: 'Feedback automático',
      description: 'Receba avaliações dos compradores após cada visita, direto no WhatsApp.'
    },
    {
      icon: Wand2,
      title: 'Assistente Sofia',
      description: 'IA que te ajuda a usar o sistema, responde dúvidas e sugere ações.'
    }
  ];

  const steps = [
    {
      icon: ClipboardCheck,
      number: '01',
      title: 'Crie o Registro',
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
      <SEOHead 
        title="VisitaProva - Comprove Visitas Imobiliárias com WhatsApp OTP"
        description="Registre visitas imobiliárias com confirmação via WhatsApp. Ficha de visita digital, comprovante PDF com QR Code e prova de intermediação para corretores."
        keywords="ficha de visita digital, comprovante de visita imobiliária, prova de intermediação, corretor de imóveis, OTP WhatsApp"
      />
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoIcon size={28} />
            <span className="font-heading text-xl font-bold">VisitaProva</span>
          </div>
          
          {/* Navigation Links - Desktop */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              to="/funcionalidades" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Funcionalidades
            </Link>
            <Link 
              to="/como-funciona" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Como Funciona
            </Link>
            <Link 
              to="/tutoriais" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Tutoriais
            </Link>
            <Link 
              to="/instalar" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Smartphone className="h-4 w-4" />
              Baixar App
            </Link>
            <a 
              href="#planos" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Ver Planos
            </a>
          </nav>
          
          <div className="flex items-center gap-3">
            {/* Desktop buttons */}
            {user ? (
              <Button asChild className="hidden sm:inline-flex">
                <Link to={getRedirectPathByRole(role)}>Meu Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link to="/auth">Entrar</Link>
                </Button>
                <Button asChild className="hidden sm:inline-flex">
                  <a href="https://visitaprova.com.br/registro?plano=gratuito">Testar Grátis Agora</a>
                </Button>
              </>
            )}

            {/* Mobile menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Abrir menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                <div className="flex flex-col gap-6 mt-6">
                  <div className="flex items-center gap-2 pb-4 border-b">
                    <LogoIcon size={24} />
                    <span className="font-heading text-lg font-bold">VisitaProva</span>
                  </div>
                  
                  <nav className="flex flex-col gap-4">
                    <Link 
                      to="/funcionalidades" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-base font-medium text-foreground hover:text-primary transition-colors"
                    >
                      Funcionalidades
                    </Link>
                    <Link 
                      to="/como-funciona" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-base font-medium text-foreground hover:text-primary transition-colors"
                    >
                      Como Funciona
                    </Link>
                    <Link 
                      to="/tutoriais" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-base font-medium text-foreground hover:text-primary transition-colors"
                    >
                      Tutoriais
                    </Link>
                    <Link 
                      to="/instalar" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-base font-medium text-foreground hover:text-primary transition-colors flex items-center gap-2"
                    >
                      <Smartphone className="h-4 w-4" />
                      Baixar App
                    </Link>
                    <a 
                      href="#planos" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-base font-medium text-foreground hover:text-primary transition-colors"
                    >
                      Ver Planos
                    </a>
                  </nav>
                  
                  <div className="flex flex-col gap-3 pt-4 border-t">
                    {user ? (
                      <Button asChild className="w-full">
                        <Link to={getRedirectPathByRole(role)} onClick={() => setMobileMenuOpen(false)}>
                          Meu Dashboard
                        </Link>
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" asChild className="w-full">
                          <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>Entrar</Link>
                        </Button>
                        <Button asChild className="w-full">
                          <a href="https://visitaprova.com.br/registro?plano=gratuito" onClick={() => setMobileMenuOpen(false)}>
                            Testar Grátis Agora
                          </a>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero Section - CRO Otimizado */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto px-4 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text Column */}
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Shield className="h-4 w-4" />
                Proteja sua comissão desde a primeira visita
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold tracking-tight mb-6">
                Prove Suas Visitas.{' '}
                <span className="text-primary">Proteja Sua Comissão.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl md:mx-0 mx-auto">
                Nunca mais perca um cliente por falta de comprovação. 
                Registros digitais com confirmação via WhatsApp e comprovante PDF verificável.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Button size="lg" className="text-base shadow-lg" asChild>
                  <a href="https://visitaprova.com.br/registro?plano=gratuito">
                    Testar Grátis Agora
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="text-base" asChild>
                  <Link to="/como-funciona">Ver Como Funciona</Link>
                </Button>
                <Button size="lg" variant="outline" className="text-base" asChild>
                  <Link to="/tutoriais">📺 Como Usar (Vídeos)</Link>
                </Button>
              </div>
            </div>
            {/* Mockup Column */}
            <div className="flex justify-center md:justify-end">
              <MobileAppMockup />
            </div>
          </div>
        </div>
      </section>

      {/* Proposta de Valor */}
      <section className="py-16 border-b border-border/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-heading font-bold mb-3">
              Por que corretores escolhem o VisitaProva?
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {valuePropositions.map((prop, index) => (
              <div key={index} className="text-center p-6">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <prop.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{prop.title}</h3>
                <p className="text-muted-foreground text-sm">{prop.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Diferenciação - Papel vs VisitaProva */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-heading font-bold mb-3">
              Ficha de papel vs VisitaProva
            </h2>
            <p className="text-muted-foreground">
              Compare e veja por que o digital é a escolha certa
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-2 gap-4">
              {/* Header */}
              <div className="p-4 bg-destructive/10 rounded-t-lg border border-destructive/20">
                <div className="flex items-center gap-2 justify-center">
                  <FileX className="h-5 w-5 text-destructive" />
                  <span className="font-semibold text-destructive">Ficha de Papel</span>
                </div>
              </div>
              <div className="p-4 bg-primary/10 rounded-t-lg border border-primary/20">
                <div className="flex items-center gap-2 justify-center">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-primary">VisitaProva</span>
                </div>
              </div>
              {/* Rows */}
              {comparisons.map((comp, index) => (
                <>
                  <div key={`paper-${index}`} className="p-4 bg-card border border-border/50 text-sm text-muted-foreground">
                    {comp.paper}
                  </div>
                  <div key={`vp-${index}`} className="p-4 bg-card border border-border/50 text-sm font-medium">
                    {comp.visitaprova}
                  </div>
                </>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Benefícios */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Tudo que você precisa para trabalhar com segurança
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Funcionalidades pensadas para proteger sua comissão e facilitar seu dia a dia.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      <section id="como-funciona" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Como Funciona
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Em 4 passos simples, você garante a segurança jurídica das suas visitas.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
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
          
          {/* Micro-copy de autoridade */}
          <div className="max-w-2xl mx-auto text-center p-6 rounded-xl bg-card border border-primary/20">
            <Scale className="h-8 w-8 text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Registro digital com validade como prova documental.</strong><br />
              Cada comprovante possui protocolo único e QR Code para verificação instantânea.
            </p>
          </div>
        </div>
      </section>

      {/* Prova Social / Autoridade */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Building className="h-4 w-4" />
              Feito para a realidade do mercado imobiliário
            </div>
            <p className="text-lg text-muted-foreground mb-4">
              Desenvolvido em parceria com corretores ativos para resolver problemas reais do dia a dia.
            </p>
            <p className="text-sm text-muted-foreground/80">
              Utilizado por corretores e imobiliárias que valorizam segurança e profissionalismo.
            </p>
          </div>
        </div>
      </section>

      {/* Para Imobiliárias */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Building className="h-4 w-4" />
              Para Imobiliárias
            </div>
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Gestão completa da sua equipe de corretores
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="bg-card border p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Controle em tempo real</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Tenha controle em tempo real de quais clientes sua equipe está atendendo.
              </p>
            </Card>
            <Card className="bg-card border p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Proteção do histórico</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Fim do roubo de clientes: se um corretor sair da imobiliária, o histórico de visitas e a prova de intermediação ficam com a empresa.
              </p>
            </Card>
          </div>
          <div className="text-center mt-10">
            <Link to="/para-imobiliarias">
              <Button size="lg" className="gap-2">
                <Building className="h-5 w-5" />
                Saiba mais
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Sofia AI Assistant Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Text */}
              <div className="text-center md:text-left space-y-6">
                <Badge variant="secondary" className="gap-1.5">
                  <Wand2 className="h-3.5 w-3.5" />
                  Assistente IA
                </Badge>
                <h2 className="text-3xl md:text-4xl font-heading font-bold">
                  Conheça a Sofia: Sua Assistente Inteligente
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  A Sofia é sua assistente virtual integrada ao sistema. Ela conhece cada funcionalidade do VisitaProva e está pronta para te ajudar em tempo real.
                </p>
                <ul className="space-y-3 text-left">
                  {[
                    'Ajuda contextual em cada página',
                    'Disponível 24/7, sem espera',
                    'Respostas instantâneas sobre o sistema',
                    'Sugere próximos passos e ações',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mockup */}
              <div className="flex justify-center md:justify-end">
                <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-4 shadow-xl">
                  <SofiaMockup />
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Planos e Preços
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-6">
              Escolha o plano ideal para você ou sua imobiliária.
            </p>
            {/* Toggle Mensal/Anual */}
            {planos.some(p => p.valor_anual && p.valor_anual > 0) && (
              <div className="inline-flex items-center gap-1 bg-muted rounded-full p-1">
                <button
                  onClick={() => setPricingCiclo('mensal')}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                    pricingCiclo === 'mensal' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Mensal
                </button>
                <button
                  onClick={() => setPricingCiclo('anual')}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                    pricingCiclo === 'anual' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Anual
                  <Badge variant="outline" className="ml-1.5 text-[10px] py-0 border-primary/30 text-primary">Economize</Badge>
                </button>
              </div>
            )}
          </div>

          {loadingPlanos ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-center mb-8">
                {planos.map((plano) => {
                  const isIndividual = plano.nome.toLowerCase().includes('individual');
                  const profileHint = plano.valor_mensal === 0 
                    ? 'Ideal para começar' 
                    : isIndividual 
                      ? 'Ideal para corretores autônomos'
                      : plano.max_corretores > 1 
                        ? 'Ideal para imobiliárias em crescimento' 
                        : '';
                  
                  return (
                    <Card key={plano.id} className={`relative overflow-hidden hover:shadow-lg transition-shadow ${isIndividual ? 'ring-2 ring-primary' : ''}`}>
                      {/* Badge "Mais escolhido" para plano Individual */}
                      {isIndividual && (
                        <Badge className="absolute -top-0 left-1/2 -translate-x-1/2 translate-y-3 bg-primary text-primary-foreground z-10">
                          Mais escolhido
                        </Badge>
                      )}
                      {plano.valor_mensal === 0 && !isIndividual && (
                        <div className="absolute top-3 right-3">
                          <Badge variant="success">Grátis</Badge>
                        </div>
                      )}
                      <CardHeader className={isIndividual ? 'pt-10' : ''}>
                        <CardTitle className="text-xl">{plano.nome}</CardTitle>
                        <CardDescription>{plano.descricao}</CardDescription>
                        {profileHint && (
                          <p className="text-xs text-primary font-medium mt-1">{profileHint}</p>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-3xl font-bold">
                          {plano.valor_mensal === 0 ? (
                            'Grátis'
                          ) : plano.valor_mensal === -1 ? (
                            <span className="text-lg">Sob consulta</span>
                          ) : pricingCiclo === 'anual' && plano.valor_anual ? (
                            <>
                              R$ {plano.valor_anual.toFixed(2).replace('.', ',')}
                              <span className="text-sm font-normal text-muted-foreground">/ano</span>
                              <div className="text-sm font-normal text-emerald-600 mt-1">
                                Economia de {Math.round((1 - plano.valor_anual / (plano.valor_mensal * 12)) * 100)}%
                              </div>
                            </>
                          ) : (
                            <>
                              R$ {plano.valor_mensal.toFixed(2).replace('.', ',')}
                              <span className="text-sm font-normal text-muted-foreground">/mês</span>
                            </>
                          )}
                        </div>
                        
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-primary" />
                            {plano.max_fichas_mes === -1 ? 'Fichas ilimitadas' : `${plano.max_fichas_mes} fichas/mês`}
                          </li>
                          {plano.max_corretores > 1 && (
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-primary" />
                              {plano.max_corretores === -1 ? 'Corretores ilimitados' : `${plano.max_corretores} corretor(es)`}
                            </li>
                          )}
                        </ul>

                        <Button className="w-full" variant={isIndividual ? 'default' : 'outline'} asChild>
                          <Link to={`/registro/tipo?plano=${plano.nome.toLowerCase().replace(/\s+/g, '-')}`}>
                            {plano.valor_mensal === 0 ? 'Testar Grátis Agora' : 'Escolher Plano'}
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              {/* Frase de reforço */}
              <p className="text-center text-muted-foreground font-medium">
                Menos risco. Mais controle. Mais profissionalismo.
              </p>
            </>
          )}
        </div>
      </section>

      {/* Depoimentos Section */}
      <DepoimentosSection />

      {/* FAQ Section */}
      <section id="faq" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <HelpCircle className="h-4 w-4" />
              Tire suas dúvidas
            </div>
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Encontre respostas para as dúvidas mais comuns sobre o VisitaProva.
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem value="item-1" className="border rounded-lg px-6 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline">
                  O que é o VisitaProva?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  O VisitaProva é uma plataforma digital para corretores de imóveis criarem registros de visita 
                  com confirmação via WhatsApp. Proprietários e compradores confirmam a visita através de um 
                  código OTP, gerando um comprovante PDF com QR Code para verificação de autenticidade.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2" className="border rounded-lg px-6 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline">
                  Como funciona a confirmação via OTP?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Após criar o registro de visita, você envia códigos de confirmação para o proprietário e o 
                  comprador via WhatsApp. Cada um recebe um código único que deve ser inserido na plataforma 
                  para confirmar a visita. Isso garante que ambas as partes concordaram com os termos.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3" className="border rounded-lg px-6 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline">
                  O plano gratuito tem alguma limitação?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  O plano gratuito é ideal para corretores autônomos que estão começando. Ele oferece 
                  recursos básicos para gerenciar suas visitas. Para recursos avançados, mais registros por mês 
                  ou gestão de equipe, você pode fazer upgrade para um plano pago a qualquer momento.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4" className="border rounded-lg px-6 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline">
                  Posso cancelar minha assinatura a qualquer momento?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Sim! Você pode cancelar sua assinatura a qualquer momento sem taxas ou multas. Após o 
                  cancelamento, você ainda terá acesso ao plano pago até o final do período já pago, 
                  e depois será automaticamente migrado para o plano gratuito.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-5" className="border rounded-lg px-6 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline">
                  O comprovante PDF tem validade jurídica?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  O comprovante serve como prova de que a visita foi agendada e confirmada por ambas as partes, 
                  com registro de data, hora, CPF e aceite legal. O QR Code permite verificar a autenticidade 
                  do documento. Recomendamos consultar um advogado para casos específicos.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-6" className="border rounded-lg px-6 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline">
                  Como faço para adicionar corretores à minha imobiliária?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Se você tem um plano de imobiliária, pode convidar corretores pelo painel de administração. 
                  Basta enviar um convite por e-mail e o corretor poderá criar sua conta vinculada à sua 
                  imobiliária. Você terá acesso às fichas e relatórios de toda a equipe.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7" className="border rounded-lg px-6 bg-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline">
                  O VisitaProva tem aplicativo para celular?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Sim! O VisitaProva pode ser instalado no seu celular como um app. Basta acessar pelo 
                  navegador e seguir as instruções para adicionar à tela inicial. Funciona em Android, 
                  iPhone e também no computador, com acesso rápido às suas fichas de visita.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* App Section */}
      <section className="py-16 bg-gradient-to-r from-emerald-500/10 via-primary/5 to-emerald-500/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-primary flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Smartphone className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-heading font-bold mb-4">
              Leve o VisitaProva no seu bolso
            </h2>
            <p className="text-muted-foreground text-lg mb-6 max-w-xl mx-auto">
              Instale nosso app e tenha acesso instantâneo às suas fichas de visita. 
              Funciona em Android, iPhone e computador.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-emerald-500" />
                Acesso rápido
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-emerald-500" />
                Funciona offline
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-emerald-500" />
                Notificações
              </div>
            </div>
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white" asChild>
              <Link to="/instalar">
                <Smartphone className="h-5 w-5 mr-2" />
                Instalar App
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section - Emocional */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary-foreground mb-4">
            Trabalhe com mais segurança desde a primeira visita
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
            Pare de depender de papéis que se perdem. 
            Comece a construir sua carteira com provas sólidas.
          </p>
          <Button size="lg" variant="secondary" className="text-base" asChild>
            <Link to="/registro-autonomo?plano=gratuito">
              Testar Grátis Agora
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Logo e nome */}
            <div className="flex flex-col items-center md:items-start gap-2">
              <div className="flex items-center gap-2">
                <LogoIcon size={24} />
                <span className="font-heading font-bold">VisitaProva</span>
              </div>
              <p className="text-sm text-muted-foreground text-center md:text-left">
                Segurança e praticidade para corretores de imóveis
              </p>
            </div>
            
            {/* Contato */}
            <div className="flex flex-col items-center md:items-start gap-3">
              <h3 className="font-semibold text-sm">Contato</h3>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <span className="text-center md:text-left">
                  Rua Horacio Cenci, 9 - Parque Campolim<br/>
                  Sorocaba - SP, 18047-800
                </span>
              </div>
              <a 
                href="tel:+5515981788214" 
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Phone className="h-4 w-4 text-primary" />
                (15) 98178-8214
              </a>
              <a 
                href="https://wa.me/5515981788214" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-green-500 transition-colors"
              >
                <MessageSquare className="h-4 w-4 text-green-500" />
                WhatsApp
              </a>
            </div>
            
            {/* Links */}
            <div className="flex flex-col items-center md:items-start gap-3">
              <h3 className="font-semibold text-sm">Links</h3>
              <Link to="/termos-de-uso" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Termos de Uso
              </Link>
              <Link to="/politica-privacidade" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Política de Privacidade
              </Link>
              <Link to="/tutoriais" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Tutoriais
              </Link>
              <Link to="/afiliados" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Seja um Afiliado
              </Link>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="pt-8 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} VisitaProva. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>

      <WhatsAppFAB />
    </div>
  );
};

export default Index;
