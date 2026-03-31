import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface TourStep {
  target: string; // data-tour attribute value
  title: string;
  description: string;
}

interface OnboardingTourProps {
  steps: TourStep[];
  storageKey?: string;
}

export function OnboardingTour({ steps, storageKey = 'visitaprova-onboarding-done' }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(-1); // -1 = not started
  const [position, setPosition] = useState<{ top: number; left: number; placement: 'top' | 'bottom' }>({ top: 0, left: 0, placement: 'bottom' });
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Check if tour should start
  useEffect(() => {
    const done = localStorage.getItem(storageKey);
    if (!done) {
      // Small delay to let the dashboard render
      const timer = setTimeout(() => setCurrentStep(0), 800);
      return () => clearTimeout(timer);
    }
  }, [storageKey]);

  const calculatePosition = useCallback(() => {
    if (currentStep < 0 || currentStep >= steps.length) return;

    const step = steps[currentStep];
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    setTargetRect(rect);

    const tooltipHeight = tooltipRef.current?.offsetHeight || 180;
    const tooltipWidth = Math.min(320, window.innerWidth - 32);
    const spaceBelow = window.innerHeight - rect.bottom;
    const placement = spaceBelow > tooltipHeight + 16 ? 'bottom' : 'top';

    let top = placement === 'bottom' ? rect.bottom + 12 : rect.top - tooltipHeight - 12;
    let left = Math.max(16, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - 16));

    // Ensure tooltip stays in viewport
    top = Math.max(16, Math.min(top, window.innerHeight - tooltipHeight - 16));

    setPosition({ top, left, placement });
  }, [currentStep, steps]);

  useEffect(() => {
    calculatePosition();
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition, true);
    return () => {
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition, true);
    };
  }, [calculatePosition]);

  // Scroll target into view
  useEffect(() => {
    if (currentStep < 0 || currentStep >= steps.length) return;
    const step = steps[currentStep];
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Recalculate after scroll
      setTimeout(calculatePosition, 400);
    }
  }, [currentStep, steps, calculatePosition]);

  const finish = useCallback(() => {
    localStorage.setItem(storageKey, 'true');
    setCurrentStep(-1);
  }, [storageKey]);

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      finish();
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (currentStep < 0 || currentStep >= steps.length) return null;

  const step = steps[currentStep];
  const tooltipWidth = Math.min(320, window.innerWidth - 32);

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 z-[9998]" onClick={finish}>
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <mask id="tour-spotlight">
              <rect width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.left - 6}
                  y={targetRect.top - 6}
                  width={targetRect.width + 12}
                  height={targetRect.height + 12}
                  rx="12"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.6)"
            mask="url(#tour-spotlight)"
          />
        </svg>
      </div>

      {/* Spotlight ring */}
      {targetRect && (
        <div
          className="fixed z-[9999] pointer-events-none rounded-xl ring-2 ring-primary ring-offset-2 ring-offset-transparent transition-all duration-300"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[10000] animate-fade-in"
        style={{
          top: position.top,
          left: position.left,
          width: tooltipWidth,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-card border border-border rounded-xl shadow-xl p-4 relative">
          {/* Arrow */}
          <div
            className={`absolute w-3 h-3 bg-card border-border rotate-45 ${
              position.placement === 'bottom'
                ? '-top-1.5 border-l border-t'
                : '-bottom-1.5 border-r border-b'
            }`}
            style={{ left: targetRect ? Math.min(Math.max(targetRect.left + targetRect.width / 2 - position.left - 6, 16), tooltipWidth - 28) : 24 }}
          />

          {/* Close */}
          <button
            onClick={finish}
            className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Content */}
          <div className="pr-6">
            <h3 className="font-display font-semibold text-foreground text-sm mb-1">{step.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4">
            {/* Progress dots */}
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    i === currentStep ? 'w-4 bg-primary' : i < currentStep ? 'w-1.5 bg-primary/50' : 'w-1.5 bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="ghost" size="sm" onClick={prev} className="h-7 px-2 text-xs">
                  Voltar
                </Button>
              )}
              <Button size="sm" onClick={next} className="h-7 px-3 text-xs">
                {currentStep < steps.length - 1 ? 'Próximo' : 'Concluir'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
