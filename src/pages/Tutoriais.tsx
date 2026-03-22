import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogoIcon } from '@/components/LogoIcon';
import { ArrowLeft, PlayCircle } from 'lucide-react';

const Tutoriais = () => {
  return (
    <div className="min-h-screen bg-background">
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
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Como Usar
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Aprenda a usar a plataforma com nossos vídeos tutoriais
          </p>
        </div>

        {/* Video Grid - placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="overflow-hidden">
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
          <Card className="overflow-hidden">
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
          <Card className="overflow-hidden">
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
          <Card className="overflow-hidden">
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
          <Card className="overflow-hidden">
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
