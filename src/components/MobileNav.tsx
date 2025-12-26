import { useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, Users, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { path: '/dashboard', label: 'Início', icon: Home },
  { path: '/fichas', label: 'Fichas', icon: FileText },
  { path: '/clientes', label: 'Clientes', icon: Users },
];

export function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-sm md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                "active:bg-muted/50 touch-action-manipulation",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex flex-col items-center justify-center w-full h-full gap-1 text-muted-foreground active:bg-muted/50 touch-action-manipulation">
              <Menu className="h-5 w-5" />
              <span className="text-[10px] font-medium">Mais</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 mb-2 mr-2">
            <DropdownMenuItem onClick={() => navigate('/integracoes')}>
              Integrações
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/integracoes/templates')}>
              Templates de Mensagem
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
