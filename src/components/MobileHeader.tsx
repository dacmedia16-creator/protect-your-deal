import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, User, LogOut, Handshake, CreditCard, Download, Loader2, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { RoleBadge } from '@/components/RoleBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useEquipeLider } from '@/hooks/useEquipeLider';

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
  const { user, signOut } = useAuth();
  const { role, imobiliariaId } = useUserRole();
  const { isInstalled, isIOS, isInstallable, install } = usePWAInstall();
  const { isLider } = useEquipeLider();
  const isCorretorAutonomo = role === 'corretor' && !imobiliariaId;

  const [profile, setProfile] = useState<{ nome: string; foto_url: string | null } | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  const handleSignOut = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await signOut();
      navigate('/auth');
    } finally {
      setIsLoggingOut(false);
    }
  };

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
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="shrink-0 sm:hidden">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.foto_url || undefined} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {profile?.nome?.charAt(0)?.toUpperCase() || <User className="h-3.5 w-3.5" />}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
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
                  {isLider && (
                    <DropdownMenuItem onClick={() => navigate('/minha-equipe')}>
                      <UsersRound className="h-4 w-4 mr-2" />
                      Minha Equipe
                    </DropdownMenuItem>
                  )}
                  {!isInstalled && (
                    <DropdownMenuItem onClick={handleInstallApp}>
                      <Download className="h-4 w-4 mr-2" />
                      {isInstallable ? 'Instalar com 1 clique' : 'Instalar App'}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} disabled={isLoggingOut} className="text-destructive">
                    {isLoggingOut ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LogOut className="h-4 w-4 mr-2" />}
                    {isLoggingOut ? 'Saindo...' : 'Sair'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
