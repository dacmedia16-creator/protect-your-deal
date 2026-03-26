import { Badge } from '@/components/ui/badge';
import { Shield, Building2, UserCheck, UserX, HardHat } from 'lucide-react';
import { AppRole } from '@/hooks/useUserRole';
import { cn } from '@/lib/utils';

interface RoleBadgeProps {
  role: AppRole | null;
  variant?: 'default' | 'compact';
  className?: string;
  isAutonomo?: boolean;
}

const roleConfig: Record<string, { 
  label: string; 
  icon: typeof Shield; 
  className: string;
}> = {
  super_admin: { 
    label: 'Super Admin', 
    icon: Shield, 
    className: 'bg-destructive/10 text-destructive border-destructive/20' 
  },
  imobiliaria_admin: { 
    label: 'Admin Imobiliária', 
    icon: Building2, 
    className: 'bg-primary/10 text-primary border-primary/20' 
  },
  construtora_admin: { 
    label: 'Admin Construtora', 
    icon: HardHat, 
    className: 'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400' 
  },
  corretor: { 
    label: 'Corretor', 
    icon: UserCheck, 
    className: 'bg-muted text-muted-foreground border-border' 
  },
  corretor_autonomo: { 
    label: 'Corretor Autônomo', 
    icon: UserX, 
    className: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400' 
  },
};

export function RoleBadge({ role, variant = 'default', className, isAutonomo = false }: RoleBadgeProps) {
  if (!role) return null;

  // Usa config de corretor autônomo se for corretor sem imobiliária
  const configKey = role === 'corretor' && isAutonomo ? 'corretor_autonomo' : role;
  const config = roleConfig[configKey] || roleConfig.corretor;
  const Icon = config.icon;

  if (variant === 'compact') {
    return (
      <Badge variant="outline" className={cn("gap-1 text-xs font-normal", config.className, className)}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={cn("gap-1.5 px-2 py-0.5", config.className, className)}>
      <Icon className="h-3.5 w-3.5" />
      <span className="text-xs font-medium">{config.label}</span>
    </Badge>
  );
}
