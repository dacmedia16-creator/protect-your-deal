import { RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UpdateCountdownOverlayProps {
  isOpen: boolean;
  countdown: number;
  onUpdateNow: () => void;
  onDefer?: () => void;
  showDefer: boolean;
}

export function UpdateCountdownOverlay({
  isOpen,
  countdown,
  onUpdateNow,
  onDefer,
  showDefer,
}: UpdateCountdownOverlayProps) {
  if (!isOpen) return null;

  // Calculate progress for the circular indicator (5 seconds total)
  const progress = ((5 - countdown) / 5) * 100;
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-card border border-border rounded-2xl p-8 mx-4 max-w-sm w-full shadow-2xl animate-scale-in">
        {/* Animated Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
            <div className="relative bg-primary/10 rounded-full p-4">
              <RefreshCw className="h-8 w-8 text-primary animate-spin" style={{ animationDuration: '2s' }} />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-2">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-xl font-display font-semibold text-foreground">
              Nova versão disponível!
            </h2>
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm">
            O app será atualizado automaticamente
          </p>
        </div>

        {/* Countdown Circle */}
        <div className="flex justify-center my-8">
          <div className="relative w-28 h-28">
            {/* Background circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted/30"
              />
              {/* Progress circle */}
              <circle
                cx="56"
                cy="56"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                className="text-primary transition-all duration-1000 ease-linear"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: strokeDashoffset,
                }}
              />
            </svg>
            {/* Countdown number */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn(
                "text-4xl font-bold text-foreground transition-transform duration-200",
                countdown <= 2 && "text-primary scale-110"
              )}>
                {countdown}
              </span>
            </div>
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-center text-sm text-muted-foreground mb-6">
          {countdown > 0 
            ? `Atualizando em ${countdown} segundo${countdown !== 1 ? 's' : ''}...`
            : 'Atualizando agora...'
          }
        </p>

        {/* Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={onUpdateNow} 
            className="w-full"
            size="lg"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar agora
          </Button>
          
          {showDefer && onDefer && (
            <Button 
              onClick={onDefer} 
              variant="ghost" 
              className="w-full text-muted-foreground hover:text-foreground"
              size="sm"
            >
              Adiar por 30 minutos
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
