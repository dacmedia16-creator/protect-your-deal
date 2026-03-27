import { forwardRef } from 'react';

interface LogoFullProps {
  className?: string;
  showTagline?: boolean;
}

export const LogoFull = forwardRef<HTMLImageElement, LogoFullProps>(
  ({ className }, ref) => {
    return (
      <img 
        ref={ref}
        src="/logo-full.svg" 
        alt="VisitaProva - Registro de intermediação" 
        className={className}
      />
    );
  }
);

LogoFull.displayName = 'LogoFull';
