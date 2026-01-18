import { useState, useEffect, useCallback } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  X, 
  Smartphone, 
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MODAL_SHOWN_KEY = 'pwa-install-modal-shown';
const MODAL_DISMISSED_KEY = 'pwa-install-modal-dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function PWAInstallModal() {
  const { 
    isInstallable, 
    isInstalled, 
    isIOS, 
    isAndroid, 
    isIOSWrongBrowser,
    install 
  } = usePWAInstall();
  
  const [isVisible, setIsVisible] = useState(false);
  const [iosStep, setIosStep] = useState(0);
  const [androidStep, setAndroidStep] = useState(0);
  const [isInstalling, setIsInstalling] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  useEffect(() => {
    // Don't show if already installed
    if (isInstalled) {
      setIsVisible(false);
      return;
    }

    // Check if was dismissed recently
    const dismissedAt = localStorage.getItem(MODAL_DISMISSED_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (elapsed < DISMISS_DURATION) {
        return;
      }
    }

    // Only show on mobile
    if (!isIOS && !isAndroid) {
      return;
    }

    // Check if user is on iOS but not Safari
    if (isIOSWrongBrowser) {
      return;
    }

    // Show modal after a short delay
    const timer = setTimeout(() => {
      const shouldShow = isInstallable || isIOS || isAndroid;
      if (shouldShow) {
        setIsVisible(true);
        localStorage.setItem(MODAL_SHOWN_KEY, Date.now().toString());
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [isInstallable, isInstalled, isIOS, isAndroid, isIOSWrongBrowser]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(MODAL_DISMISSED_KEY, Date.now().toString());
    setIsVisible(false);
  }, []);

  const handleInstall = useCallback(async () => {
    if (isInstallable) {
      setIsInstalling(true);
      const success = await install();
      setIsInstalling(false);
      if (success) {
        setIsVisible(false);
      }
    }
  }, [isInstallable, install]);

  // iOS Instructions component with 4 steps and real screenshots
  const IOSInstructions = () => {
    const [direction, setDirection] = useState(0);
    
    const steps = [
      {
        number: 1,
        title: 'Toque nos 3 pontinhos',
        description: 'Na barra inferior do Safari',
        image: '/help-images/ios-passo-1.jpg',
      },
      {
        number: 2,
        title: 'Toque em "Compartilhar"',
        description: 'No menu que apareceu',
        image: '/help-images/ios-passo-2.jpg',
      },
      {
        number: 3,
        title: 'Adicionar à Tela de Início',
        description: 'Role e toque na opção',
        image: '/help-images/ios-passo-3.jpg',
      },
      {
        number: 4,
        title: 'Toque em "Adicionar"',
        description: 'No canto superior direito',
        image: '/help-images/ios-passo-4.jpg',
        isLast: true,
      },
    ];

    const currentStep = steps[iosStep];
    const isLastStep = iosStep === steps.length - 1;
    const isFirstStep = iosStep === 0;

    const goNext = () => {
      if (!isLastStep) {
        setDirection(1);
        setIosStep((prev) => prev + 1);
      }
    };

    const goPrev = () => {
      if (!isFirstStep) {
        setDirection(-1);
        setIosStep((prev) => prev - 1);
      }
    };

    const handleDragEnd = (
      _e: MouseEvent | TouchEvent | PointerEvent,
      { offset, velocity }: { offset: { x: number }; velocity: { x: number } }
    ) => {
      const swipe = Math.abs(offset.x) * velocity.x;
      const threshold = 500;
      
      if (swipe < -threshold && !isLastStep) {
        goNext();
      } else if (swipe > threshold && !isFirstStep) {
        goPrev();
      }
    };

    return (
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            Instalar VisitaSegura
          </h2>
          <p className="text-muted-foreground">
            Passo {iosStep + 1} de {steps.length}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setDirection(idx > iosStep ? 1 : -1);
                setIosStep(idx);
              }}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                idx === iosStep
                  ? 'bg-primary w-6'
                  : idx < iosStep
                  ? 'bg-green-500'
                  : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>

        {/* Carrossel com swipe */}
        <div className="relative overflow-hidden touch-pan-y">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={iosStep}
              initial={{ opacity: 0, x: direction >= 0 ? 100 : -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction >= 0 ? -100 : 100 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className="rounded-xl overflow-hidden border cursor-grab active:cursor-grabbing select-none"
            >
              {/* Header do passo */}
              <div className={`flex items-center gap-3 p-4 ${
                currentStep.isLast ? 'bg-green-500/10' : 'bg-primary/10'
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg font-bold ${
                  currentStep.isLast 
                    ? 'bg-green-500 text-white' 
                    : 'bg-primary text-primary-foreground'
                }`}>
                  {currentStep.number}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{currentStep.title}</p>
                  <p className="text-sm text-muted-foreground">{currentStep.description}</p>
                </div>
              </div>
              
              {/* Screenshot - clicável para zoom */}
              <div 
                className="relative bg-black/5 cursor-zoom-in"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomedImage(currentStep.image);
                }}
              >
                <img 
                  src={currentStep.image} 
                  alt={`Passo ${currentStep.number}: ${currentStep.title}`}
                  className="w-full h-auto max-h-64 object-contain"
                  loading="lazy"
                  draggable={false}
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20">
                  <span className="text-white text-xs bg-black/50 px-2 py-1 rounded">Toque para ampliar</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Swipe hint */}
        <p className="text-xs text-muted-foreground text-center">
          ← Arraste para navegar →
        </p>

        {/* Navigation buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={isFirstStep}
            className="flex-1 h-12"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Anterior
          </Button>
          
          {isLastStep ? (
            <Button
              onClick={handleDismiss}
              className="flex-1 h-12 bg-green-500 hover:bg-green-600"
            >
              <Check className="h-5 w-5 mr-1" />
              Entendi
            </Button>
          ) : (
            <Button
              onClick={goNext}
              className="flex-1 h-12"
            >
              Próximo
              <ChevronRight className="h-5 w-5 ml-1" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  // Android instructions for manual install (when prompt doesn't fire)
  const AndroidManualInstructions = () => {
    const [direction, setDirection] = useState(0);
    
    const steps = [
      {
        number: 1,
        title: 'Toque nos 3 pontinhos',
        description: 'No canto superior direito do Chrome',
        image: '/help-images/android-passo-1-v2.jpg',
        icon: MoreVertical,
      },
      {
        number: 2,
        title: 'Adicionar à tela inicial',
        description: 'Role o menu e toque nessa opção',
        image: '/help-images/android-passo-2.jpg',
        icon: Download,
      },
      {
        number: 3,
        title: 'Toque em "Instalar"',
        description: 'Na caixa de confirmação',
        image: '/help-images/android-passo-3.jpg',
        icon: Check,
        isLast: true,
      },
    ];

    const currentStep = steps[androidStep];
    const isLastStep = androidStep === steps.length - 1;
    const isFirstStep = androidStep === 0;

    const goNext = () => {
      if (!isLastStep) {
        setDirection(1);
        setAndroidStep((prev) => prev + 1);
      }
    };

    const goPrev = () => {
      if (!isFirstStep) {
        setDirection(-1);
        setAndroidStep((prev) => prev - 1);
      }
    };

    const handleDragEnd = (
      _e: MouseEvent | TouchEvent | PointerEvent,
      { offset, velocity }: { offset: { x: number }; velocity: { x: number } }
    ) => {
      const swipe = Math.abs(offset.x) * velocity.x;
      const threshold = 500;
      
      if (swipe < -threshold && !isLastStep) {
        // Swipe para esquerda → próximo
        goNext();
      } else if (swipe > threshold && !isFirstStep) {
        // Swipe para direita → anterior
        goPrev();
      }
    };

    return (
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            Instalar VisitaSegura
          </h2>
          <p className="text-muted-foreground">
            Passo {androidStep + 1} de {steps.length}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setDirection(idx > androidStep ? 1 : -1);
                setAndroidStep(idx);
              }}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                idx === androidStep
                  ? 'bg-primary w-6'
                  : idx < androidStep
                  ? 'bg-green-500'
                  : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>

        {/* Carrossel com swipe */}
        <div className="relative overflow-hidden touch-pan-y">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={androidStep}
              initial={{ opacity: 0, x: direction >= 0 ? 100 : -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction >= 0 ? -100 : 100 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className="rounded-xl overflow-hidden border cursor-grab active:cursor-grabbing select-none"
            >
              {/* Header do passo */}
              <div className={`flex items-center gap-3 p-4 ${
                currentStep.isLast ? 'bg-primary/10' : 'bg-muted/50'
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg font-bold ${
                  currentStep.isLast 
                    ? 'bg-green-500 text-white' 
                    : 'bg-primary text-primary-foreground'
                }`}>
                  {currentStep.number}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{currentStep.title}</p>
                  <p className="text-sm text-muted-foreground">{currentStep.description}</p>
                </div>
                <currentStep.icon className={`h-6 w-6 shrink-0 ${
                  currentStep.isLast ? 'text-green-500' : 'text-primary'
                }`} />
              </div>
              
              {/* Screenshot - clicável para zoom */}
              <div 
                className="relative bg-black/5 cursor-zoom-in"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomedImage(currentStep.image);
                }}
              >
                <img 
                  src={currentStep.image} 
                  alt={`Passo ${currentStep.number}: ${currentStep.title}`}
                  className="w-full h-auto max-h-64 object-contain"
                  loading="lazy"
                  draggable={false}
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20">
                  <span className="text-white text-xs bg-black/50 px-2 py-1 rounded">Toque para ampliar</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Swipe hint */}
        <p className="text-xs text-muted-foreground text-center">
          ← Arraste para navegar →
        </p>

        {/* Navigation buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={isFirstStep}
            className="flex-1 h-12"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Anterior
          </Button>
          
          {isLastStep ? (
            <Button
              onClick={handleDismiss}
              className="flex-1 h-12 bg-green-500 hover:bg-green-600"
            >
              <Check className="h-5 w-5 mr-1" />
              Entendi
            </Button>
          ) : (
            <Button
              onClick={goNext}
              className="flex-1 h-12"
            >
              Próximo
              <ChevronRight className="h-5 w-5 ml-1" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  // Android one-click install
  const AndroidInstall = () => (
    <div className="space-y-6 text-center">
      <motion.div 
        className="w-24 h-24 mx-auto bg-primary/10 rounded-3xl flex items-center justify-center"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <Smartphone className="h-12 w-12 text-primary" />
      </motion.div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Instalar VisitaSegura
        </h2>
        <p className="text-muted-foreground">
          Tenha acesso rápido às suas fichas direto da tela inicial
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3 text-sm">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary">
          <Check className="h-4 w-4" />
          <span>Acesso offline</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary">
          <Check className="h-4 w-4" />
          <span>Notificações</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary">
          <Check className="h-4 w-4" />
          <span>Mais rápido</span>
        </div>
      </div>

      <Button 
        size="lg" 
        className="w-full h-14 text-lg gap-3"
        onClick={handleInstall}
        disabled={isInstalling}
      >
        <Download className="h-6 w-6" />
        {isInstalling ? 'Instalando...' : 'Instalar com 1 clique'}
      </Button>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/95 backdrop-blur-sm z-[100]"
              onClick={handleDismiss}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[100] max-w-md mx-auto"
            >
              <div className="relative bg-card rounded-3xl shadow-2xl border p-6 overflow-hidden">
                {/* Close button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismiss}
                  className="absolute top-4 right-4 h-8 w-8 rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>

                {/* Content based on platform */}
                {isIOS && <IOSInstructions />}
                {isAndroid && isInstallable && <AndroidInstall />}
                {isAndroid && !isInstallable && <AndroidManualInstructions />}

                {/* Skip button */}
                <Button
                  variant="ghost"
                  onClick={handleDismiss}
                  className="w-full mt-4 text-muted-foreground"
                >
                  Pular por agora
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal de Zoom */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setZoomedImage(null)}
          >
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={zoomedImage}
              alt="Imagem ampliada"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button 
              className="absolute top-4 right-4 text-white/80 hover:text-white p-2 bg-black/50 rounded-full"
              onClick={() => setZoomedImage(null)}
            >
              <X className="h-6 w-6" />
            </button>
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-sm">
              Toque para fechar
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}