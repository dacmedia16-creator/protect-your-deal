import { useNavigate } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { RoleBadge } from '@/components/RoleBadge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  LogOut, 
  User,
  ChevronDown,
  CreditCard,
  Handshake,
  CalendarDays
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useConvitesPendentes } from '@/hooks/useConvitesPendentes';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/fichas', label: 'Fichas', icon: FileText },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays },
  { to: '/convites-recebidos', label: 'Convites', icon: Handshake },
  { to: '/clientes', label: 'Clientes', icon: Users },
];

export function DesktopNav() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { role, imobiliaria, imobiliariaId } = useUserRole();
  
  const isCorretorAutonomo = role === 'corretor' && !imobiliariaId;
  
  const { data: convitesPendentes = 0 } = useConvitesPendentes();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="hidden sm:flex border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50 animate-fade-in">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo + Links */}
        <div className="flex items-center gap-8">
          <NavLink to="/dashboard" className="flex items-center gap-2 font-semibold text-lg text-primary">
            {imobiliaria?.logo_url ? (
              <img 
                src={imobiliaria.logo_url} 
                alt={imobiliaria.nome} 
                className="h-7 w-7 rounded object-contain"
              />
            ) : (
              <FileText className="h-6 w-6" />
            )}
            <span className="truncate max-w-[200px]">{imobiliaria?.nome || 'Ficha de Visita'}</span>
          </NavLink>
          
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const showBadge = item.to === '/convites-recebidos' && convitesPendentes > 0;
              
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors relative"
                  activeClassName="text-foreground bg-muted"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  {showBadge && (
                    <Badge className="ml-1 h-5 min-w-5 px-1.5 text-[10px]">
                      {convitesPendentes}
                    </Badge>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Right side: Theme Toggle + Profile Dropdown */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.foto_url || ''} alt={profile?.nome || 'Usuário'} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {profile?.nome ? getInitials(profile.nome) : <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium max-w-[120px] truncate">
                  {profile?.nome?.split(' ')[0] || 'Usuário'}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{profile?.nome || 'Usuário'}</p>
                    <RoleBadge role={role} variant="compact" />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/perfil')} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Meu Perfil
              </DropdownMenuItem>
              {isCorretorAutonomo && (
                <DropdownMenuItem onClick={() => navigate('/minha-assinatura')} className="cursor-pointer">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Minha Assinatura
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
