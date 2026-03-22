import { useState, useEffect } from "react";
import { SEOHead } from '@/components/SEOHead';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { IOSInstallMockup } from "@/components/mockups/IOSInstallMockup";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { 
  Smartphone, 
  Download, 
  Share2, 
  PlusSquare, 
  CheckCircle2, 
  Monitor,
  ArrowLeft,
  Shield,
  Apple,
  ChevronRight,
  ChevronLeft,
  Zap,
  Wifi,
  RefreshCw,
  Play,
  Pause
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function InstalarApp() {
  const { isInstallable, isInstalled, isIOS, isAndroid, isDesktop, install } = usePWAInstall();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'left' | 'right'>('right');
  const [iosStep, setIosStep] = useState<1 | 2 | 3 | 4>(1);
  const [androidStep, setAndroidStep] = useState<1 | 2 | 3>(1);
  const [isAutoplayEnabled, setIsAutoplayEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<string>(isIOS ? "ios" : isAndroid ? "android" : "ios");
  const [zoomedImage, setZoomedImage] = useState<{
    image: string;
    platform: 'ios' | 'android';
    step: number;
    maxStep: number;
  } | null>(null);

  // Autoplay effect
  useEffect(() => {
    if (!isAutoplayEnabled) return;

    const interval = setInterval(() => {
      if (activeTab === 'ios') {
        setTransitionDirection('right');
        setIsTransitioning(true);
        setTimeout(() => {
          setIosStep(prev => prev === 4 ? 1 : (prev + 1) as 1 | 2 | 3 | 4);
          setIsTransitioning(false);
        }, 150);
      } else if (activeTab === 'android') {
        setTransitionDirection('right');
        setIsTransitioning(true);
        setTimeout(() => {
          setAndroidStep(prev => prev === 3 ? 1 : (prev + 1) as 1 | 2 | 3);
          setIsTransitioning(false);
        }, 150);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isAutoplayEnabled, activeTab]);

  // Pause autoplay on user interaction
  const pauseAutoplay = () => {
    setIsAutoplayEnabled(false);
  };

  const handleStepChange = <T extends number>(
    currentStep: T,
    direction: 'prev' | 'next',
    setter: React.Dispatch<React.SetStateAction<T>>,
    maxStep: T
  ) => {
    pauseAutoplay();
    if (direction === 'prev' && currentStep === 1) return;
    if (direction === 'next' && currentStep === maxStep) return;

    setTransitionDirection(direction === 'next' ? 'right' : 'left');
    setIsTransitioning(true);

    setTimeout(() => {
      setter(prev => (direction === 'next' ? prev + 1 : prev - 1) as T);
      setIsTransitioning(false);
    }, 150);
  };

  const handleStepClick = <T extends number>(
    targetStep: T,
    currentStep: T,
    setter: React.Dispatch<React.SetStateAction<T>>
  ) => {
    pauseAutoplay();
    if (targetStep === currentStep) return;
    
    setTransitionDirection(targetStep > currentStep ? 'right' : 'left');
    setIsTransitioning(true);

    setTimeout(() => {
      setter(targetStep);
      setIsTransitioning(false);
    }, 150);
  };

  const toggleAutoplay = () => {
    setIsAutoplayEnabled(prev => !prev);
  };

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      // Installation successful
    }
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">App Instalado!</CardTitle>
            <CardDescription>
              O VisitaProva já está instalado no seu dispositivo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Você pode acessar o app diretamente da sua tela inicial.
            </p>
            <Link to="/dashboard">
              <Button className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const defaultTab = isIOS ? "ios" : isAndroid ? "android" : "ios";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <SEOHead 
        title="Baixar App - VisitaProva"
        description="Instale o VisitaProva no seu celular. Acesse seus registros de visita imobiliária de qualquer lugar, com acesso rápido pela tela inicial."
      />
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Voltar</span>
          </Link>
        </div>
      </header>

      <main className="container max-w-4xl py-8 px-4">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Instalar VisitaProva</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Tenha acesso rápido ao app direto da sua tela inicial, sem precisar abrir o navegador
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border rounded-xl p-4 text-center">
            <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm font-medium">Acesso Rápido</p>
            <p className="text-xs text-muted-foreground">Um toque para abrir</p>
          </div>
          <div className="bg-card border rounded-xl p-4 text-center">
            <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Wifi className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm font-medium">Funciona Offline</p>
            <p className="text-xs text-muted-foreground">Acesse sem internet</p>
          </div>
          <div className="bg-card border rounded-xl p-4 text-center">
            <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Monitor className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-sm font-medium">Tela Cheia</p>
            <p className="text-xs text-muted-foreground">Sem barras do navegador</p>
          </div>
          <div className="bg-card border rounded-xl p-4 text-center">
            <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <RefreshCw className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <p className="text-sm font-medium">Sempre Atualizado</p>
            <p className="text-xs text-muted-foreground">Updates automáticos</p>
          </div>
        </div>

        {/* Video Tutorial */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              🎬 Veja como instalar — Versão Android
            </CardTitle>
          </CardHeader>
          <CardContent>
            <video
              src="/videos/instalando-app.mp4"
              controls
              playsInline
              preload="metadata"
              className="w-full rounded-xl"
            />
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              🎬 Veja como instalar — Versão iOS (iPhone)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <video
              src="/videos/instalando-app-ios.mp4"
              controls
              playsInline
              preload="metadata"
              className="w-full rounded-xl"
            />
          </CardContent>
        </Card>

        {/* Automatic Installation Button */}
        {isInstallable && (
          <Card className="mb-8 border-primary bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                Instalação Automática Disponível
              </CardTitle>
              <CardDescription>
                Seu navegador suporta instalação direta. Clique no botão abaixo!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleInstall} size="lg" className="w-full">
                <Download className="mr-2 h-5 w-5" />
                Instalar VisitaProva Agora
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Platform-specific Instructions */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Guia de Instalação Passo a Passo</CardTitle>
                <CardDescription>
                  Siga as instruções para o seu dispositivo
                </CardDescription>
              </div>
              {/* Autoplay control */}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAutoplay}
                className={cn(
                  "flex items-center gap-2 transition-all",
                  isAutoplayEnabled && "bg-primary/10 border-primary text-primary"
                )}
              >
                {isAutoplayEnabled ? (
                  <>
                    <Pause className="h-4 w-4" />
                    <span className="hidden sm:inline">Pausar</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    <span className="hidden sm:inline">Reproduzir</span>
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs 
              defaultValue={defaultTab} 
              className="w-full"
              onValueChange={(value) => {
                setActiveTab(value);
                pauseAutoplay();
              }}
            >
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="ios" className="flex items-center gap-2">
                  <Apple className="h-4 w-4" />
                  <span className="hidden sm:inline">iPhone/iPad</span>
                  <span className="sm:hidden">iOS</span>
                </TabsTrigger>
                <TabsTrigger value="android" className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  <span className="hidden sm:inline">Android</span>
                  <span className="sm:hidden">Android</span>
                </TabsTrigger>
                <TabsTrigger value="desktop" className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  <span className="hidden sm:inline">Computador</span>
                  <span className="sm:hidden">PC</span>
                </TabsTrigger>
              </TabsList>

              {/* iOS Instructions */}
              <TabsContent value="ios">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Carrossel com Screenshots Reais */}
                  <div className="flex flex-col items-center">
                    {/* Header do passo atual */}
                    <div className="text-center mb-4">
                      <p className="text-sm font-medium text-muted-foreground">
                        Passo {iosStep} de 4
                      </p>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        {[1, 2, 3, 4].map((step) => (
                          <button
                            key={step}
                            onClick={() => handleStepClick(step as 1 | 2 | 3 | 4, iosStep, setIosStep)}
                            className={cn(
                              "w-2.5 h-2.5 rounded-full transition-all",
                              iosStep === step
                                ? 'bg-primary w-6'
                                : 'bg-muted hover:bg-muted-foreground/30'
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Screenshot do passo atual */}
                    <div 
                      className={cn(
                        "relative overflow-hidden rounded-xl border transition-all duration-300 ease-out w-full max-w-xs",
                        isTransitioning 
                          ? transitionDirection === 'right'
                            ? "opacity-0 -translate-x-4"
                            : "opacity-0 translate-x-4"
                          : "opacity-100 translate-x-0"
                      )}
                    >
                      {/* Header do card */}
                      <div className={cn(
                        "flex items-center gap-3 p-4",
                        iosStep === 4 ? 'bg-green-500/10' : 'bg-primary/10'
                      )}>
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                          iosStep === 4 
                            ? 'bg-green-500 text-white' 
                            : 'bg-primary text-primary-foreground'
                        )}>
                          {iosStep}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {iosStep === 1 && 'Toque nos 3 pontinhos'}
                            {iosStep === 2 && 'Toque em Compartilhar'}
                            {iosStep === 3 && 'Adicionar à Tela de Início'}
                            {iosStep === 4 && 'Toque em "Adicionar"'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {iosStep === 1 && 'Na barra inferior do Safari'}
                            {iosStep === 2 && 'No menu que apareceu'}
                            {iosStep === 3 && 'Role e toque na opção'}
                            {iosStep === 4 && 'No canto superior direito'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Screenshot - clicável para zoom */}
                      <div 
                        className="relative bg-black/5 cursor-zoom-in"
                        onClick={() => {
                          setZoomedImage({
                            image: `/help-images/ios-passo-${iosStep}.jpg`,
                            platform: 'ios',
                            step: iosStep,
                            maxStep: 4,
                          });
                        }}
                      >
                        <img 
                          src={`/help-images/ios-passo-${iosStep}.jpg`}
                          alt={`Passo ${iosStep}`}
                          className="w-full h-auto max-h-64 object-contain"
                          loading="lazy"
                          draggable={false}
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20">
                          <span className="text-white text-xs bg-black/50 px-2 py-1 rounded">Toque para ampliar</span>
                        </div>
                      </div>
                    </div>

                    {/* Controles de navegação */}
                    <div className="flex items-center gap-3 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStepChange(iosStep, 'prev', setIosStep, 4 as 1 | 2 | 3 | 4)}
                        disabled={iosStep === 1}
                        className="transition-transform hover:scale-105 active:scale-95"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <span className="text-xs text-muted-foreground">
                        ← Arraste para navegar →
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStepChange(iosStep, 'next', setIosStep, 4 as 1 | 2 | 3 | 4)}
                        disabled={iosStep === 4}
                        className="transition-transform hover:scale-105 active:scale-95"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Steps - Descrição textual */}
                  <div className="space-y-4">
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg animate-fade-in">
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        <strong>Importante:</strong> Use o navegador <strong>Safari</strong> para instalar no iOS.
                      </p>
                    </div>

                    <div 
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-all duration-300 ease-out",
                        iosStep === 1 
                          ? 'bg-primary/10 border-2 border-primary shadow-md scale-[1.02]' 
                          : 'bg-muted/50 hover:bg-muted/70 border-2 border-transparent'
                      )}
                      onClick={() => handleStepClick(1, iosStep, setIosStep)}
                    >
                      <span className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium flex-shrink-0 transition-all duration-300",
                        iosStep === 1 ? 'bg-primary text-primary-foreground scale-110' : 'bg-muted text-muted-foreground'
                      )}>
                        1
                      </span>
                      <div className={cn(
                        "transition-opacity duration-300",
                        iosStep === 1 ? "opacity-100" : "opacity-70"
                      )}>
                        <p className="font-medium">Toque nos 3 pontinhos</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Na barra inferior do Safari (•••)
                        </p>
                      </div>
                    </div>

                    <div 
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-all duration-300 ease-out",
                        iosStep === 2 
                          ? 'bg-primary/10 border-2 border-primary shadow-md scale-[1.02]' 
                          : 'bg-muted/50 hover:bg-muted/70 border-2 border-transparent'
                      )}
                      onClick={() => handleStepClick(2, iosStep, setIosStep)}
                    >
                      <span className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium flex-shrink-0 transition-all duration-300",
                        iosStep === 2 ? 'bg-primary text-primary-foreground scale-110' : 'bg-muted text-muted-foreground'
                      )}>
                        2
                      </span>
                      <div className={cn(
                        "transition-opacity duration-300",
                        iosStep === 2 ? "opacity-100" : "opacity-70"
                      )}>
                        <p className="font-medium flex items-center gap-2">
                          Toque em "Compartilhar"
                          <Share2 className={cn(
                            "h-4 w-4 transition-all duration-300",
                            iosStep === 2 ? "text-primary animate-pulse" : "text-muted-foreground"
                          )} />
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          No menu que apareceu, selecione Compartilhar
                        </p>
                      </div>
                    </div>

                    <div 
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-all duration-300 ease-out",
                        iosStep === 3 
                          ? 'bg-primary/10 border-2 border-primary shadow-md scale-[1.02]' 
                          : 'bg-muted/50 hover:bg-muted/70 border-2 border-transparent'
                      )}
                      onClick={() => handleStepClick(3, iosStep, setIosStep)}
                    >
                      <span className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium flex-shrink-0 transition-all duration-300",
                        iosStep === 3 ? 'bg-primary text-primary-foreground scale-110' : 'bg-muted text-muted-foreground'
                      )}>
                        3
                      </span>
                      <div className={cn(
                        "transition-opacity duration-300",
                        iosStep === 3 ? "opacity-100" : "opacity-70"
                      )}>
                        <p className="font-medium flex items-center gap-2">
                          Adicionar à Tela de Início
                          <PlusSquare className={cn(
                            "h-4 w-4 transition-all duration-300",
                            iosStep === 3 ? "text-primary animate-pulse" : "text-muted-foreground"
                          )} />
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Role para baixo e toque em "Adicionar à Tela de Início"
                        </p>
                      </div>
                    </div>

                    <div 
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-all duration-300 ease-out",
                        iosStep === 4 
                          ? 'bg-green-500/10 border-2 border-green-500 shadow-md scale-[1.02]' 
                          : 'bg-muted/50 hover:bg-muted/70 border-2 border-transparent'
                      )}
                      onClick={() => handleStepClick(4, iosStep, setIosStep)}
                    >
                      <span className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium flex-shrink-0 transition-all duration-300",
                        iosStep === 4 ? 'bg-green-500 text-white scale-110' : 'bg-muted text-muted-foreground'
                      )}>
                        4
                      </span>
                      <div className={cn(
                        "transition-opacity duration-300",
                        iosStep === 4 ? "opacity-100" : "opacity-70"
                      )}>
                        <p className="font-medium flex items-center gap-2">
                          Confirme a instalação
                          <CheckCircle2 className={cn(
                            "h-4 w-4 transition-all duration-300",
                            iosStep === 4 ? "text-green-500 animate-pulse" : "text-muted-foreground"
                          )} />
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Toque em "Adicionar" no canto superior direito para concluir
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Android Instructions */}
              <TabsContent value="android">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Carrossel com Screenshots Reais */}
                  <div className="flex flex-col items-center">
                    {/* Header do passo atual */}
                    <div className="text-center mb-4">
                      <p className="text-sm font-medium text-muted-foreground">
                        Passo {androidStep} de 3
                      </p>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        {[1, 2, 3].map((step) => (
                          <button
                            key={step}
                            onClick={() => handleStepClick(step as 1 | 2 | 3, androidStep, setAndroidStep)}
                            className={cn(
                              "w-2.5 h-2.5 rounded-full transition-all",
                              androidStep === step
                                ? 'bg-primary w-6'
                                : 'bg-muted hover:bg-muted-foreground/30'
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Screenshot do passo atual */}
                    <div 
                      className={cn(
                        "relative overflow-hidden rounded-xl border transition-all duration-300 ease-out w-full max-w-xs",
                        isTransitioning 
                          ? transitionDirection === 'right'
                            ? "opacity-0 -translate-x-4"
                            : "opacity-0 translate-x-4"
                          : "opacity-100 translate-x-0"
                      )}
                    >
                      {/* Header do card */}
                      <div className={cn(
                        "flex items-center gap-3 p-4",
                        androidStep === 3 ? 'bg-green-500/10' : 'bg-primary/10'
                      )}>
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                          androidStep === 3 
                            ? 'bg-green-500 text-white' 
                            : 'bg-primary text-primary-foreground'
                        )}>
                          {androidStep}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {androidStep === 1 && 'Toque nos 3 pontinhos'}
                            {androidStep === 2 && 'Adicionar à tela inicial'}
                            {androidStep === 3 && 'Toque em "Instalar"'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {androidStep === 1 && 'No canto superior direito do Chrome'}
                            {androidStep === 2 && 'Role o menu e toque nessa opção'}
                            {androidStep === 3 && 'Na caixa de confirmação'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Screenshot - clicável para zoom */}
                      <div 
                        className="relative bg-black/5 cursor-zoom-in"
                        onClick={() => {
                          const imgSrc = androidStep === 1 ? '/help-images/android-passo-1-v2.jpg' : `/help-images/android-passo-${androidStep}.jpg`;
                          setZoomedImage({
                            image: imgSrc,
                            platform: 'android',
                            step: androidStep,
                            maxStep: 3,
                          });
                        }}
                      >
                        <img 
                          src={androidStep === 1 ? '/help-images/android-passo-1-v2.jpg' : `/help-images/android-passo-${androidStep}.jpg`}
                          alt={`Passo ${androidStep}`}
                          className="w-full h-auto max-h-64 object-contain"
                          loading="lazy"
                          draggable={false}
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20">
                          <span className="text-white text-xs bg-black/50 px-2 py-1 rounded">Toque para ampliar</span>
                        </div>
                      </div>
                    </div>

                    {/* Controles de navegação */}
                    <div className="flex items-center gap-3 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStepChange(androidStep, 'prev', setAndroidStep, 3 as 1 | 2 | 3)}
                        disabled={androidStep === 1}
                        className="transition-transform hover:scale-105 active:scale-95"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <span className="text-xs text-muted-foreground">
                        ← Arraste para navegar →
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStepChange(androidStep, 'next', setAndroidStep, 3 as 1 | 2 | 3)}
                        disabled={androidStep === 3}
                        className="transition-transform hover:scale-105 active:scale-95"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Steps - Descrição textual */}
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg animate-fade-in">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Dica:</strong> Use o navegador <strong>Chrome</strong> para a melhor experiência no Android.
                      </p>
                    </div>

                    <div 
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-all duration-300 ease-out",
                        androidStep === 1 
                          ? 'bg-primary/10 border-2 border-primary shadow-md scale-[1.02]' 
                          : 'bg-muted/50 hover:bg-muted/70 border-2 border-transparent'
                      )}
                      onClick={() => handleStepClick(1, androidStep, setAndroidStep)}
                    >
                      <span className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium flex-shrink-0 transition-all duration-300",
                        androidStep === 1 ? 'bg-primary text-primary-foreground scale-110' : 'bg-muted text-muted-foreground'
                      )}>
                        1
                      </span>
                      <div className={cn(
                        "transition-opacity duration-300",
                        androidStep === 1 ? "opacity-100" : "opacity-70"
                      )}>
                        <p className="font-medium">Toque nos 3 pontinhos</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          No canto superior direito do Chrome (⋮)
                        </p>
                      </div>
                    </div>

                    <div 
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-all duration-300 ease-out",
                        androidStep === 2 
                          ? 'bg-primary/10 border-2 border-primary shadow-md scale-[1.02]' 
                          : 'bg-muted/50 hover:bg-muted/70 border-2 border-transparent'
                      )}
                      onClick={() => handleStepClick(2, androidStep, setAndroidStep)}
                    >
                      <span className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium flex-shrink-0 transition-all duration-300",
                        androidStep === 2 ? 'bg-primary text-primary-foreground scale-110' : 'bg-muted text-muted-foreground'
                      )}>
                        2
                      </span>
                      <div className={cn(
                        "transition-opacity duration-300",
                        androidStep === 2 ? "opacity-100" : "opacity-70"
                      )}>
                        <p className="font-medium flex items-center gap-2">
                          Adicionar à tela inicial
                          <Download className={cn(
                            "h-4 w-4 transition-all duration-300",
                            androidStep === 2 ? "text-primary animate-pulse" : "text-muted-foreground"
                          )} />
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Role o menu e toque nessa opção
                        </p>
                      </div>
                    </div>

                    <div 
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-all duration-300 ease-out",
                        androidStep === 3 
                          ? 'bg-green-500/10 border-2 border-green-500 shadow-md scale-[1.02]' 
                          : 'bg-muted/50 hover:bg-muted/70 border-2 border-transparent'
                      )}
                      onClick={() => handleStepClick(3, androidStep, setAndroidStep)}
                    >
                      <span className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium flex-shrink-0 transition-all duration-300",
                        androidStep === 3 ? 'bg-green-500 text-white scale-110' : 'bg-muted text-muted-foreground'
                      )}>
                        3
                      </span>
                      <div className={cn(
                        "transition-opacity duration-300",
                        androidStep === 3 ? "opacity-100" : "opacity-70"
                      )}>
                        <p className="font-medium flex items-center gap-2">
                          Toque em "Instalar"
                          <CheckCircle2 className={cn(
                            "h-4 w-4 transition-all duration-300",
                            androidStep === 3 ? "text-green-500 animate-pulse" : "text-muted-foreground"
                          )} />
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Na caixa de confirmação que aparece
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Desktop Instructions */}
              <TabsContent value="desktop">
                <div className="max-w-lg mx-auto">
                  <div className="p-4 bg-muted/50 border rounded-lg mb-6">
                    <p className="text-sm text-muted-foreground">
                      <strong>Navegadores suportados:</strong> Chrome, Edge, Opera e outros navegadores baseados em Chromium.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium flex-shrink-0">
                        1
                      </span>
                      <div>
                        <p className="font-medium">Procure o ícone de instalação</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Na barra de endereços, procure pelo ícone <Download className="inline h-4 w-4" /> ou <PlusSquare className="inline h-4 w-4" /> no lado direito
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium flex-shrink-0">
                        2
                      </span>
                      <div>
                        <p className="font-medium">Clique em Instalar</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Confirme a instalação na janela que aparecer clicando em "Instalar"
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                      <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-200">Pronto!</p>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          O app será instalado e você poderá acessá-lo pelo menu iniciar ou área de trabalho
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Perguntas Frequentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium text-sm">O app ocupa espaço no meu celular?</p>
              <p className="text-sm text-muted-foreground mt-1">
                Muito pouco! O app usa menos de 1MB de espaço, pois roda direto do navegador.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm">Preciso atualizar o app manualmente?</p>
              <p className="text-sm text-muted-foreground mt-1">
                Não! As atualizações são automáticas. Sempre que acessar, você terá a versão mais recente.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm">Posso desinstalar depois?</p>
              <p className="text-sm text-muted-foreground mt-1">
                Sim! Basta segurar o ícone do app e escolher "Remover" ou "Desinstalar".
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Back to dashboard */}
        <div className="text-center">
          <Link to="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>
      </main>

      {/* Modal de Zoom com navegação */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setZoomedImage(null)}
          >
            {/* Seta esquerda */}
            {zoomedImage.step > 1 && (
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 bg-black/50 hover:bg-black/70 rounded-full transition-all z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  const newStep = zoomedImage.step - 1;
                  const getImage = () => {
                    if (zoomedImage.platform === 'ios') {
                      return `/help-images/ios-passo-${newStep}.jpg`;
                    } else {
                      return newStep === 1 ? '/help-images/android-passo-1-v2.jpg' : `/help-images/android-passo-${newStep}.jpg`;
                    }
                  };
                  setZoomedImage({ ...zoomedImage, step: newStep, image: getImage() });
                  if (zoomedImage.platform === 'ios') {
                    setIosStep(newStep as 1 | 2 | 3 | 4);
                  } else {
                    setAndroidStep(newStep as 1 | 2 | 3);
                  }
                }}
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
            )}

            {/* Imagem */}
            <motion.img
              key={zoomedImage.image}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              src={zoomedImage.image}
              alt="Imagem ampliada"
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Seta direita */}
            {zoomedImage.step < zoomedImage.maxStep && (
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 bg-black/50 hover:bg-black/70 rounded-full transition-all z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  const newStep = zoomedImage.step + 1;
                  const getImage = () => {
                    if (zoomedImage.platform === 'ios') {
                      return `/help-images/ios-passo-${newStep}.jpg`;
                    } else {
                      return newStep === 1 ? '/help-images/android-passo-1-v2.jpg' : `/help-images/android-passo-${newStep}.jpg`;
                    }
                  };
                  setZoomedImage({ ...zoomedImage, step: newStep, image: getImage() });
                  if (zoomedImage.platform === 'ios') {
                    setIosStep(newStep as 1 | 2 | 3 | 4);
                  } else {
                    setAndroidStep(newStep as 1 | 2 | 3);
                  }
                }}
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            )}

            {/* Botão fechar */}
            <button 
              className="absolute top-4 right-4 text-white/80 hover:text-white p-2 bg-black/50 hover:bg-black/70 rounded-full transition-all"
              onClick={() => setZoomedImage(null)}
            >
              <X className="h-6 w-6" />
            </button>

            {/* Indicador de posição */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
              <div className="flex gap-2">
                {Array.from({ length: zoomedImage.maxStep }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      const newStep = i + 1;
                      const getImage = () => {
                        if (zoomedImage.platform === 'ios') {
                          return `/help-images/ios-passo-${newStep}.jpg`;
                        } else {
                          return newStep === 1 ? '/help-images/android-passo-1-v2.jpg' : `/help-images/android-passo-${newStep}.jpg`;
                        }
                      };
                      setZoomedImage({ ...zoomedImage, step: newStep, image: getImage() });
                      if (zoomedImage.platform === 'ios') {
                        setIosStep(newStep as 1 | 2 | 3 | 4);
                      } else {
                        setAndroidStep(newStep as 1 | 2 | 3);
                      }
                    }}
                    className={cn(
                      "w-2.5 h-2.5 rounded-full transition-all",
                      zoomedImage.step === i + 1
                        ? 'bg-white w-6'
                        : 'bg-white/40 hover:bg-white/60'
                    )}
                  />
                ))}
              </div>
              <p className="text-white/60 text-sm">
                Passo {zoomedImage.step} de {zoomedImage.maxStep} • Toque na imagem ou clique fora para fechar
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
