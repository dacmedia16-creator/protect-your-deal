import { Share, Plus, Check, MoreHorizontal } from "lucide-react";

interface IOSInstallMockupProps {
  step: 1 | 2 | 3 | 4;
}

export function IOSInstallMockup({ step }: IOSInstallMockupProps) {
  return (
    <div className="relative mx-auto w-48 h-80 bg-gradient-to-b from-slate-900 to-slate-800 rounded-3xl p-1.5 shadow-xl">
      {/* Phone frame */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-900 rounded-b-xl z-10" />
      
      {/* Screen */}
      <div className="relative h-full bg-white dark:bg-slate-950 rounded-2xl overflow-hidden">
        {/* Status bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-900">
          <span className="text-[8px] font-medium text-foreground">9:41</span>
          <div className="flex items-center gap-0.5">
            <div className="w-3 h-1.5 bg-foreground/60 rounded-sm" />
            <div className="w-2 h-1.5 bg-foreground/60 rounded-sm" />
            <div className="w-3 h-2 border border-foreground/60 rounded-sm">
              <div className="w-2 h-1 bg-green-500 rounded-sm ml-0.5 mt-0.5" />
            </div>
          </div>
        </div>

        {/* Safari URL bar */}
        <div className="px-2 py-1.5 bg-slate-100 dark:bg-slate-900">
          <div className="bg-white dark:bg-slate-800 rounded-lg px-2 py-1 flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-primary/20 flex items-center justify-center">
              <div className="w-1.5 h-1.5 text-primary">✓</div>
            </div>
            <span className="text-[7px] text-muted-foreground truncate">visitasegura.app</span>
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
              <span className="text-[8px] font-medium">VisitaProva</span>
            </div>
            <div className="space-y-1">
              <div className="h-1.5 bg-muted rounded w-full" />
              <div className="h-1.5 bg-muted rounded w-3/4" />
            </div>
          </div>
        </div>

        {/* Step-specific content */}
        {step === 1 && (
          <>
            {/* 3 dots highlight */}
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2">
              <div className="animate-pulse bg-primary rounded-full p-2">
                <MoreHorizontal className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
            {/* Safari bottom bar */}
            <div className="absolute bottom-0 inset-x-0 h-12 bg-slate-100 dark:bg-slate-900 border-t flex items-center justify-around px-4">
              <div className="w-4 h-4 bg-muted rounded" />
              <div className="w-4 h-4 bg-muted rounded" />
              <div className="relative">
                <MoreHorizontal className="w-5 h-5 text-primary" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-ping" />
              </div>
              <div className="w-4 h-4 bg-muted rounded" />
              <div className="w-4 h-4 bg-muted rounded" />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            {/* Menu with Share option highlighted */}
            <div className="absolute inset-x-0 bottom-0 h-48 bg-white dark:bg-slate-900 rounded-t-2xl border-t shadow-lg">
              <div className="w-10 h-1 bg-muted rounded-full mx-auto mt-2" />
              <div className="p-3 space-y-2">
                {/* Menu options */}
                <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg border-2 border-primary">
                  <Share className="w-5 h-5 text-primary" />
                  <span className="text-[9px] font-medium text-primary">Compartilhar</span>
                </div>
                <div className="flex items-center gap-2 p-2">
                  <div className="w-5 h-5 bg-muted rounded" />
                  <span className="text-[8px] text-muted-foreground">Copiar Link</span>
                </div>
                <div className="flex items-center gap-2 p-2">
                  <div className="w-5 h-5 bg-muted rounded" />
                  <span className="text-[8px] text-muted-foreground">Favoritos</span>
                </div>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            {/* Share sheet overlay */}
            <div className="absolute inset-x-0 bottom-0 h-48 bg-white dark:bg-slate-900 rounded-t-2xl border-t shadow-lg">
              <div className="w-10 h-1 bg-muted rounded-full mx-auto mt-2" />
              <div className="p-3 space-y-2">
                {/* Share options */}
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className="w-8 h-8 bg-muted rounded-full" />
                      <span className="text-[6px] text-muted-foreground">App {i}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-2">
                  {/* Add to Home Screen option - highlighted */}
                  <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg border-2 border-primary">
                    <div className="w-6 h-6 bg-muted rounded flex items-center justify-center">
                      <Plus className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-[8px] font-medium text-primary">Adicionar à Tela de Início</span>
                  </div>
                  {/* Other options */}
                  <div className="flex items-center gap-2 p-2 mt-1">
                    <div className="w-6 h-6 bg-muted rounded" />
                    <span className="text-[8px] text-muted-foreground">Copiar Link</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            {/* Add to Home Screen confirmation */}
            <div className="absolute inset-x-2 top-20 bg-white dark:bg-slate-900 rounded-xl border shadow-xl p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] text-primary font-medium">Cancelar</span>
                <span className="text-[9px] font-semibold">Adicionar à Tela</span>
                <span className="text-[9px] text-primary font-medium bg-primary/10 px-2 py-1 rounded animate-pulse">Adicionar</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow">
                  <span className="text-sm text-primary-foreground font-bold">V</span>
                </div>
                <div>
                  <p className="text-[9px] font-medium">VisitaSegura</p>
                  <p className="text-[7px] text-muted-foreground">visitasegura.app</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-center gap-1">
                <Check className="w-3 h-3 text-green-500" />
                <span className="text-[7px] text-green-600">Pronto para instalar</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
