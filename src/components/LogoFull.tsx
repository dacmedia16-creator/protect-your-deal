import React from 'react';

interface LogoFullProps {
  className?: string;
  showTagline?: boolean;
}

const LogoFull = React.forwardRef<HTMLImageElement, LogoFullProps>(
  function LogoFull({ className }, ref) {
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

export { LogoFull };
