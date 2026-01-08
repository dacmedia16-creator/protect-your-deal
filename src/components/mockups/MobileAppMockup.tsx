import { Shield, FileCheck, Users, Home, Plus, Bell, BarChart3 } from 'lucide-react';

const MobileAppMockup = () => {
  return (
    <div className="flex justify-center">
      {/* Phone Frame */}
      <div className="relative w-[220px]">
        {/* Phone Bezel */}
        <div className="bg-gray-900 dark:bg-gray-800 rounded-[2.5rem] p-2 shadow-2xl">
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary-foreground" />
                  <span className="font-bold text-sm text-primary-foreground">VisitaSegura</span>
                </div>
                <Bell className="h-4 w-4 text-primary-foreground/80" />
              </div>
            </div>

            {/* Content */}
            <div className="p-3 space-y-3 h-[280px] bg-muted/20">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-card rounded-lg p-2 border border-border">
                  <p className="text-[10px] text-muted-foreground">Registros do Mês</p>
                  <p className="text-lg font-bold">24</p>
                </div>
                <div className="bg-card rounded-lg p-2 border border-border">
                  <p className="text-[10px] text-muted-foreground">Confirmadas</p>
                  <p className="text-lg font-bold text-emerald-600">18</p>
                </div>
              </div>

              {/* Recent Visits */}
              <div className="bg-card rounded-lg border border-border p-2">
                <p className="text-[10px] font-medium text-muted-foreground mb-2">Visitas Recentes</p>
                <div className="space-y-2">
                  {[1, 2].map((_, i) => (
                    <div key={i} className="flex items-center gap-2 py-1 border-b border-border last:border-0">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <Home className="h-3 w-3 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium truncate">Apt {i + 1}01 - Centro</p>
                        <p className="text-[9px] text-muted-foreground">Hoje, 14:00</p>
                      </div>
                      <div className={`h-1.5 w-1.5 rounded-full ${i === 0 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-card rounded-lg p-2 border border-border text-center">
                  <FileCheck className="h-4 w-4 mx-auto text-primary mb-1" />
                  <p className="text-[9px]">Fichas</p>
                </div>
                <div className="bg-card rounded-lg p-2 border border-border text-center">
                  <Users className="h-4 w-4 mx-auto text-primary mb-1" />
                  <p className="text-[9px]">Clientes</p>
                </div>
                <div className="bg-card rounded-lg p-2 border border-border text-center">
                  <BarChart3 className="h-4 w-4 mx-auto text-primary mb-1" />
                  <p className="text-[9px]">Relatórios</p>
                </div>
              </div>
            </div>

            {/* FAB */}
            <div className="absolute bottom-16 right-6">
              <div className="h-10 w-10 rounded-full bg-primary shadow-lg flex items-center justify-center">
                <Plus className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>

            {/* Bottom Nav */}
            <div className="bg-card border-t border-border px-4 py-2 flex items-center justify-around">
              <Home className="h-5 w-5 text-primary" />
              <FileCheck className="h-5 w-5 text-muted-foreground" />
              <Users className="h-5 w-5 text-muted-foreground" />
              <div className="h-6 w-6 rounded-full bg-muted" />
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
