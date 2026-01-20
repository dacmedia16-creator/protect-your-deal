interface LogoIconProps {
  className?: string;
  size?: number;
}

export const LogoIcon = ({ className, size = 32 }: LogoIconProps) => {
  return (
    <img 
      src="/logo-icon.svg" 
      alt="VisitaSegura" 
      width={size} 
      height={size}
      className={className}
    />
  );
};
