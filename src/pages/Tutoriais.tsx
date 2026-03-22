import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogoIcon } from '@/components/LogoIcon';
import { Skeleton } from '@/components/ui/skeleton';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { ArrowLeft, PlayCircle } from 'lucide-react';

const LazyVideo = ({ src, poster }: { src: string; poster?: string }) => {
  const { ref, isVisible } = useScrollAnimation({ rootMargin: '200px', triggerOnce: true });

  return (
    <div ref={ref} className="aspect-video w-full">
      {isVisible ? (
        <video
          src={src}
          poster={poster}
          controls
          playsInline
          preload="metadata"
          className="w-full h-full rounded-t-xl"
        />
      ) : (
        <Skeleton className="w-full h-full rounded-t-xl flex items-center justify-center">
          <PlayCircle className="h-12 w-12 text-muted-foreground/40" />
        </Skeleton>
      )}
    </div>
  );
};

const Tutoriais = () => {
  return (
    <div className="min-h-screen bg-background scroll-smooth">
      <SEOHead 
        title="Tutoriais — VisitaProva"
        description="Aprenda a usar a plataforma VisitaProva com nossos vídeos tutoriais passo a passo."
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
          <div className="w-20" />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Como Usar
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Aprenda a usar a plataforma com nossos vídeos tutoriais
          </p>
        </div>

        {/* Índice clicável */}
        <nav className="max-w-md mx-auto mb-12 bg-muted/50 rounded-xl p-5">
          <p className="text-sm font-semibold text-foreground mb-3 text-center">📋 Índice</p>
          <ol className="space-y-2 list-decimal list-inside">
            <li><a href="#cadastro" className="text-sm text-primary hover:underline">Como se Cadastrar</a></li>
            <li><a href="#android" className="text-sm text-primary hover:underline">Instalando o App no Android</a></li>
            <li><a href="#ios" className="text-sm text-primary hover:underline">Instalando o App no iOS (iPhone)</a></li>
            <li><a href="#visao-geral" className="text-sm text-primary hover:underline">Visão Geral do APP</a></li>
            <li><a href="#primeira-ficha" className="text-sm text-primary hover:underline">Criando a Primeira Ficha de Visita</a></li>
            <li><a href="#assinatura-parceiro" className="text-sm text-primary hover:underline">Assinatura com Corretor Parceiro</a></li>
            <li><a href="#pesquisa-cliente" className="text-sm text-primary hover:underline">Pesquisa Pós-Visita para o Cliente</a></li>
          </ol>
        </nav>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card id="cadastro" className="overflow-hidden scroll-mt-24">
            <CardContent className="p-0">
              <LazyVideo src="/videos/tutorial-cadastro.mp4" />
              <div className="p-4">
                <h2 className="font-heading font-semibold text-lg">📋 Como se Cadastrar</h2>
              </div>
            </CardContent>
          </Card>
          <Card id="android" className="overflow-hidden scroll-mt-24">
            <CardContent className="p-0">
              <video
                src="/videos/tutorial-instalar-android.mp4"
                controls
                playsInline
                preload="metadata"
                className="w-full rounded-t-xl"
              />
              <div className="p-4">
                <h2 className="font-heading font-semibold text-lg">📱 Instalando o App no Android</h2>
              </div>
            </CardContent>
          </Card>
          <Card id="ios" className="overflow-hidden scroll-mt-24">
            <CardContent className="p-0">
              <video
                src="/videos/tutorial-instalar-ios.mp4"
                poster="/videos/poster-tutorial-ios.png"
                controls
                playsInline
                preload="metadata"
                className="w-full rounded-t-xl"
              />
              <div className="p-4">
                <h2 className="font-heading font-semibold text-lg">📱 Instalando o App no iOS (iPhone)</h2>
              </div>
            </CardContent>
          </Card>
          <Card id="visao-geral" className="overflow-hidden scroll-mt-24">
            <CardContent className="p-0">
              <video
                src="/videos/tutorial-visao-geral.mp4"
                controls
                playsInline
                preload="metadata"
                className="w-full rounded-t-xl"
              />
              <div className="p-4">
                <h2 className="font-heading font-semibold text-lg">🎯 Visão Geral do APP</h2>
              </div>
            </CardContent>
          </Card>
          <Card id="primeira-ficha" className="overflow-hidden scroll-mt-24">
            <CardContent className="p-0">
              <video
                src="/videos/tutorial-primeira-ficha.mp4"
                controls
                playsInline
                preload="metadata"
                className="w-full rounded-t-xl"
              />
              <div className="p-4">
                <h2 className="font-heading font-semibold text-lg">📝 Criando a Primeira Ficha de Visita</h2>
              </div>
            </CardContent>
          </Card>
          <Card id="assinatura-parceiro" className="overflow-hidden scroll-mt-24">
            <CardContent className="p-0">
              <video
                src="/videos/tutorial-assinatura-parceiro.mp4"
                controls
                playsInline
                preload="metadata"
                className="w-full rounded-t-xl"
              />
              <div className="p-4">
                <h2 className="font-heading font-semibold text-lg">🤝 Assinatura com Corretor Parceiro</h2>
              </div>
            </CardContent>
          </Card>
          <Card id="pesquisa-cliente" className="overflow-hidden scroll-mt-24">
            <CardContent className="p-0">
              <video
                src="/videos/tutorial-pesquisa-cliente.mp4"
                controls
                playsInline
                preload="metadata"
                className="w-full rounded-t-xl"
              />
              <div className="p-4">
                <h2 className="font-heading font-semibold text-lg">📊 Pesquisa Pós-Visita para o Cliente</h2>
              </div>
            </CardContent>
          </Card>
          <Card className="border-dashed border-2 border-muted-foreground/20">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
              <PlayCircle className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-muted-foreground">
                Em breve novos tutoriais serão adicionados aqui
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} VisitaProva. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Tutoriais;
