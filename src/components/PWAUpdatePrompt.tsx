import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { registerSW } from "virtual:pwa-register";

/**
 * Mostra um toast quando houver uma nova versão do app disponível (PWA/service worker).
 * Isso evita ficar preso vendo uma versão antiga (cache) no app instalado e no desktop.
 */
export function PWAUpdatePrompt() {
  const shownRef = useRef(false);

  useEffect(() => {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        if (shownRef.current) return;
        shownRef.current = true;

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
