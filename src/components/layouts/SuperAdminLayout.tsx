import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import {
  Building2,
  LayoutDashboard,
  CreditCard,
  Users,
  UserPlus,
  Settings,
  LogOut,
  
  Menu,
  Stethoscope,
  X,
  FileText,
  Mail,
  UserCircle,
  TrendingUp,
  Archive,
  Image,
  UserCheck,
  Ticket,
  DollarSign,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LogoIcon } from '@/components/LogoIcon';

interface SuperAdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/imobiliarias', icon: Building2, label: 'Imobiliárias' },
  { href: '/admin/fichas', icon: FileText, label: 'Registros' },
  { href: '/admin/backups', icon: Archive, label: 'Backups' },
  { href: '/admin/planos', icon: CreditCard, label: 'Planos' },
  { href: '/admin/assinaturas', icon: CreditCard, label: 'Assinaturas' },
  { href: '/admin/financeiro', icon: TrendingUp, label: 'Financeiro' },
  { href: '/admin/afiliados', icon: UserCheck, label: 'Afiliados' },
  { href: '/admin/cupons', icon: Ticket, label: 'Cupons' },
  { href: '/admin/comissoes', icon: DollarSign, label: 'Comissões' },
  { href: '/admin/usuarios', icon: Users, label: 'Usuários' },
  { href: '/admin/autonomos', icon: UserCircle, label: 'Autônomos' },
  { href: '/admin/usuarios-pendentes', icon: UserPlus, label: 'Pendentes' },
  { href: '/admin/convites', icon: Mail, label: 'Convites' },
  { href: '/admin/marketing', icon: Image, label: 'Marketing' },
  { href: '/admin/diagnostico', icon: Stethoscope, label: 'Diagnóstico' },
  { href: '/admin/configuracoes', icon: Settings, label: 'Configurações' },
];

export function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const queryClient = useQueryClient();
  const { playNotificationSound } = useNotificationSound();

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

  // Buscar contagem de assinaturas suspensas/pendentes
  const { data: assinaturasCount } = useQuery({
    queryKey: ['sidebar-assinaturas-pendentes'],
    queryFn: async () => {
      const { count } = await supabase
        .from('assinaturas')
        .select('*', { count: 'exact', head: true })
        .in('status', ['suspensa', 'pendente']);
      return count || 0;
    },
    refetchInterval: 60000,
  });

  // Buscar contagem de usuários pendentes (sem imobiliária)
  const { data: usuariosPendentesCount } = useQuery({
    queryKey: ['sidebar-usuarios-pendentes'],
    queryFn: async () => {
      const { count } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .is('imobiliaria_id', null)
        .neq('role', 'super_admin');
      return count || 0;
    },
    refetchInterval: 60000,
  });

  // Buscar contagem de convites pendentes
  const { data: convitesPendentesCount } = useQuery({
    queryKey: ['sidebar-convites-pendentes'],
    queryFn: async () => {
      const { count } = await supabase
        .from('convites')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendente');
      return count || 0;
    },
    refetchInterval: 60000,
  });

  // Subscriptions em tempo real para notificações
  useEffect(() => {
    const channel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assinaturas',
        },
        (payload) => {
          const newRecord = payload.new as { status?: string };
          const oldRecord = payload.old as { status?: string };
          
          if (payload.eventType === 'UPDATE' && 
              (newRecord?.status === 'suspensa' || newRecord?.status === 'pendente') &&
              oldRecord?.status !== newRecord?.status) {
            playNotificationSound('warning');
            toast.warning('Assinatura requer atenção', {
              description: `Uma assinatura foi marcada como ${newRecord.status}`,
            });
          }
          queryClient.invalidateQueries({ queryKey: ['sidebar-assinaturas-pendentes'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_roles',
        },
        (payload) => {
          const newRecord = payload.new as { imobiliaria_id?: string; role?: string };
          if (!newRecord?.imobiliaria_id && newRecord?.role !== 'super_admin') {
            playNotificationSound('info');
            toast.info('Novo usuário pendente', {
              description: 'Um novo usuário aguarda vinculação a uma imobiliária',
            });
          }
          queryClient.invalidateQueries({ queryKey: ['sidebar-usuarios-pendentes'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'convites',
        },
        () => {
          playNotificationSound('info');
          toast.info('Novo convite criado', {
            description: 'Um novo convite foi enviado e aguarda aceitação',
          });
          queryClient.invalidateQueries({ queryKey: ['sidebar-convites-pendentes'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'convites',
        },
        (payload) => {
          const newRecord = payload.new as { status?: string };
          const oldRecord = payload.old as { status?: string };
          
          if (oldRecord?.status === 'pendente' && newRecord?.status === 'aceito') {
            playNotificationSound('success');
            toast.success('Convite aceito', {
              description: 'Um convite foi aceito com sucesso',
            });
          }
          queryClient.invalidateQueries({ queryKey: ['sidebar-convites-pendentes'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, playNotificationSound]);

  // Mapeamento de badges por href
  const badgeCounts: Record<string, number | undefined> = {
    '/admin/assinaturas': assinaturasCount,
    '/admin/usuarios-pendentes': usuariosPendentesCount,
    '/admin/convites': convitesPendentesCount,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <LogoIcon size={24} />
          <span className="font-display font-bold text-lg">Super Admin</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 bg-sidebar border-r border-sidebar-border z-40 transform transition-transform duration-200 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center gap-2 px-4 border-b border-sidebar-border">
            <LogoIcon size={24} />
            <span className="font-display font-bold text-lg text-sidebar-foreground">Super Admin</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/admin' && location.pathname.startsWith(item.href));
              const badgeCount = badgeCounts[item.href];
              
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
                  {badgeCount !== undefined && badgeCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="ml-auto h-5 min-w-5 flex items-center justify-center px-1.5 text-[10px]"
                    >
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border space-y-2">
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

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
