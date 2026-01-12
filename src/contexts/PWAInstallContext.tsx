import { createContext, useContext, useState, ReactNode } from 'react';

interface PWAInstallContextType {
  showInstallPrompt: () => void;
  hideInstallPrompt: () => void;
  isPromptVisible: boolean;
}

const PWAInstallContext = createContext<PWAInstallContextType | undefined>(undefined);

export function PWAInstallProvider({ children }: { children: ReactNode }) {
  const [isPromptVisible, setIsPromptVisible] = useState(false);

  const showInstallPrompt = () => setIsPromptVisible(true);
  const hideInstallPrompt = () => setIsPromptVisible(false);

  return (
    <PWAInstallContext.Provider value={{ showInstallPrompt, hideInstallPrompt, isPromptVisible }}>
      {children}
    </PWAInstallContext.Provider>
  );
}

export function usePWAInstallContext() {
  const context = useContext(PWAInstallContext);
  if (context === undefined) {
    throw new Error('usePWAInstallContext must be used within a PWAInstallProvider');
  }
  return context;
}
