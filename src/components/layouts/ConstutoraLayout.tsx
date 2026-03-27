import { ReactNode, useState } from 'react';
import { subscriptionStatusColors, getStatusColor } from '@/lib/statusColors';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  HardHat,
  LayoutDashboard,
  Building,
  Users,
  UsersRound,
  FileText,
  Settings,
  LogOut,
  CreditCard,
  Menu,
  X,
  UserCircle,
  BarChart3,
  Handshake,
  ClipboardCheck,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ConstutoraLayoutProps {
  children: ReactNode;
}

export function ConstutoraLayout({ children }: ConstutoraLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { construtora, assinatura } = useUserRole();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  const navItems = [
    { href: '/construtora', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/construtora/empreendimentos', icon: Building, label: 'Empreendimentos' },
    { href: '/construtora/imobiliarias', icon: Handshake, label: 'Imobiliárias Parceiras' },
    { href: '/construtora/corretores', icon: Users, label: 'Corretores' },
    { href: '/construtora/equipes', icon: UsersRound, label: 'Equipes' },
    { href: '/construtora/fichas', icon: FileText, label: 'Registros de Visita' },
    { href: '/construtora/relatorios', icon: BarChart3, label: 'Relatórios' },
    { href: '/construtora/assinatura', icon: CreditCard, label: 'Assinatura' },
    { href: '/construtora/configuracoes', icon: Settings, label: 'Configurações' },
  ];

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('nome')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {construtora?.logo_url ? (
            <img 
              src={construtora.logo_url} 
              alt={construtora.nome} 
              className="h-8 w-8 object-contain rounded"
            />
          ) : (
            <HardHat className="h-6 w-6 text-orange-500" />
          )}
          <span className="font-display font-bold text-lg truncate max-w-[120px]">
            {construtora?.nome || 'Construtora'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Olá, {profile?.nome?.split(' ')[0] || 'Usuário'}!
          </span>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 bg-sidebar border-r border-sidebar-border z-40 transform transition-transform duration-200 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3 mb-2">
              {construtora?.logo_url ? (
                <img 
                  src={construtora.logo_url} 
                  alt={construtora.nome} 
                  className="h-10 w-10 object-contain rounded"
                />
              ) : (
                <HardHat className="h-6 w-6 text-orange-500" />
              )}
              <span className="font-display font-bold text-lg text-sidebar-foreground truncate">
                {construtora?.nome || 'Construtora'}
              </span>
            </div>
            {assinatura && (
              <Badge className={cn("text-xs", getStatusColor(subscriptionStatusColors, assinatura.status))}>
                {assinatura.status === 'ativa' && 'Ativa'}
                {assinatura.status === 'trial' && 'Período de Teste'}
                {assinatura.status === 'pendente' && 'Pendente'}
                {assinatura.status === 'suspensa' && 'Suspensa'}
                {assinatura.status === 'cancelada' && 'Cancelada'}
              </Badge>
            )}
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/construtora' && location.pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-sidebar-border space-y-2">
            <Link 
              to="/perfil"
              className="flex items-center gap-3 px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg"
            >
              <UserCircle className="h-5 w-5" />
              Meu Perfil
            </Link>
            <ThemeToggle />
            <Button 
              variant="ghost" 
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={handleSignOut}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? <Loader2 className="h-5 w-5 mr-3 animate-spin" /> : <LogOut className="h-5 w-5 mr-3" />}
              {isLoggingOut ? 'Saindo...' : 'Sair'}
            </Button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
