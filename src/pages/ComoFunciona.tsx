import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import AnimatedSection from '@/components/AnimatedSection';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import videoThumbnail from '@/assets/video-thumbnail.jpg';
import { LogoIcon } from '@/components/LogoIcon';
import { 
  ArrowLeft, 
  ClipboardCheck, 
  Send, 
  CheckCircle2, 
  Download,
  Scale,
  PlayCircle
} from 'lucide-react';

const LazyVideo = ({ src, poster, muted }: { src: string; poster?: string; muted?: boolean }) => {
  const { ref, isVisible } = useScrollAnimation({ rootMargin: '200px', triggerOnce: true });
  return (
    <div ref={ref} className="aspect-video w-full">
      {isVisible ? (
        <video src={src} poster={poster} controls playsInline muted={muted} preload="metadata" className="w-full h-full rounded-xl shadow-lg border border-border" />
      ) : (
        <Skeleton className="w-full h-full rounded-xl flex items-center justify-center">
          <PlayCircle className="h-12 w-12 text-muted-foreground/40" />
        </Skeleton>
      )}
    </div>
  );
};

const ComoFunciona = () => {
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
        title="Como Funciona - VisitaProva"
        description="Veja como é simples registrar visitas imobiliárias com o VisitaProva. 4 passos: crie o registro, envie OTP, aguarde confirmação e baixe o comprovante PDF."
      />
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <LogoIcon size={24} />
            <span className="font-heading text-lg font-bold">VisitaProva</span>
          </div>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Title */}
        <AnimatedSection className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-4">
            Como Funciona o <span className="text-primary">VisitaProva</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Veja na prática como é simples garantir a segurança jurídica das suas visitas.
          </p>
        </AnimatedSection>

        {/* Video Demo */}
        <AnimatedSection delay={150} className="max-w-xl mx-auto mb-16">
          <LazyVideo src="/videos/demo.mp4" poster={videoThumbnail} muted />
        </AnimatedSection>

        {/* Steps */}
        <div className="max-w-5xl mx-auto mb-16">
          <AnimatedSection delay={300} className="mb-10">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-center">
              4 Passos Simples
            </h2>
          </AnimatedSection>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <AnimatedSection 
                key={index} 
                delay={400 + index * 100}
                direction={index % 2 === 0 ? 'left' : 'right'}
              >
                <div className="relative">
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
              </AnimatedSection>
            ))}
          </div>
          
          {/* Micro-copy de autoridade jurídica */}
          <AnimatedSection delay={800} className="max-w-2xl mx-auto text-center p-6 rounded-xl bg-card border border-primary/20">
            <Scale className="h-8 w-8 text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Registro digital com validade como prova documental.</strong><br />
              Cada comprovante possui protocolo único e QR Code para verificação instantânea.
            </p>
          </AnimatedSection>
        </div>

        {/* CTA */}
        <AnimatedSection delay={900} className="text-center mt-12">
          <Button size="lg" className="text-base" asChild>
            <Link to="/registro-autonomo?plano=gratuito">
              Testar Grátis Agora
            </Link>
          </Button>
        </AnimatedSection>
      </main>
    </div>
  );
};

export default ComoFunciona;
