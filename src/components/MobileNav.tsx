import { useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, Users, User, LogOut, CreditCard, Handshake, Download, ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { RoleBadge } from '@/components/RoleBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useConvitesPendentes } from '@/hooks/useConvitesPendentes';
import { Badge } from '@/components/ui/badge';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useImobiliariaFeatureFlag } from '@/hooks/useImobiliariaFeatureFlag';

export function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { role, imobiliariaId } = useUserRole();
  const { isInstalled, isIOS, install } = usePWAInstall();
  const { enabled: surveyEnabled } = useImobiliariaFeatureFlag('post_visit_survey');
  
  const isCorretorAutonomo = role === 'corretor' && !imobiliariaId;
  const [profile, setProfile] = useState<{ nome: string; foto_url: string | null } | null>(null);

  const navItems = [
    { path: '/dashboard', label: 'Início', icon: Home },
    { path: '/fichas', label: 'Registros', icon: FileText },
    { path: '/convites', label: 'Convites', icon: Handshake },
    ...(surveyEnabled ? [{ path: '/pesquisas', label: 'Pesquisas', icon: ClipboardCheck }] : []),
  ];
  
  const handleInstallApp = async () => {
    if (isIOS) {
      navigate('/instalar');
    } else {
      const success = await install();
      if (!success) {
        navigate('/instalar');
      }
    }
  };

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

  const { data: convitesPendentes = 0 } = useConvitesPendentes();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-sm sm:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          const showBadge = item.path === '/convites' && convitesPendentes > 0;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors relative",
                "active:bg-muted/50 touch-action-manipulation",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
                {showBadge && (
                  <Badge className="absolute -top-1.5 -right-2.5 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center">
                    {convitesPendentes}
                  </Badge>
                )}
              </div>
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
            <DropdownMenuLabel className="pb-2">
              <RoleBadge role={role} variant="compact" />
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/perfil')}>
              <User className="h-4 w-4 mr-2" />
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/fichas-parceiro')}>
              <Handshake className="h-4 w-4 mr-2" />
              Registros como Parceiro
            </DropdownMenuItem>
            {isCorretorAutonomo && (
              <DropdownMenuItem onClick={() => navigate('/minha-assinatura')}>
                <CreditCard className="h-4 w-4 mr-2" />
                Minha Assinatura
              </DropdownMenuItem>
            )}
            {!isInstalled && (
              <DropdownMenuItem onClick={handleInstallApp}>
                <Download className="h-4 w-4 mr-2" />
                Instalar App
              </DropdownMenuItem>
            )}
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
