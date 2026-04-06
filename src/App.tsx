import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { UserRoleProvider } from "@/hooks/useUserRole";
import { PWAInstallModal } from "@/components/PWAInstallModal";
import { VersionCheckWithOverlay } from "@/components/VersionCheckWithOverlay";

import { publicRoutes } from "@/routes/publicRoutes";
import { adminRoutes } from "@/routes/adminRoutes";
import { empresaRoutes } from "@/routes/empresaRoutes";
import { construtoraRoutes } from "@/routes/construtoraRoutes";
import { corretorRoutes } from "@/routes/corretorRoutes";
import { afiliadoRoutes } from "@/routes/afiliadoRoutes";

const ChatAssistente = lazy(() => import("@/components/ChatAssistente").then(m => ({ default: m.ChatAssistente })));

const LoadingSpinner = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <UserRoleProvider>
          <TooltipProvider>
            <BrowserRouter>
              <Toaster />
              <Sonner />
              <PWAUpdatePrompt />
              <VersionCheckWithOverlay />
              <PWAInstallModal />
              <Suspense fallback={null}>
                <ChatAssistente />
              </Suspense>
              <Suspense fallback={null}>
                <Routes>
                  {adminRoutes}
                  {empresaRoutes}
                  {construtoraRoutes}
                  {corretorRoutes}
                  {afiliadoRoutes}
                  {publicRoutes}
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </UserRoleProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
