import React from 'react';

interface LogoIconProps {
  className?: string;
  size?: number;
}

const LogoIcon = React.forwardRef<HTMLImageElement, LogoIconProps>(
  function LogoIcon({ className, size = 56 }, ref) {
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

export { LogoIcon };
