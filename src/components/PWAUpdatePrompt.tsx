import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { registerSW } from "virtual:pwa-register";

/**
 * Mostra um toast quando houver uma nova versão do app disponível (PWA/service worker).
 * Isso evita ficar preso vendo uma versão antiga (cache) no app instalado e no desktop.
 * 
 * Para apps instalados (standalone), aplica automaticamente após 5 segundos.
 */
export function PWAUpdatePrompt() {
  const shownRef = useRef(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (navigator as unknown as { standalone?: boolean }).standalone === true;

    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        if (shownRef.current) return;
        shownRef.current = true;

        // Para apps instalados, aplica automaticamente após 5s
        if (isStandalone) {
          toast("Atualizando...", {
            description: "Uma nova versão está sendo aplicada.",
            duration: 5000,
          });
          setTimeout(() => {
            updateSW(true);
          }, 5000);
          return;
        }

        // Para navegador normal, mostra toast com botão
        toast("Atualização disponível", {
          description: "Recarregue para ver a versão mais recente.",
          duration: Infinity,
          action: {
            label: "Atualizar",
            onClick: () => updateSW(true),
          },
        });
      },
    });
  }, []);

  return null;
}
