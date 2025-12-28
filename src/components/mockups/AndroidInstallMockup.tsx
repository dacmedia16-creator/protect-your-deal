import { MoreVertical, Plus, Download, Check } from "lucide-react";

interface AndroidInstallMockupProps {
  step: 1 | 2 | 3;
}

export function AndroidInstallMockup({ step }: AndroidInstallMockupProps) {
  return (
    <div className="relative mx-auto w-48 h-80 bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-1 shadow-xl">
      {/* Phone frame */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-700 rounded-full" />
      
      {/* Screen */}
      <div className="relative h-full bg-white dark:bg-slate-950 rounded-xl overflow-hidden">
        {/* Status bar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 dark:bg-slate-900">
          <span className="text-[8px] font-medium text-foreground">9:41</span>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 border-2 border-foreground/60 rounded-sm" />
            <div className="w-3 h-2 border border-foreground/60 rounded-sm">
              <div className="w-2 h-1 bg-green-500 rounded-sm ml-0.5 mt-0.5" />
            </div>
          </div>
        </div>

        {/* Chrome URL bar with menu */}
        <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-100 dark:bg-slate-900">
          <div className="flex-1 bg-white dark:bg-slate-800 rounded-full px-3 py-1 flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center">
              <span className="text-[6px] text-white">🔒</span>
            </div>
            <span className="text-[7px] text-muted-foreground truncate">visitasegura.app</span>
          </div>
          <div className={`relative ${step === 1 ? 'animate-pulse' : ''}`}>
            <MoreVertical className={`w-4 h-4 ${step === 1 ? 'text-primary' : 'text-muted-foreground'}`} />
            {step === 1 && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-ping" />
            )}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 p-3 bg-background">
          {/* App preview */}
          <div className="bg-primary/10 rounded-lg p-2 mb-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <span className="text-[8px] text-primary-foreground font-bold">V</span>
              </div>
              <span className="text-[8px] font-medium">VisitaSegura</span>
            </div>
            <div className="space-y-1">
              <div className="h-1.5 bg-muted rounded w-full" />
              <div className="h-1.5 bg-muted rounded w-3/4" />
            </div>
          </div>
          
          {/* Cards preview */}
          <div className="space-y-2">
            <div className="bg-muted/50 rounded p-2">
              <div className="h-1.5 bg-muted rounded w-1/2 mb-1" />
              <div className="h-1 bg-muted rounded w-3/4" />
            </div>
            <div className="bg-muted/50 rounded p-2">
              <div className="h-1.5 bg-muted rounded w-2/3 mb-1" />
              <div className="h-1 bg-muted rounded w-1/2" />
            </div>
          </div>
        </div>

        {/* Step-specific content */}
        {step === 1 && (
          <>
            {/* Menu highlight indicator */}
            <div className="absolute top-8 right-2 bg-primary text-primary-foreground text-[7px] px-2 py-1 rounded-full animate-bounce">
              Toque aqui
            </div>
          </>
        )}

        {step === 2 && (
          <>
            {/* Chrome dropdown menu */}
            <div className="absolute top-12 right-2 w-36 bg-white dark:bg-slate-900 rounded-lg border shadow-xl overflow-hidden">
              <div className="py-1">
                <div className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50">
                  <div className="w-4 h-4 bg-muted rounded" />
                  <span className="text-[8px]">Nova aba</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50">
                  <div className="w-4 h-4 bg-muted rounded" />
                  <span className="text-[8px]">Histórico</span>
                </div>
                <div className="border-t my-1" />
                {/* Install app option - highlighted */}
                <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border-l-2 border-primary">
                  <Download className="w-4 h-4 text-primary" />
                  <span className="text-[8px] font-medium text-primary">Instalar app</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50">
                  <Plus className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[8px]">Adicionar à tela inicial</span>
                </div>
                <div className="border-t my-1" />
                <div className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50">
                  <div className="w-4 h-4 bg-muted rounded" />
                  <span className="text-[8px]">Configurações</span>
                </div>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            {/* Install confirmation dialog */}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 w-full max-w-xs shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                    <span className="text-lg text-primary-foreground font-bold">V</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold">Instalar VisitaSegura?</p>
                    <p className="text-[8px] text-muted-foreground">visitasegura.app</p>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-[8px] text-muted-foreground">Funciona offline</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-[8px] text-muted-foreground">Abre em tela cheia</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 py-2 text-[9px] text-muted-foreground border rounded-lg">
                    Cancelar
                  </button>
                  <button className="flex-1 py-2 text-[9px] text-primary-foreground bg-primary rounded-lg font-medium animate-pulse">
                    Instalar
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
