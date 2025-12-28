import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { UserRoleProvider } from "@/hooks/useUserRole";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt";

// Public pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ConfirmarVisita from "./pages/ConfirmarVisita";
import VerificarComprovante from "./pages/VerificarComprovante";
import NotFound from "./pages/NotFound";
import AssinaturaSuspensa from "./pages/AssinaturaSuspensa";
import SemPermissao from "./pages/SemPermissao";
import InstalarApp from "./pages/InstalarApp";

// Auth pages
import RegistroImobiliaria from "./pages/auth/RegistroImobiliaria";
import AceitarConvite from "./pages/auth/AceitarConvite";
import CadastroConcluido from "./pages/auth/CadastroConcluido";

// Corretor pages
import Dashboard from "./pages/Dashboard";
import NovaFicha from "./pages/NovaFicha";
import DetalhesFicha from "./pages/DetalhesFicha";
import ListaFichas from "./pages/ListaFichas";
import ListaClientes from "./pages/ListaClientes";
import FormCliente from "./pages/FormCliente";
import DetalhesCliente from "./pages/DetalhesCliente";
import ListaImoveis from "./pages/ListaImoveis";
import FormImovel from "./pages/FormImovel";
import DetalhesImovel from "./pages/DetalhesImovel";
import Integracoes from "./pages/Integracoes";
import TemplatesMensagem from "./pages/TemplatesMensagem";
import Perfil from "./pages/Perfil";
import Relatorios from "./pages/Relatorios";
import CorretorAssinatura from "./pages/CorretorAssinatura";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminImobiliarias from "./pages/admin/AdminImobiliarias";
import AdminNovaImobiliaria from "./pages/admin/AdminNovaImobiliaria";
import AdminDetalhesImobiliaria from "./pages/admin/AdminDetalhesImobiliaria";
import AdminPlanos from "./pages/admin/AdminPlanos";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import AdminUsuariosPendentes from "./pages/admin/AdminUsuariosPendentes";
import AdminConfiguracoes from "./pages/admin/AdminConfiguracoes";
import AdminDiagnostico from "./pages/admin/AdminDiagnostico";
import AdminAssinaturas from "./pages/admin/AdminAssinaturas";
import AdminConvites from "./pages/admin/AdminConvites";
import AdminCorretoresAutonomos from "./pages/admin/AdminCorretoresAutonomos";
import AdminDetalhesCorretorAutonomo from "./pages/admin/AdminDetalhesCorretorAutonomo";

// Empresa (Imobiliaria Admin) pages
import EmpresaDashboard from "./pages/empresa/EmpresaDashboard";
import EmpresaCorretores from "./pages/empresa/EmpresaCorretores";
import EmpresaAssinatura from "./pages/empresa/EmpresaAssinatura";
import EmpresaRelatorios from "./pages/empresa/EmpresaRelatorios";
import EmpresaConfiguracoes from "./pages/empresa/EmpresaConfiguracoes";
import EmpresaFichas from "./pages/empresa/EmpresaFichas";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <UserRoleProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <PWAUpdatePrompt />
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/inicial" element={<Index />} />
                <Route path="/" element={<Navigate to="/inicial" replace />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/registro" element={<RegistroImobiliaria />} />
                <Route path="/convite/:token" element={<AceitarConvite />} />
                <Route path="/cadastro-concluido" element={<CadastroConcluido />} />
                <Route path="/confirmar/:token" element={<ConfirmarVisita />} />
                <Route path="/verificar/:protocolo" element={<VerificarComprovante />} />
                <Route path="/assinatura-suspensa" element={<AssinaturaSuspensa />} />
                <Route path="/sem-permissao" element={<SemPermissao />} />
                <Route path="/instalar" element={<InstalarApp />} />

                {/* Super Admin routes */}
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/imobiliarias" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdminImobiliarias />
                  </ProtectedRoute>
                } />
                <Route path="/admin/imobiliarias/nova" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdminNovaImobiliaria />
                  </ProtectedRoute>
                } />
                <Route path="/admin/imobiliarias/:id" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdminDetalhesImobiliaria />
                  </ProtectedRoute>
                } />
                <Route path="/admin/planos" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdminPlanos />
                  </ProtectedRoute>
                } />
                <Route path="/admin/usuarios" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdminUsuarios />
                  </ProtectedRoute>
                } />
                <Route path="/admin/usuarios-pendentes" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdminUsuariosPendentes />
                  </ProtectedRoute>
                } />
                <Route path="/admin/configuracoes" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdminConfiguracoes />
                  </ProtectedRoute>
                } />
                <Route path="/admin/diagnostico" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdminDiagnostico />
                  </ProtectedRoute>
                } />
                <Route path="/admin/assinaturas" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdminAssinaturas />
                  </ProtectedRoute>
                } />
                <Route path="/admin/convites" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdminConvites />
                  </ProtectedRoute>
                } />
                <Route path="/admin/autonomos" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdminCorretoresAutonomos />
                  </ProtectedRoute>
                } />
                <Route path="/admin/autonomos/:userId" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdminDetalhesCorretorAutonomo />
                  </ProtectedRoute>
                } />

                {/* Imobiliaria Admin routes */}
                <Route path="/empresa" element={
                  <ProtectedRoute allowedRoles={['imobiliaria_admin']}>
                    <EmpresaDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/empresa/corretores" element={
                  <ProtectedRoute allowedRoles={['imobiliaria_admin']}>
                    <EmpresaCorretores />
                  </ProtectedRoute>
                } />
                <Route path="/empresa/fichas" element={
                  <ProtectedRoute allowedRoles={['imobiliaria_admin']}>
                    <EmpresaFichas />
                  </ProtectedRoute>
                } />
                <Route path="/empresa/relatorios" element={
                  <ProtectedRoute allowedRoles={['imobiliaria_admin']}>
                    <EmpresaRelatorios />
                  </ProtectedRoute>
                } />
                <Route path="/empresa/assinatura" element={
                  <ProtectedRoute allowedRoles={['imobiliaria_admin']}>
                    <EmpresaAssinatura />
                  </ProtectedRoute>
                } />
                <Route path="/empresa/configuracoes" element={
                  <ProtectedRoute allowedRoles={['imobiliaria_admin']}>
                    <EmpresaConfiguracoes />
                  </ProtectedRoute>
                } />

                {/* Corretor routes (also accessible by imobiliaria_admin) */}
                <Route path="/dashboard" element={
                  <ProtectedRoute allowedRoles={['corretor', 'imobiliaria_admin']} requireSubscription>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/fichas" element={
                  <ProtectedRoute allowedRoles={['corretor', 'imobiliaria_admin']} requireSubscription>
                    <ListaFichas />
                  </ProtectedRoute>
                } />
                <Route path="/fichas/nova" element={
                  <ProtectedRoute allowedRoles={['corretor', 'imobiliaria_admin']} requireSubscription>
                    <NovaFicha />
                  </ProtectedRoute>
                } />
                <Route path="/fichas/:id" element={
                  <ProtectedRoute allowedRoles={['corretor', 'imobiliaria_admin']} requireSubscription>
                    <DetalhesFicha />
                  </ProtectedRoute>
                } />
                <Route path="/clientes" element={
                  <ProtectedRoute allowedRoles={['corretor', 'imobiliaria_admin']} requireSubscription>
                    <ListaClientes />
                  </ProtectedRoute>
                } />
                <Route path="/clientes/novo" element={
                  <ProtectedRoute allowedRoles={['corretor', 'imobiliaria_admin']} requireSubscription>
                    <FormCliente />
                  </ProtectedRoute>
                } />
                <Route path="/clientes/:id" element={
                  <ProtectedRoute allowedRoles={['corretor', 'imobiliaria_admin']} requireSubscription>
                    <DetalhesCliente />
                  </ProtectedRoute>
                } />
                <Route path="/clientes/:id/editar" element={
                  <ProtectedRoute allowedRoles={['corretor', 'imobiliaria_admin']} requireSubscription>
                    <FormCliente />
                  </ProtectedRoute>
                } />
                <Route path="/imoveis" element={
                  <ProtectedRoute allowedRoles={['corretor', 'imobiliaria_admin']} requireSubscription>
                    <ListaImoveis />
                  </ProtectedRoute>
                } />
                <Route path="/imoveis/novo" element={
                  <ProtectedRoute allowedRoles={['corretor', 'imobiliaria_admin']} requireSubscription>
                    <FormImovel />
                  </ProtectedRoute>
                } />
                <Route path="/imoveis/:id" element={
                  <ProtectedRoute allowedRoles={['corretor', 'imobiliaria_admin']} requireSubscription>
                    <DetalhesImovel />
                  </ProtectedRoute>
                } />
                <Route path="/imoveis/:id/editar" element={
                  <ProtectedRoute allowedRoles={['corretor', 'imobiliaria_admin']} requireSubscription>
                    <FormImovel />
                  </ProtectedRoute>
                } />
                <Route path="/integracoes" element={
                  <ProtectedRoute allowedRoles={['imobiliaria_admin']} requireSubscription>
                    <Integracoes />
                  </ProtectedRoute>
                } />
                <Route path="/integracoes/templates" element={
                  <ProtectedRoute allowedRoles={['imobiliaria_admin']} requireSubscription>
                    <TemplatesMensagem />
                  </ProtectedRoute>
                } />
                <Route path="/relatorios" element={
                  <ProtectedRoute allowedRoles={['corretor', 'imobiliaria_admin']} requireSubscription>
                    <Relatorios />
                  </ProtectedRoute>
                } />
                <Route path="/perfil" element={
                  <ProtectedRoute allowedRoles={['corretor', 'imobiliaria_admin', 'super_admin']}>
                    <Perfil />
                  </ProtectedRoute>
                } />
                <Route path="/minha-assinatura" element={
                  <ProtectedRoute allowedRoles={['corretor']}>
                    <CorretorAssinatura />
                  </ProtectedRoute>
                } />

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </UserRoleProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
