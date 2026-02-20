import { useState } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Headphones, 
  Play, 
  Clock, 
  Sparkles, 
  FileText, 
  MessageSquare, 
  QrCode, 
  Users, 
  Smartphone,
  ArrowRight,
  Volume2
} from 'lucide-react';
import { LogoFull } from '@/components/LogoFull';
import AnimatedSection from '@/components/AnimatedSection';

const TOUR_FEATURES = [
  {
    icon: FileText,
    title: 'Ficha Digital',
    description: 'Como criar registros completos de visitas',
  },
  {
    icon: MessageSquare,
    title: 'Confirmação WhatsApp',
    description: 'Sistema de validação via código OTP',
  },
  {
    icon: QrCode,
    title: 'QR Code',
    description: 'Verificação de autenticidade dos documentos',
  },
  {
    icon: Users,
    title: 'CRM de Clientes',
    description: 'Organização de proprietários e compradores',
  },
  {
    icon: Smartphone,
    title: 'App Mobile',
    description: 'Instalação como PWA no celular',
  },
];

export default function TourAudioLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <SEOHead 
        title="Tour em Áudio - VisitaProva"
        description="Conheça o VisitaProva através de uma apresentação narrada e interativa. Aprenda sobre todas as funcionalidades com mockups em tempo real."
      />
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <LogoFull className="h-8" />
          </Link>
          <Link to="/">
            <Button variant="outline" size="sm">
              Voltar ao início
            </Button>
          </Link>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 py-16 md:py-24 relative">
            <AnimatedSection className="text-center max-w-3xl mx-auto">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Headphones className="h-4 w-4" />
                Experiência Interativa
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                Conheça o{' '}
                <span className="text-primary">VisitaProva</span>{' '}
                em Áudio
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Uma apresentação narrada e interativa sobre todas as funcionalidades 
                da plataforma. Aprenda enquanto visualiza os mockups em tempo real.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/tour-audio">
                  <Button size="lg" className="text-lg px-8 gap-2 group">
                    <Play className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    Iniciar Tour em Áudio
                    <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/como-funciona">
                  <Button variant="outline" size="lg" className="text-lg px-8">
                    Ver Como Funciona
                  </Button>
                </Link>
              </div>

              {/* Duration info */}
              <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>~5 minutos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>Narração profissional</span>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* Audio Player Preview */}
        <AnimatedSection delay={100}>
          <section className="container mx-auto px-4 py-12">
            <Card className="max-w-2xl mx-auto overflow-hidden border-2 border-primary/20 shadow-xl shadow-primary/5">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8">
                  <div className="flex items-center gap-6">
                    {/* Animated audio icon */}
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                        <Volume2 className="h-10 w-10 text-primary-foreground" />
                      </div>
                      {/* Pulse animation */}
                      <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" style={{ animationDuration: '2s' }} />
                    </div>

                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-1">Tour Completo do VisitaProva</h3>
                      <p className="text-muted-foreground text-sm mb-3">
                        8 seções • Mockups interativos
                      </p>
                      {/* Fake waveform */}
                      <div className="flex items-center gap-1 h-8">
                        {Array.from({ length: 40 }).map((_, i) => (
                          <div
                            key={i}
                            className="w-1 bg-primary/40 rounded-full"
                            style={{
                              height: `${Math.random() * 100}%`,
                              minHeight: '20%',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </AnimatedSection>

        {/* What you'll learn */}
        <section className="container mx-auto px-4 py-16">
          <AnimatedSection delay={150}>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                O que você vai aprender
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Uma visão completa de todas as funcionalidades do VisitaProva, 
                explicadas de forma clara e objetiva.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {TOUR_FEATURES.map((feature, index) => (
              <AnimatedSection key={feature.title} delay={200 + index * 50}>
                <Card className="h-full hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </section>

        {/* How it works */}
        <AnimatedSection delay={300}>
          <section className="bg-muted/30 py-16">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Como funciona o tour
                </h2>
              </div>

              <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                {[
                  {
                    step: '1',
                    title: 'Gere o áudio',
                    description: 'Clique para gerar uma narração profissional com IA',
                  },
                  {
                    step: '2',
                    title: 'Acompanhe os mockups',
                    description: 'Visualize cada funcionalidade enquanto ouve a explicação',
                  },
                  {
                    step: '3',
                    title: 'Navegue livremente',
                    description: 'Pule para qualquer seção ou baixe o áudio para ouvir depois',
                  },
                ].map((item) => (
                  <div key={item.step} className="text-center">
                    <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                      {item.step}
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* CTA Section */}
        <AnimatedSection delay={350}>
          <section className="container mx-auto px-4 py-20">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Pronto para conhecer o VisitaProva?
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Inicie o tour em áudio agora e descubra como nossa plataforma 
                pode revolucionar sua segurança nas visitas imobiliárias.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/tour-audio">
                  <Button size="lg" className="text-lg px-10 gap-2">
                    <Headphones className="h-5 w-5" />
                    Começar Tour em Áudio
                  </Button>
                </Link>
                <Link to="/registro">
                  <Button variant="outline" size="lg" className="text-lg px-10">
                    Criar Conta Grátis
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </AnimatedSection>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} VisitaProva. Registro de intermediação.</p>
        </div>
      </footer>
    </div>
  );
}
