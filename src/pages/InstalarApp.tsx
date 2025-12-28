import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { IOSInstallMockup } from "@/components/mockups/IOSInstallMockup";
import { AndroidInstallMockup } from "@/components/mockups/AndroidInstallMockup";
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
  RefreshCw
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function InstalarApp() {
  const { isInstallable, isInstalled, isIOS, isAndroid, isDesktop, install } = usePWAInstall();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'left' | 'right'>('right');
  const [iosStep, setIosStep] = useState<1 | 2 | 3>(1);
  const [androidStep, setAndroidStep] = useState<1 | 2 | 3>(1);

  const handleStepChange = (
    currentStep: 1 | 2 | 3,
    direction: 'prev' | 'next',
    setter: React.Dispatch<React.SetStateAction<1 | 2 | 3>>
  ) => {
    if (direction === 'prev' && currentStep === 1) return;
    if (direction === 'next' && currentStep === 3) return;

    setTransitionDirection(direction === 'next' ? 'right' : 'left');
    setIsTransitioning(true);

    setTimeout(() => {
      setter(prev => direction === 'next' ? (prev + 1) as 1 | 2 | 3 : (prev - 1) as 1 | 2 | 3);
      setIsTransitioning(false);
    }, 150);
  };

  const handleStepClick = (
    targetStep: 1 | 2 | 3,
    currentStep: 1 | 2 | 3,
    setter: React.Dispatch<React.SetStateAction<1 | 2 | 3>>
  ) => {
    if (targetStep === currentStep) return;
    
    setTransitionDirection(targetStep > currentStep ? 'right' : 'left');
    setIsTransitioning(true);

    setTimeout(() => {
      setter(targetStep);
      setIsTransitioning(false);
    }, 150);
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
              O VisitaSegura já está instalado no seu dispositivo.
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
          <h1 className="text-3xl font-bold mb-2">Instalar VisitaSegura</h1>
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
                Instalar VisitaSegura Agora
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Platform-specific Instructions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Guia de Instalação Passo a Passo</CardTitle>
            <CardDescription>
              Siga as instruções para o seu dispositivo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={defaultTab} className="w-full">
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
                  {/* Mockup */}
                  <div className="flex flex-col items-center">
                    <div 
                      className={cn(
                        "transition-all duration-300 ease-out",
                        isTransitioning 
                          ? transitionDirection === 'right'
                            ? "opacity-0 -translate-x-4"
                            : "opacity-0 translate-x-4"
                          : "opacity-100 translate-x-0"
                      )}
                    >
                      <IOSInstallMockup step={iosStep} />
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStepChange(iosStep, 'prev', setIosStep)}
                        disabled={iosStep === 1}
                        className="transition-transform hover:scale-105 active:scale-95"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      {/* Step indicators */}
                      <div className="flex items-center gap-2">
                        {[1, 2, 3].map((step) => (
                          <button
                            key={step}
                            onClick={() => handleStepClick(step as 1 | 2 | 3, iosStep, setIosStep)}
                            className={cn(
                              "w-2.5 h-2.5 rounded-full transition-all duration-300",
                              iosStep === step 
                                ? "bg-primary scale-125" 
                                : "bg-muted hover:bg-muted-foreground/30"
                            )}
                          />
                        ))}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStepChange(iosStep, 'next', setIosStep)}
                        disabled={iosStep === 3}
                        className="transition-transform hover:scale-105 active:scale-95"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <span className="text-xs text-muted-foreground mt-2">
                      Passo {iosStep} de 3
                    </span>
                  </div>

                  {/* Steps */}
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
                        <p className="font-medium flex items-center gap-2">
                          Toque no ícone de Compartilhar
                          <Share2 className={cn(
                            "h-4 w-4 transition-all duration-300",
                            iosStep === 1 ? "text-primary animate-pulse" : "text-muted-foreground"
                          )} />
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Na barra inferior do Safari, toque no ícone de compartilhamento (quadrado com seta para cima)
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
                          Adicionar à Tela de Início
                          <PlusSquare className={cn(
                            "h-4 w-4 transition-all duration-300",
                            iosStep === 2 ? "text-primary animate-pulse" : "text-muted-foreground"
                          )} />
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Role para baixo no menu e toque em "Adicionar à Tela de Início"
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
                          Confirme a instalação
                          <CheckCircle2 className={cn(
                            "h-4 w-4 transition-all duration-300",
                            iosStep === 3 ? "text-green-500 animate-pulse" : "text-muted-foreground"
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
                  {/* Mockup */}
                  <div className="flex flex-col items-center">
                    <div 
                      className={cn(
                        "transition-all duration-300 ease-out",
                        isTransitioning 
                          ? transitionDirection === 'right'
                            ? "opacity-0 -translate-x-4"
                            : "opacity-0 translate-x-4"
                          : "opacity-100 translate-x-0"
                      )}
                    >
                      <AndroidInstallMockup step={androidStep} />
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStepChange(androidStep, 'prev', setAndroidStep)}
                        disabled={androidStep === 1}
                        className="transition-transform hover:scale-105 active:scale-95"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      {/* Step indicators */}
                      <div className="flex items-center gap-2">
                        {[1, 2, 3].map((step) => (
                          <button
                            key={step}
                            onClick={() => handleStepClick(step as 1 | 2 | 3, androidStep, setAndroidStep)}
                            className={cn(
                              "w-2.5 h-2.5 rounded-full transition-all duration-300",
                              androidStep === step 
                                ? "bg-primary scale-125" 
                                : "bg-muted hover:bg-muted-foreground/30"
                            )}
                          />
                        ))}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStepChange(androidStep, 'next', setAndroidStep)}
                        disabled={androidStep === 3}
                        className="transition-transform hover:scale-105 active:scale-95"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <span className="text-xs text-muted-foreground mt-2">
                      Passo {androidStep} de 3
                    </span>
                  </div>

                  {/* Steps */}
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
                        <p className="font-medium">Abra o menu do Chrome</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Toque nos três pontos (⋮) no canto superior direito da tela
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
                          Toque em "Instalar app"
                          <Download className={cn(
                            "h-4 w-4 transition-all duration-300",
                            androidStep === 2 ? "text-primary animate-pulse" : "text-muted-foreground"
                          )} />
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Ou toque em "Adicionar à tela inicial" se a opção "Instalar" não aparecer
                        </p>
                      </div>
                    </div>

                    <div 
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-all duration-300 ease-out",
                        androidStep === 3 
                          ? 'bg-primary/10 border-2 border-primary shadow-md scale-[1.02]' 
                          : 'bg-muted/50 hover:bg-muted/70 border-2 border-transparent'
                      )}
                      onClick={() => handleStepClick(3, androidStep, setAndroidStep)}
                    >
                      <span className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium flex-shrink-0 transition-all duration-300",
                        androidStep === 3 ? 'bg-primary text-primary-foreground scale-110' : 'bg-muted text-muted-foreground'
                      )}>
                        3
                      </span>
                      <div className={cn(
                        "transition-opacity duration-300",
                        androidStep === 3 ? "opacity-100" : "opacity-70"
                      )}>
                        <p className="font-medium flex items-center gap-2">
                          Confirme a instalação
                          <CheckCircle2 className={cn(
                            "h-4 w-4 transition-all duration-300",
                            androidStep === 3 ? "text-green-500 animate-pulse" : "text-muted-foreground"
                          )} />
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Toque em "Instalar" na janela de confirmação que aparecer
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
    </div>
  );
}
