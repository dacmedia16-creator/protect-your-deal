import { ReactNode, useCallback } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  direction?: 'up' | 'left' | 'right';
  delay?: number;
}

const AnimatedSection = ({ 
  children, 
  className,
  direction = 'up',
  delay = 0
}: AnimatedSectionProps) => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.15 });

  const getTransform = useCallback(() => {
    switch (direction) {
      case 'left':
        return 'translate-x-[-40px]';
      case 'right':
        return 'translate-x-[40px]';
      default:
        return 'translate-y-[40px]';
    }
  }, [direction]);

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out',
        isVisible 
          ? 'opacity-100 translate-x-0 translate-y-0' 
          : `opacity-0 ${getTransform()}`,
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default AnimatedSection;
