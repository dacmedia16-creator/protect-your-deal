import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import AnimatedSection from '@/components/AnimatedSection';
import videoThumbnail from '@/assets/video-thumbnail.jpg';
import { 
  ArrowLeft, 
  ArrowRight,
  ClipboardCheck, 
  Send, 
  CheckCircle2, 
  Download,
  Shield
} from 'lucide-react';

const ComoFunciona = () => {
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
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-heading text-lg font-bold">VisitaSegura</span>
          </div>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Title */}
        <AnimatedSection className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-4">
            Como Funciona o <span className="text-primary">VisitaSegura</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Veja na prática como é simples garantir a segurança jurídica das suas visitas.
          </p>
        </AnimatedSection>

        {/* Video Demo */}
        <AnimatedSection delay={150} className="max-w-xl mx-auto mb-16">
          <video
            className="w-full rounded-xl shadow-lg border border-border"
            controls
            preload="metadata"
            autoPlay
            muted
            poster={videoThumbnail}
          >
            <source src="/videos/demo.mp4" type="video/mp4" />
            Seu navegador não suporta vídeo.
          </video>
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
        </div>

        {/* CTA */}
        <AnimatedSection delay={800} className="text-center">
          <Button size="lg" className="text-base" asChild>
            <Link to="/registro-autonomo?plano=gratuito">
              Começar Agora Grátis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </AnimatedSection>
      </main>
    </div>
  );
};

export default ComoFunciona;
