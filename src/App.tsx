import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NovaFicha from "./pages/NovaFicha";
import DetalhesFicha from "./pages/DetalhesFicha";
import ListaFichas from "./pages/ListaFichas";
import ConfirmarVisita from "./pages/ConfirmarVisita";
import ListaClientes from "./pages/ListaClientes";
import FormCliente from "./pages/FormCliente";
import DetalhesCliente from "./pages/DetalhesCliente";
import ListaImoveis from "./pages/ListaImoveis";
import FormImovel from "./pages/FormImovel";
import Integracoes from "./pages/Integracoes";
import TemplatesMensagem from "./pages/TemplatesMensagem";
import VerificarComprovante from "./pages/VerificarComprovante";
import Perfil from "./pages/Perfil";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/fichas" element={<ListaFichas />} />
              <Route path="/fichas/nova" element={<NovaFicha />} />
              <Route path="/fichas/:id" element={<DetalhesFicha />} />
              <Route path="/confirmar/:token" element={<ConfirmarVisita />} />
              <Route path="/verificar/:protocolo" element={<VerificarComprovante />} />
              <Route path="/clientes" element={<ListaClientes />} />
              <Route path="/clientes/novo" element={<FormCliente />} />
              <Route path="/clientes/:id" element={<DetalhesCliente />} />
              <Route path="/clientes/:id/editar" element={<FormCliente />} />
              <Route path="/imoveis" element={<ListaImoveis />} />
              <Route path="/imoveis/novo" element={<FormImovel />} />
              <Route path="/imoveis/:id" element={<FormImovel />} />
              <Route path="/imoveis/:id/editar" element={<FormImovel />} />
              <Route path="/integracoes" element={<Integracoes />} />
              <Route path="/integracoes/templates" element={<TemplatesMensagem />} />
              <Route path="/perfil" element={<Perfil />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
