import { useState, useEffect } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X, Smartphone, Share } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BANNER_DISMISSED_KEY = 'pwa-install-banner-dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function PWAInstallBanner() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const dismissedAt = localStorage.getItem(BANNER_DISMISSED_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (elapsed < DISMISS_DURATION) {
        setIsDismissed(true);
        return;
      }
    }
    setIsDismissed(false);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(BANNER_DISMISSED_KEY, Date.now().toString());
    setIsDismissed(true);
  };

  const handleInstall = async () => {
    if (isIOS) {
      navigate('/instalar');
    } else {
      const success = await install();
      if (success) {
        setIsDismissed(true);
      }
    }
  };

  // Don't show if already installed or dismissed
  if (isInstalled || isDismissed) {
    return null;
  }

  // Only show if installable (Android/Desktop) or iOS
  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <Card className="mb-4 md:mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 animate-fade-in overflow-hidden">
      <CardContent className="p-3 md:p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
            <Smartphone className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm md:text-base mb-0.5">
              Instale o VisitaSegura
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">
              {isIOS 
                ? 'Toque em Compartilhar e depois "Adicionar à Tela de Início"'
                : 'Acesse suas fichas rapidamente direto da tela inicial'
              }
            </p>
            
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                onClick={handleInstall}
                className="h-8 text-xs md:text-sm gap-1.5"
              >
                {isIOS ? (
                  <>
                    <Share className="h-3.5 w-3.5" />
                    Ver instruções
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    Instalar app
                  </>
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleDismiss}
                className="h-8 text-xs md:text-sm text-muted-foreground"
              >
                Agora não
              </Button>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground -mt-1 -mr-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
