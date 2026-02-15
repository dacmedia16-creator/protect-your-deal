import { useState, useEffect } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X, Smartphone, Share, AlertTriangle, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const BANNER_DISMISSED_KEY = 'pwa-install-banner-dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function PWAInstallBanner() {
  return null;
  const { isInstallable, isInstalled, isIOS, isAndroid, canShowManualInstall, isIOSWrongBrowser, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(true);
  const [copied, setCopied] = useState(false);
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

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      toast.success('Link copiado! Agora abra no Safari.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar o link');
    }
  };

  const handleInstall = async () => {
    // iOS or Android without automatic prompt: show instructions
    if (isIOS || (isAndroid && !isInstallable)) {
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

  // Show special banner for iOS users not using Safari
  if (isIOSWrongBrowser) {
    return (
      <Card className="mb-4 md:mb-6 border-amber-500/50 bg-gradient-to-r from-amber-500/10 to-amber-500/5 animate-fade-in overflow-hidden">
        <CardContent className="p-3 md:p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-amber-600" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm md:text-base mb-0.5">
                Use o Safari para instalar
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">
                No iPhone, o app só pode ser instalado pelo Safari. Copie o link e abra no Safari.
              </p>
              
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  onClick={handleCopyLink}
                  variant="outline"
                  className="h-8 text-xs md:text-sm gap-1.5 border-amber-500/30 hover:bg-amber-500/10"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copiar link
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

  // Show if: installable (automatic prompt available), iOS, or Android with manual install option
  const shouldShow = isInstallable || isIOS || (isAndroid && canShowManualInstall);
  
  if (!shouldShow) {
    return null;
  }

  // Determine if we need to show manual instructions
  const showManualInstructions = isIOS || (isAndroid && !isInstallable);

  return (
    <Card className="mb-4 md:mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 animate-fade-in overflow-hidden">
      <CardContent className="p-3 md:p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
            <Smartphone className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm md:text-base mb-0.5">
              Instale o VisitaProva
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">
              {showManualInstructions 
                ? isIOS 
                  ? 'Toque em Compartilhar e depois "Adicionar à Tela de Início"'
                  : 'Toque no menu do navegador e "Instalar app"'
                : 'Acesse seus registros rapidamente direto da tela inicial'
              }
            </p>
            
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                onClick={handleInstall}
                className="h-8 text-xs md:text-sm gap-1.5"
              >
{showManualInstructions ? (
                  <>
                    <Share className="h-3.5 w-3.5" />
                    Ver como instalar
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    Instalar com 1 clique
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
