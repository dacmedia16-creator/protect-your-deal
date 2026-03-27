import { forwardRef } from 'react';

interface LogoIconProps {
  className?: string;
  size?: number;
}

export const LogoIcon = forwardRef<HTMLImageElement, LogoIconProps>(
  ({ className, size = 56 }, ref) => {
    return (
      <img 
        ref={ref}
        src="/vp-logo.png" 
        alt="VisitaProva" 
        width={size} 
        height={size}
        className={`object-contain ${className || ''}`}
      />
    );
  }
);

LogoIcon.displayName = 'LogoIcon';
