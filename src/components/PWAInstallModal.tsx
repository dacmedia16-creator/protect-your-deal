import { useState, useEffect, useCallback } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  X, 
  Smartphone, 
  Share,
  MoreVertical,
  Plus,
  ChevronDown,
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
    isSafari,
    isIOSWrongBrowser,
    install 
  } = usePWAInstall();
  
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState(1);
  const [isInstalling, setIsInstalling] = useState(false);

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

  const nextStep = useCallback(() => {
    setStep((prev) => Math.min(prev + 1, 3));
  }, []);

  // iOS Instructions component
  const IOSInstructions = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Instalar VisitaSegura
        </h2>
        <p className="text-muted-foreground">
          Siga os passos abaixo
        </p>
      </div>

      <div className="space-y-4">
        {/* Step 1 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
            step === 1 ? 'bg-primary/10 ring-2 ring-primary' : 'bg-muted/50'
          }`}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            step > 1 ? 'bg-green-500 text-white' : step === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            {step > 1 ? <Check className="h-5 w-5" /> : '1'}
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">Toque no ícone de compartilhar</p>
            <p className="text-sm text-muted-foreground">Na barra inferior do Safari</p>
          </div>
          <div className="bg-primary/20 p-2 rounded-lg">
            <Share className="h-6 w-6 text-primary" />
          </div>
        </motion.div>

        {/* Step 2 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
            step === 2 ? 'bg-primary/10 ring-2 ring-primary' : 'bg-muted/50'
          }`}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            step > 2 ? 'bg-green-500 text-white' : step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            {step > 2 ? <Check className="h-5 w-5" /> : '2'}
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">Role e toque em "Adicionar à Tela de Início"</p>
            <p className="text-sm text-muted-foreground">No menu que aparecerá</p>
          </div>
          <div className="bg-primary/20 p-2 rounded-lg">
            <Plus className="h-6 w-6 text-primary" />
          </div>
        </motion.div>

        {/* Step 3 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
            step === 3 ? 'bg-primary/10 ring-2 ring-primary' : 'bg-muted/50'
          }`}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            step === 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            3
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">Confirme tocando em "Adicionar"</p>
            <p className="text-sm text-muted-foreground">No canto superior direito</p>
          </div>
          <div className="bg-primary/20 p-2 rounded-lg">
            <Check className="h-6 w-6 text-primary" />
          </div>
        </motion.div>
      </div>

      {/* Animated arrow pointing down */}
      <motion.div 
        className="flex justify-center pt-4"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <div className="flex flex-col items-center gap-2 text-primary">
          <ChevronDown className="h-8 w-8" />
          <span className="text-sm font-medium">Toque abaixo para começar</span>
        </div>
      </motion.div>
    </div>
  );

  // Android instructions for manual install (when prompt doesn't fire)
  const AndroidManualInstructions = () => {
    const steps = [
      {
        number: 1,
        title: 'Toque nos 3 pontinhos',
        description: 'No canto superior direito do Chrome',
        image: '/help-images/android-passo-1.jpg',
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

    return (
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            Instalar VisitaSegura
          </h2>
          <p className="text-muted-foreground">
            Siga os 3 passos abaixo
          </p>
        </div>

        <div className="space-y-3">
          {steps.map((stepItem) => (
            <motion.div
              key={stepItem.number}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: stepItem.number * 0.1 }}
              className={`rounded-xl overflow-hidden border ${
                stepItem.isLast ? 'ring-2 ring-primary' : ''
              }`}
            >
              {/* Header do passo */}
              <div className={`flex items-center gap-3 p-3 ${
                stepItem.isLast ? 'bg-primary/10' : 'bg-muted/50'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                  stepItem.isLast 
                    ? 'bg-green-500 text-white' 
                    : 'bg-primary text-primary-foreground'
                }`}>
                  {stepItem.number}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{stepItem.title}</p>
                  <p className="text-xs text-muted-foreground">{stepItem.description}</p>
                </div>
                <stepItem.icon className={`h-5 w-5 shrink-0 ${
                  stepItem.isLast ? 'text-green-500' : 'text-primary'
                }`} />
              </div>
              
              {/* Screenshot */}
              <div className="relative bg-black/5">
                <img 
                  src={stepItem.image} 
                  alt={`Passo ${stepItem.number}: ${stepItem.title}`}
                  className="w-full h-auto max-h-48 object-contain"
                  loading="lazy"
                />
              </div>
            </motion.div>
          ))}
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
                className="w-full mt-4 text-muted-foreground"
                onClick={handleDismiss}
              >
                Agora não
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
