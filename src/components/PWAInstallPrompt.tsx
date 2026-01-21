import { useState, useEffect } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  X, 
  Smartphone, 
  Share, 
  Sparkles,
  Zap,
  Bell,
  WifiOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const PROMPT_DISMISSED_KEY = 'pwa-install-prompt-dismissed';
const DISMISS_DURATION = 3 * 24 * 60 * 60 * 1000; // 3 days

const features = [
  { icon: Zap, text: 'Acesso instantâneo' },
  { icon: Bell, text: 'Notificações' },
  { icon: WifiOff, text: 'Funciona offline' },
];

export function PWAInstallPrompt() {
  const { user, loading: authLoading } = useAuth();
  const { isInstallable, isInstalled, isIOS, isAndroid, canShowManualInstall, isIOSWrongBrowser, install } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Não mostrar enquanto carrega auth
    if (authLoading) {
      setIsVisible(false);
      return;
    }

    // Não mostrar se NÃO está logado
    if (!user) {
      setIsVisible(false);
      return;
    }

    // Não mostrar se já instalou
    if (isInstalled) {
      setIsVisible(false);
      return;
    }

    const dismissedAt = localStorage.getItem(PROMPT_DISMISSED_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (elapsed < DISMISS_DURATION) {
        setIsVisible(false);
        return;
      }
    }

    // Mostrar após pequeno delay para melhor UX
    const timer = setTimeout(() => {
      const shouldShow = isInstallable || isIOS || (isAndroid && canShowManualInstall);
      setIsVisible(shouldShow && !isIOSWrongBrowser);
    }, 2000);

    return () => clearTimeout(timer);
  }, [user, authLoading, isInstallable, isInstalled, isIOS, isAndroid, canShowManualInstall, isIOSWrongBrowser]);

  const handleDismiss = () => {
    localStorage.setItem(PROMPT_DISMISSED_KEY, Date.now().toString());
    setIsVisible(false);
  };

  const handleInstall = async () => {
    if (isIOS || (isAndroid && !isInstallable)) {
      navigate('/instalar');
    } else {
      const success = await install();
      if (success) {
        setIsVisible(false);
      }
    }
  };

  const showManualInstructions = isIOS || (isAndroid && !isInstallable);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={() => setIsExpanded(false)}
          />

          {/* Main Prompt */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-16 left-0 right-0 z-50 p-4 md:p-6 md:bottom-20"
          >
            <div className="max-w-lg mx-auto">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground shadow-2xl">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
                
                {/* Close button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismiss}
                  className="absolute top-3 right-3 h-8 w-8 text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 z-10"
                >
                  <X className="h-5 w-5" />
                </Button>

                <div className="relative p-5 md:p-6">
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <motion.div 
                      className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0"
                      animate={{ rotate: [0, -5, 5, 0] }}
                      transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
                    >
                      <Smartphone className="h-7 w-7" />
                    </motion.div>
                    
                    <div className="flex-1 pr-6">
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="h-4 w-4 text-yellow-300" />
                        <span className="text-xs font-medium text-white/80 uppercase tracking-wide">
                          Recomendado
                        </span>
                      </div>
                      <h3 className="text-xl font-bold">
                        Instale o VisitaProva
                      </h3>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {features.map((feature, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 * (index + 1) }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 text-sm"
                      >
                        <feature.icon className="h-3.5 w-3.5" />
                        <span>{feature.text}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-white/80 mb-5">
                    {showManualInstructions 
                      ? isIOS 
                        ? 'Adicione à sua tela inicial para acesso rápido. Toque no botão de compartilhar do Safari.'
                        : 'Instale o app diretamente do navegador para ter a melhor experiência.'
                      : 'Tenha acesso rápido às suas fichas de visita direto da tela inicial do seu celular.'
                    }
                  </p>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    <Button 
                      onClick={handleInstall}
                      size="lg"
                      className="flex-1 h-12 bg-white text-primary hover:bg-white/90 font-semibold shadow-lg"
                    >
                      {showManualInstructions ? (
                        <>
                          <Share className="h-5 w-5 mr-2" />
                          Ver como instalar
                        </>
                      ) : (
                        <>
                          <Download className="h-5 w-5 mr-2" />
                          Instalar agora
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      variant="ghost"
                      onClick={handleDismiss}
                      className="h-12 px-4 text-white/70 hover:text-white hover:bg-white/10"
                    >
                      Depois
                    </Button>
                  </div>
                </div>

                {/* Animated bottom bar */}
                <motion.div 
                  className="h-1 bg-white/30"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  style={{ originX: 0 }}
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
