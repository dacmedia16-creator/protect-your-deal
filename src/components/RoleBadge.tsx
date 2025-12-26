import { Badge } from '@/components/ui/badge';
import { Shield, Building2, UserCheck } from 'lucide-react';
import { AppRole } from '@/hooks/useUserRole';
import { cn } from '@/lib/utils';

interface RoleBadgeProps {
  role: AppRole | null;
  variant?: 'default' | 'compact';
  className?: string;
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
    label: 'Admin', 
    icon: Building2, 
    className: 'bg-primary/10 text-primary border-primary/20' 
  },
  corretor: { 
    label: 'Corretor', 
    icon: UserCheck, 
    className: 'bg-muted text-muted-foreground border-border' 
  },
};

export function RoleBadge({ role, variant = 'default', className }: RoleBadgeProps) {
  if (!role) return null;

  const config = roleConfig[role] || roleConfig.corretor;
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
