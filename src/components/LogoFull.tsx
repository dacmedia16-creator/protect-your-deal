interface LogoFullProps {
  className?: string;
  showTagline?: boolean;
}

export const LogoFull = ({ className, showTagline = true }: LogoFullProps) => {
  return (
    <img 
      src="/logo-full.png" 
      alt="VisitaProva - Prova de intermediação" 
      className={className}
    />
  );
};
