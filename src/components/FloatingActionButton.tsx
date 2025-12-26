import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export function FloatingActionButton({ onClick, label, className }: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className={cn(
        "fixed bottom-20 right-4 md:hidden z-40 rounded-full h-14 w-14 shadow-lg",
        "gradient-primary hover:opacity-90 transition-opacity",
        className
      )}
      aria-label={label || 'Adicionar'}
    >
      <Plus className="h-6 w-6" />
    </Button>
  );
}
