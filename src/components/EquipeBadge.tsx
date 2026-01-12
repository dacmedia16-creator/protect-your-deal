import { cn } from '@/lib/utils';

interface EquipeBadgeProps {
  nome: string;
  cor: string;
  parentNome?: string;
  className?: string;
}

export function EquipeBadge({ nome, cor, parentNome, className }: EquipeBadgeProps) {
  // Determinar se a cor é clara ou escura para escolher texto contrastante
  const isLightColor = (hexColor: string) => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  };

  const textColor = isLightColor(cor) ? '#000000' : '#FFFFFF';
  const displayName = parentNome ? `${parentNome} › ${nome}` : nome;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        className
      )}
      style={{ 
        backgroundColor: cor, 
        color: textColor 
      }}
    >
      {displayName}
    </span>
  );
}