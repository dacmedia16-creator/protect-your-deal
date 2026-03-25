interface LogoIconProps {
  className?: string;
  size?: number;
}

export const LogoIcon = ({ className, size = 56 }: LogoIconProps) => {
  return (
    <img 
      src="/vp-logo.png" 
      alt="VisitaProva" 
      width={size} 
      height={size}
      className={`object-contain ${className || ''}`}
    />
  );
};
