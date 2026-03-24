import { Shield, FileCheck, Users, Home, Plus, ClipboardList, MessageSquare, Star, User } from 'lucide-react';

const MobileAppMockup = () => {
  return (
    <div className="flex justify-center">
      {/* Phone Frame */}
      <div className="relative w-[240px] animate-float">
        {/* Phone Bezel */}
        <div className="bg-gray-900 dark:bg-gray-800 rounded-[2.5rem] p-2 shadow-2xl shadow-primary/20">
          {/* Screen */}
          <div className="bg-background rounded-[2rem] overflow-hidden">
            {/* Status Bar */}
            <div className="bg-muted/50 px-4 py-2 flex items-center justify-between">
              <span className="text-[10px] font-medium">9:41</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-2 bg-foreground/60 rounded-sm" />
              </div>
            </div>

            {/* App Header */}
            <div className="bg-primary px-4 py-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary-foreground" />
                <span className="font-bold text-xs text-primary-foreground">VisitaProva</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-3 space-y-3 h-[300px] bg-muted/20">
              {/* Welcome */}
              <div>
                <p className="text-sm font-bold">Bem-vindo! 👋</p>
                <p className="text-[9px] text-muted-foreground">Seus registros do mês</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-1.5">
                <div className="bg-card rounded-lg p-2 border border-border text-center">
                  <p className="text-lg font-bold">25</p>
                  <p className="text-[8px] text-muted-foreground leading-tight">Total</p>
                </div>
                <div className="bg-card rounded-lg p-2 border border-border text-center">
                  <p className="text-lg font-bold text-emerald-600">23</p>
                  <p className="text-[8px] text-muted-foreground leading-tight">Confirmadas</p>
                </div>
                <div className="bg-card rounded-lg p-2 border border-border text-center">
                  <p className="text-lg font-bold text-amber-500">2</p>
                  <p className="text-[8px] text-muted-foreground leading-tight">Pendentes</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">Ações Rápidas</p>
                <div className="space-y-1.5">
                  <div className="bg-primary text-primary-foreground rounded-lg p-2.5 flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <div>
                      <p className="text-[10px] font-semibold">Novo Registro de Visita</p>
                      <p className="text-[8px] opacity-80">Registrar agora</p>
                    </div>
                  </div>
                  <div className="bg-card rounded-lg p-2.5 border border-border flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-[10px] font-semibold">Ver Registros</p>
                      <p className="text-[8px] text-muted-foreground">25 fichas este mês</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent */}
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">Última Visita</p>
                <div className="bg-card rounded-lg p-2 border border-border flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <FileCheck className="h-3 w-3 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium truncate">Apt 301 - Centro</p>
                    <p className="text-[8px] text-muted-foreground">Confirmada • Hoje, 14:00</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Nav */}
            <div className="bg-card border-t border-border px-2 py-2 flex items-center justify-around">
              <div className="flex flex-col items-center gap-0.5">
                <Home className="h-4 w-4 text-primary" />
                <span className="text-[7px] text-primary font-medium">Início</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <FileCheck className="h-4 w-4 text-muted-foreground" />
                <span className="text-[7px] text-muted-foreground">Registros</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-[7px] text-muted-foreground">Convites</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <Star className="h-4 w-4 text-muted-foreground" />
                <span className="text-[7px] text-muted-foreground">Pesquisas</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-[7px] text-muted-foreground">Perfil</span>
              </div>
            </div>

            {/* Home Indicator */}
            <div className="flex justify-center py-1">
              <div className="w-24 h-1 bg-foreground/20 rounded-full" />
            </div>
          </div>
        </div>
        
        {/* Notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-900 dark:bg-gray-800 rounded-full" />
      </div>
    </div>
  );
};

export default MobileAppMockup;
