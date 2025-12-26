import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backPath?: string;
  showAdd?: boolean;
  onAdd?: () => void;
  addLabel?: string;
  className?: string;
  children?: React.ReactNode;
}

export function MobileHeader({
  title,
  subtitle,
  showBack = true,
  backPath = '/dashboard',
  showAdd = false,
  onAdd,
  addLabel,
  className,
  children,
}: MobileHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className={cn("border-b bg-card sticky top-0 z-10 safe-area-top", className)}>
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {showBack && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate(backPath)}
                className="shrink-0 h-9 w-9"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="min-w-0">
              <h1 className="font-display text-lg md:text-xl font-bold truncate">{title}</h1>
              {subtitle && (
                <p className="text-xs md:text-sm text-muted-foreground truncate">{subtitle}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {children}
            {showAdd && onAdd && (
              <Button onClick={onAdd} size="sm" className="gap-1.5 h-9">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">{addLabel || 'Novo'}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
