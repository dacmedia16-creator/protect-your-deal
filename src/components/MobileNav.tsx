import { useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, Handshake, UsersRound, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useConvitesPendentes } from '@/hooks/useConvitesPendentes';
import { Badge } from '@/components/ui/badge';
import { useImobiliariaFeatureFlag } from '@/hooks/useImobiliariaFeatureFlag';
import { useUserFeatureFlag } from '@/hooks/useUserFeatureFlag';
import { useEquipeLider } from '@/hooks/useEquipeLider';

export function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { imobiliariaId } = useUserRole();
  const { enabled: imobSurveyEnabled } = useImobiliariaFeatureFlag('post_visit_survey');
  const { enabled: userSurveyEnabled } = useUserFeatureFlag('post_visit_survey');
  const { isLider } = useEquipeLider();
  
  const surveyEnabled = imobiliariaId ? imobSurveyEnabled : userSurveyEnabled;

  const navItems = [
    { path: '/dashboard', label: 'Início', icon: Home },
    { path: '/fichas', label: 'Registros', icon: FileText },
    ...(isLider ? [{ path: '/minha-equipe', label: 'Equipe', icon: UsersRound }] : [{ path: '/convites', label: 'Convites', icon: Handshake }]),
    ...(surveyEnabled ? [{ path: '/pesquisas', label: 'Pesquisas', icon: FileText }] : []),
  ];

  const handleSofiaClick = () => {
    window.dispatchEvent(new CustomEvent('toggle-sofia'));
  };

  const { data: convitesPendentes = 0 } = useConvitesPendentes();

  if (!user) return null;

  return (
    <nav data-tour="nav-menu" className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-sm sm:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-14">
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
      </div>
    </nav>
  );
}
