import { useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, Users, User, LogOut, Settings, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const navItems = [
  { path: '/dashboard', label: 'Início', icon: Home },
  { path: '/fichas', label: 'Fichas', icon: FileText },
  { path: '/clientes', label: 'Clientes', icon: Users },
];

export function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<{ nome: string; foto_url: string | null } | null>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('nome, foto_url')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => setProfile(data));
    }
  }, [user]);

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const isProfileActive = location.pathname === '/perfil';

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
            <button className={cn(
              "flex flex-col items-center justify-center w-full h-full gap-1 active:bg-muted/50 touch-action-manipulation",
              isProfileActive ? "text-primary" : "text-muted-foreground"
            )}>
              <Avatar className="h-5 w-5">
                <AvatarImage src={profile?.foto_url || undefined} />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {profile?.nome?.charAt(0)?.toUpperCase() || <User className="h-3 w-3" />}
                </AvatarFallback>
              </Avatar>
              <span className="text-[10px] font-medium">Perfil</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 mb-2 mr-2">
            <DropdownMenuItem onClick={() => navigate('/perfil')}>
              <User className="h-4 w-4 mr-2" />
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/integracoes')}>
              <Settings className="h-4 w-4 mr-2" />
              Integrações
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/integracoes/templates')}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Templates
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
