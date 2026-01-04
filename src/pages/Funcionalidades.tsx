import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Shield, 
  FileCheck, 
  MessageSquare, 
  QrCode, 
  Users, 
  Download,
  Smartphone,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  BarChart3,
  Lock,
  Menu
} from 'lucide-react';
import {
  FichaDigitalMockup,
  WhatsAppOTPMockup,
  QRCodeMockup,
  PDFComprovanteMockup,
  CRMMockup,
  MobileAppMockup
} from '@/components/mockups';
import AnimatedSection from '@/components/AnimatedSection';

const Funcionalidades = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const features = [
    {
      id: 'fichas-digitais',
      icon: FileCheck,
      title: 'Fichas de Visita Digitais',
      subtitle: 'Substitua o papel por fichas completas e organizadas',
      description: 'Crie fichas de visita profissionais com todos os dados necessários: informações do imóvel, dados do proprietário e comprador, data e horário da visita. Tudo armazenado de forma segura na nuvem.',
      benefits: [
        'Preenchimento rápido e intuitivo',
        'Dados sempre acessíveis',
        'Histórico completo de visitas',
        'Protocolo único para cada ficha'
      ],
      screenshot: '/placeholder.svg',
      reverse: false
    },
    {
      id: 'confirmacao-otp',
      icon: MessageSquare,
      title: 'Confirmação via WhatsApp',
      subtitle: 'Segurança jurídica com confirmação de ambas as partes',
      description: 'Envie códigos de confirmação (OTP) diretamente para o WhatsApp do proprietário e do comprador. Cada um confirma sua participação inserindo o código recebido, garantindo consentimento registrado.',
      benefits: [
        'Envio instantâneo via WhatsApp',
        'Código único e temporário',
        'Registro de data e hora da confirmação',
        'Captura de IP e geolocalização'
      ],
      screenshot: '/placeholder.svg',
      reverse: true
    },
    {
      id: 'qrcode',
      icon: QrCode,
      title: 'QR Code de Verificação',
      subtitle: 'Autenticidade verificável a qualquer momento',
      description: 'Cada comprovante gerado possui um QR Code exclusivo que permite a verificação instantânea da autenticidade do documento. Qualquer pessoa pode escanear e confirmar a validade.',
      benefits: [
        'Verificação instantânea',
        'Proteção contra fraudes',
        'Link direto para validação',
        'Dados imutáveis'
      ],
      screenshot: '/placeholder.svg',
      reverse: false
    },
    {
      id: 'comprovante-pdf',
      icon: Download,
      title: 'Comprovante em PDF',
      subtitle: 'Documento profissional pronto para download',
      description: 'Após a confirmação de ambas as partes, gere um comprovante PDF completo com todas as informações da visita, assinaturas digitais, QR Code e protocolo único. Ideal para arquivo e comprovação.',
      benefits: [
        'Design profissional',
        'Todas as informações reunidas',
        'Download instantâneo',
        'Compartilhamento fácil'
      ],
      screenshot: '/placeholder.svg',
      reverse: true
    },
    {
      id: 'crm',
      icon: Users,
      title: 'CRM Integrado',
      subtitle: 'Gerencie clientes, proprietários e imóveis',
      description: 'Mantenha uma base organizada de todos os seus contatos. Cadastre clientes (compradores e proprietários), imóveis e acompanhe o histórico de interações com cada um.',
      benefits: [
        'Cadastro completo de clientes',
        'Catálogo de imóveis',
        'Tags e categorização',
        'Busca e filtros avançados'
      ],
      screenshot: '/placeholder.svg',
      reverse: false
    },
    {
      id: 'app-mobile',
      icon: Smartphone,
      title: 'App para Celular',
      subtitle: 'Acesse de qualquer lugar, a qualquer hora',
      description: 'Instale o VisitaSegura no seu celular como um aplicativo. Acesse suas fichas, crie novas visitas e gere comprovantes diretamente do seu smartphone, mesmo offline.',
      benefits: [
        'Instalação simples pelo navegador',
        'Funciona em Android e iPhone',
        'Acesso offline',
        'Notificações em tempo real'
      ],
      screenshot: '/placeholder.svg',
      reverse: true
    }
  ];

  const additionalFeatures = [
    {
      icon: ClipboardList,
      title: 'Gestão de Equipe',
      description: 'Gerencie corretores da sua imobiliária, acompanhe fichas e relatórios de cada membro.'
    },
    {
      icon: BarChart3,
      title: 'Relatórios',
      description: 'Visualize estatísticas de visitas, fichas pendentes e confirmadas em dashboards intuitivos.'
    },
    {
      icon: Lock,
      title: 'Segurança',
      description: 'Dados criptografados, backups automáticos e conformidade com LGPD.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            <span className="font-heading text-xl font-bold">VisitaSegura</span>
          </Link>
          
          {/* Navigation Links - Desktop */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              to="/" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Início
            </Link>
            <a 
              href="/#como-funciona" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Como Funciona
            </a>
            <a 
              href="/#planos" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Ver Planos
            </a>
            <Link 
              to="/instalar" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Smartphone className="h-4 w-4" />
              Baixar App
            </Link>
          </nav>
          
          <div className="flex items-center gap-3">
            {/* Desktop buttons */}
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button asChild className="hidden sm:inline-flex">
              <Link to="/registro-autonomo?plano=gratuito">Começar Grátis</Link>
            </Button>

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
                    <Shield className="h-6 w-6 text-primary" />
                    <span className="font-heading text-lg font-bold">VisitaSegura</span>
                  </div>
                  
                  <nav className="flex flex-col gap-4">
                    <Link 
                      to="/" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-base font-medium text-foreground hover:text-primary transition-colors"
                    >
                      Início
                    </Link>
                    <a 
                      href="/#como-funciona" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-base font-medium text-foreground hover:text-primary transition-colors"
                    >
                      Como Funciona
                    </a>
                    <a 
                      href="/#planos" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-base font-medium text-foreground hover:text-primary transition-colors"
                    >
                      Ver Planos
                    </a>
                    <Link 
                      to="/instalar" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-base font-medium text-foreground hover:text-primary transition-colors flex items-center gap-2"
                    >
                      <Smartphone className="h-4 w-4" />
                      Baixar App
                    </Link>
                  </nav>
                  
                  <div className="flex flex-col gap-3 pt-4 border-t">
                    <Button variant="outline" asChild className="w-full">
                      <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>Entrar</Link>
                    </Button>
                    <Button asChild className="w-full">
                      <Link to="/registro-autonomo?plano=gratuito" onClick={() => setMobileMenuOpen(false)}>
                        Começar Grátis
                      </Link>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
        <div className="container mx-auto px-4 text-center">
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Shield className="h-4 w-4" />
              Conheça todos os recursos
            </div>
          </AnimatedSection>
          <AnimatedSection delay={100}>
            <h1 className="text-4xl md:text-5xl font-heading font-bold tracking-tight mb-6">
              Funcionalidades do{' '}
              <span className="text-primary">VisitaSegura</span>
            </h1>
          </AnimatedSection>
          <AnimatedSection delay={200}>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Descubra como cada recurso foi pensado para facilitar seu trabalho 
              e garantir segurança jurídica em todas as suas visitas.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="space-y-24">
            {features.map((feature, index) => (
              <div 
                key={feature.id}
                id={feature.id}
                className={`flex flex-col ${feature.reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-8 lg:gap-16 items-center`}
              >
                {/* Content */}
                <AnimatedSection 
                  className="flex-1 space-y-6"
                  direction={feature.reverse ? 'right' : 'left'}
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    <feature.icon className="h-4 w-4" />
                    Recurso {String(index + 1).padStart(2, '0')}
                  </div>
                  
                  <div>
                    <h2 className="text-3xl md:text-4xl font-heading font-bold mb-3">
                      {feature.title}
                    </h2>
                    <p className="text-lg text-primary font-medium">
                      {feature.subtitle}
                    </p>
                  </div>
                  
                  <p className="text-muted-foreground text-lg">
                    {feature.description}
                  </p>
                  
                  <ul className="space-y-3">
                    {feature.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </AnimatedSection>
                
                {/* Screenshot Mockup */}
                <AnimatedSection 
                  className="flex-1 w-full"
                  direction={feature.reverse ? 'left' : 'right'}
                  delay={150}
                >
                  <div className="relative rounded-xl overflow-hidden border border-border bg-gradient-to-br from-muted/50 to-muted shadow-xl p-4">
                    {/* Decorative elements */}
                    <div className="absolute top-4 left-4 flex gap-1.5 z-10">
                      <div className="h-3 w-3 rounded-full bg-red-400/50" />
                      <div className="h-3 w-3 rounded-full bg-yellow-400/50" />
                      <div className="h-3 w-3 rounded-full bg-green-400/50" />
                    </div>
                    <div className="pt-6">
                      {feature.id === 'fichas-digitais' && <FichaDigitalMockup />}
                      {feature.id === 'confirmacao-otp' && <WhatsAppOTPMockup />}
                      {feature.id === 'qrcode' && <QRCodeMockup />}
                      {feature.id === 'comprovante-pdf' && <PDFComprovanteMockup />}
                      {feature.id === 'crm' && <CRMMockup />}
                      {feature.id === 'app-mobile' && <MobileAppMockup />}
                    </div>
                  </div>
                </AnimatedSection>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              E muito mais...
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Recursos adicionais para tornar sua experiência ainda melhor.
            </p>
          </AnimatedSection>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {additionalFeatures.map((feature, index) => (
              <AnimatedSection 
                key={index}
                delay={index * 100}
              >
                <div className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 h-full">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <AnimatedSection>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary-foreground mb-4">
              Pronto para experimentar?
            </h2>
          </AnimatedSection>
          <AnimatedSection delay={100}>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
              Comece gratuitamente e descubra como o VisitaSegura pode 
              transformar a forma como você trabalha.
            </p>
          </AnimatedSection>
          <AnimatedSection delay={200}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="text-base" asChild>
                <Link to="/registro-autonomo?plano=gratuito">
                  Começar Grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/#planos">Ver Planos</Link>
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-heading font-bold">VisitaSegura</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} VisitaSegura. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Funcionalidades;
