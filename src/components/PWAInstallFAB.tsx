import { useState, useEffect } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const BANNER_DISMISSED_KEY = 'pwa-install-banner-dismissed';
const FAB_DISMISSED_KEY = 'pwa-install-fab-dismissed';
const SHOW_FAB_AFTER = 24 * 60 * 60 * 1000; // 24 hours after banner dismissed
const FAB_DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function PWAInstallFAB() {
  const { isInstalled, isInstallable, isIOS, isAndroid, install } = usePWAInstall();
  const [show, setShow] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if FAB was dismissed
    const fabDismissedAt = localStorage.getItem(FAB_DISMISSED_KEY);
    if (fabDismissedAt) {
      const elapsed = Date.now() - parseInt(fabDismissedAt, 10);
      if (elapsed < FAB_DISMISS_DURATION) {
        return; // FAB was dismissed recently, don't show
      }
    }

    // Check if banner was dismissed at least 24h ago
    const bannerDismissedAt = localStorage.getItem(BANNER_DISMISSED_KEY);
    if (bannerDismissedAt) {
      const elapsed = Date.now() - parseInt(bannerDismissedAt, 10);
      if (elapsed >= SHOW_FAB_AFTER) {
        setShow(true);
      }
    }
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.setItem(FAB_DISMISSED_KEY, Date.now().toString());
    setShow(false);
  };

  const handleInstall = async () => {
    if (isIOS) {
      navigate('/instalar');
    } else if (isInstallable) {
      const success = await install();
      if (success) {
        setShow(false);
      } else {
        navigate('/instalar');
      }
    } else {
      navigate('/instalar');
    }
  };

  // Don't show if installed or conditions not met
  if (isInstalled || !show) {
    return null;
  }

  // Only show on mobile
  if (!isIOS && !isAndroid) {
    return null;
  }

  return (
    <div 
      className={cn(
        "fixed bottom-20 left-4 z-40 transition-all duration-300 sm:hidden",
        isExpanded ? "w-auto" : "w-auto"
      )}
    >
      <div 
        className={cn(
          "flex items-center gap-2 bg-primary text-primary-foreground rounded-full shadow-lg transition-all duration-300 cursor-pointer",
          isExpanded ? "px-4 py-2.5" : "p-3"
        )}
        onClick={() => isExpanded ? handleInstall() : setIsExpanded(true)}
      >
        <Download className="h-5 w-5 shrink-0" />
        
        {isExpanded && (
          <>
            <span className="text-sm font-medium whitespace-nowrap animate-fade-in">
              Instalar App
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-6 w-6 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 -mr-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
