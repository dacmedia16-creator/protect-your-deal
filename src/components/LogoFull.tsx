interface LogoFullProps {
  className?: string;
  showTagline?: boolean;
}

export const LogoFull = ({ className, showTagline = true }: LogoFullProps) => {
  return (
    <img 
      src="/logo-full.svg" 
      alt="VisitaProva - Registro de intermediação" 
      className={className}
    />
  );
};
