import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { UserRoleProvider } from "@/hooks/useUserRole";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SmartRedirect } from "@/components/SmartRedirect";
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt";
import { PWAInstallModal } from "@/components/PWAInstallModal";
import { ChatAssistente } from "@/components/ChatAssistente";
import { VersionCheckWithOverlay } from "@/components/VersionCheckWithOverlay";

// Public pages
import Index from "./pages/Index";
import AppLanding from "./pages/AppLanding";
import Auth from "./pages/Auth";
import ConfirmarVisita from "./pages/ConfirmarVisita";
import VerificarComprovante from "./pages/VerificarComprovante";
import NotFound from "./pages/NotFound";
import AssinaturaSuspensa from "./pages/AssinaturaSuspensa";
import SemPermissao from "./pages/SemPermissao";
import ContaDesativada from "./pages/ContaDesativada";
import InstalarApp from "./pages/InstalarApp";
import Funcionalidades from "./pages/Funcionalidades";
import ComoFunciona from "./pages/ComoFunciona";
import Tutoriais from "./pages/Tutoriais";
// Tour pages
import TourAudio from "./pages/TourAudio";
import TourAudioLanding from "./pages/TourAudioLanding";
import Afiliados from "./pages/Afiliados";
import ParaImobiliarias from "./pages/ParaImobiliarias";
import SobreNos from "./pages/SobreNos";
// import DemoAnimado from "./pages/DemoAnimado";

// Auth pages
import RegistroImobiliaria from "./pages/auth/RegistroImobiliaria";
import RegistroCorretorAutonomo from "./pages/auth/RegistroCorretorAutonomo";
import RegistroTipo from "./pages/auth/RegistroTipo";
import RegistroVinculado from "./pages/auth/RegistroVinculado";
import AceitarConvite from "./pages/auth/AceitarConvite";
import CadastroConcluido from "./pages/auth/CadastroConcluido";
import SelecionarEquipe from "./pages/auth/SelecionarEquipe";
import RecuperarSenha from "./pages/auth/RecuperarSenha";
import RedefinirSenha from "./pages/auth/RedefinirSenha";
import ConviteParceiro from "./pages/ConviteParceiro";
import ConviteParceiroExterno from "./pages/ConviteParceiroExterno";
import TermosDeUso from "./pages/TermosDeUso";
import AceitarTermos from "./pages/AceitarTermos";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import SurveyPublic from "./pages/SurveyPublic";

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
import ConfiguracoesEmail from "./pages/ConfiguracoesEmail";
import HistoricoEmails from "./pages/HistoricoEmails";
import Perfil from "./pages/Perfil";
import Relatorios from "./pages/Relatorios";
import CorretorAssinatura from "./pages/CorretorAssinatura";
import Convites from "./pages/Convites";
import FichasParceiro from "./pages/FichasParceiro";
import Pesquisas from "./pages/Pesquisas";
import MinhaEquipe from "./pages/equipe/MinhaEquipe";
import MinhasIndicacoes from "./pages/MinhasIndicacoes";

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
import AdminFichas from "./pages/admin/AdminFichas";
import AdminRelatoriosFinanceiros from "./pages/admin/AdminRelatoriosFinanceiros";
import AdminBackups from "./pages/admin/AdminBackups";
import AdminMarketingImages from "./pages/admin/AdminMarketingImages";
import AdminDepoimentos from "./pages/admin/AdminDepoimentos";
import AdminAfiliados from "./pages/admin/AdminAfiliados";
import AdminCupons from "./pages/admin/AdminCupons";
import AdminComissoes from "./pages/admin/AdminComissoes";
import AdminIndicacoes from "./pages/admin/AdminIndicacoes";
import AdminSessoes from "./pages/admin/AdminSessoes";
import AdminWhatsApp from "./pages/admin/AdminWhatsApp";
import AdminConstrutoras from "./pages/admin/AdminConstrutoras";
import AdminDetalhesConstrutora from "./pages/admin/AdminDetalhesConstrutora";
// Afiliado pages
import AfiliadoDashboard from "./pages/afiliado/AfiliadoDashboard";
import AfiliadoComissoes from "./pages/afiliado/AfiliadoComissoes";
import AfiliadoPerfil from "./pages/afiliado/AfiliadoPerfil";

// Construtora pages
import ConstrutoraDashboard from "./pages/construtora/ConstrutoraDashboard";
import ConstutoraEmpreendimentos from "./pages/construtora/ConstutoraEmpreendimentos";
import ConstutoraImobiliarias from "./pages/construtora/ConstutoraImobiliarias";
import ConstutoraCorretores from "./pages/construtora/ConstutoraCorretores";
import ConstutoraFichas from "./pages/construtora/ConstutoraFichas";
import ConstutoraRelatorios from "./pages/construtora/ConstutoraRelatorios";
import ConstutoraConfiguracoes from "./pages/construtora/ConstutoraConfiguracoes";
import ConstutoraAssinatura from "./pages/construtora/ConstutoraAssinatura";

// Empresa (Imobiliaria Admin) pages
import EmpresaDashboard from "./pages/empresa/EmpresaDashboard";
import EmpresaCorretores from "./pages/empresa/EmpresaCorretores";
import EmpresaDetalhesCorretor from "./pages/empresa/EmpresaDetalhesCorretor";
import EmpresaEquipes from "./pages/empresa/EmpresaEquipes";
import EmpresaAssinatura from "./pages/empresa/EmpresaAssinatura";
import EmpresaRelatorios from "./pages/empresa/EmpresaRelatorios";
import EmpresaConfiguracoes from "./pages/empresa/EmpresaConfiguracoes";
import EmpresaFichas from "./pages/empresa/EmpresaFichas";
import EmpresaPesquisas from "./pages/empresa/EmpresaPesquisas";

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
              <ChatAssistente />
              <Routes>
              {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/redirect" element={<SmartRedirect />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/registro" element={<RegistroImobiliaria />} />
                <Route path="/registro/tipo" element={<RegistroTipo />} />
                <Route path="/registro-tipo" element={<RegistroTipo />} />
                <Route path="/registro-autonomo" element={<RegistroCorretorAutonomo />} />
                <Route path="/registro-construtora" element={<Navigate to="/registro-tipo" replace />} />
                <Route path="/registro-vinculado" element={<RegistroVinculado />} />
                <Route path="/convite/:token" element={<AceitarConvite />} />
                <Route path="/cadastro-concluido" element={<CadastroConcluido />} />
                <Route path="/selecionar-equipe" element={<SelecionarEquipe />} />
                <Route path="/confirmar/:token" element={<ConfirmarVisita />} />
                <Route path="/verificar/:protocolo" element={<VerificarComprovante />} />
                <Route path="/assinatura-suspensa" element={<AssinaturaSuspensa />} />
                <Route path="/sem-permissao" element={<SemPermissao />} />
                <Route path="/conta-desativada" element={<ContaDesativada />} />
                <Route path="/instalar" element={<InstalarApp />} />
                <Route path="/funcionalidades" element={<Funcionalidades />} />
                <Route path="/como-funciona" element={<ComoFunciona />} />
                <Route path="/tutoriais" element={<Tutoriais />} />
                <Route path="/app" element={<AppLanding />} />
                <Route path="/afiliados" element={<Afiliados />} />
                <Route path="/para-imobiliarias" element={<ParaImobiliarias />} />
                <Route path="/sobre" element={<SobreNos />} />
{/* Tour routes */}
                <Route path="/tour" element={<TourAudioLanding />} />
                <Route path="/tour-audio" element={<TourAudio />} />
                {/* <Route path="/demo" element={<DemoAnimado />} /> */}
                <Route path="/convite-parceiro/:token" element={<ConviteParceiro />} />
                <Route path="/convite-externo/:token" element={<ConviteParceiroExterno />} />
                <Route path="/termos-de-uso" element={<TermosDeUso />} />
                <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
                <Route path="/auth/recuperar-senha" element={<RecuperarSenha />} />
                <Route path="/auth/redefinir-senha" element={<RedefinirSenha />} />
                <Route path="/survey/:token" element={<SurveyPublic />} />
                
                {/* Protected route for terms acceptance */}
                <Route path="/aceitar-termos" element={
                  <ProtectedRoute skipTermsCheck>
                    <AceitarTermos />
                  </ProtectedRoute>
                } />

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
                <Route path="/admin/financeiro" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdminRelatoriosFinanceiros />
                  </ProtectedRoute>
                } />
                <Route path="/admin/fichas" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdminFichas />
                  </ProtectedRoute>
                } />
                <Route path="/admin/backups" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdminBackups />
                  </ProtectedRoute>
                } />
                <Route path="/admin/marketing" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdminMarketingImages />
                  </ProtectedRoute>
                } />
                <Route path="/admin/depoimentos" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdminDepoimentos />
                  </ProtectedRoute>
                } />
                <Route path="/admin/afiliados" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdminAfiliados />
                  </ProtectedRoute>
                } />
                <Route path="/admin/cupons" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdminCupons />
                  </ProtectedRoute>
                } />
                <Route path="/admin/comissoes" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdminComissoes />
                  </ProtectedRoute>
                } />
                <Route path="/admin/indicacoes" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdminIndicacoes />
                  </ProtectedRoute>
                } />
                <Route path="/admin/sessoes" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdminSessoes />
                  </ProtectedRoute>
                } />
                <Route path="/admin/whatsapp" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdminWhatsApp />
                  </ProtectedRoute>
                } />
                <Route path="/admin/email" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <ConfiguracoesEmail />
                  </ProtectedRoute>
                } />
                <Route path="/admin/email/historico" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <HistoricoEmails />
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
                <Route path="/empresa/corretores/:userId" element={
                  <ProtectedRoute allowedRoles={['imobiliaria_admin']}>
                    <EmpresaDetalhesCorretor />
                  </ProtectedRoute>
                } />
                <Route path="/empresa/equipes" element={
                  <ProtectedRoute allowedRoles={['imobiliaria_admin']}>
                    <EmpresaEquipes />
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
                <Route path="/empresa/pesquisas" element={
                  <ProtectedRoute allowedRoles={['imobiliaria_admin']}>
                    <EmpresaPesquisas />
                  </ProtectedRoute>
                } />

                {/* Construtora routes */}
                <Route path="/construtora" element={
                  <ProtectedRoute allowedRoles={['construtora_admin']}>
                    <ConstrutoraDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/construtora/empreendimentos" element={
                  <ProtectedRoute allowedRoles={['construtora_admin']}>
                    <ConstutoraEmpreendimentos />
                  </ProtectedRoute>
                } />
                <Route path="/construtora/imobiliarias" element={
                  <ProtectedRoute allowedRoles={['construtora_admin']}>
                    <ConstutoraImobiliarias />
                  </ProtectedRoute>
                } />
                <Route path="/construtora/corretores" element={
                  <ProtectedRoute allowedRoles={['construtora_admin']}>
                    <ConstutoraCorretores />
                  </ProtectedRoute>
                } />
                <Route path="/construtora/fichas" element={
                  <ProtectedRoute allowedRoles={['construtora_admin']}>
                    <ConstutoraFichas />
                  </ProtectedRoute>
                } />
                <Route path="/construtora/relatorios" element={
                  <ProtectedRoute allowedRoles={['construtora_admin']}>
                    <ConstutoraRelatorios />
                  </ProtectedRoute>
                } />
                <Route path="/construtora/configuracoes" element={
                  <ProtectedRoute allowedRoles={['construtora_admin']}>
                    <ConstutoraConfiguracoes />
                  </ProtectedRoute>
                } />
                <Route path="/construtora/assinatura" element={
                  <ProtectedRoute allowedRoles={['construtora_admin']}>
                    <ConstutoraAssinatura />
                  </ProtectedRoute>
                } />
                <Route path="/pesquisas" element={
                  <ProtectedRoute allowedRoles={['corretor', 'imobiliaria_admin']} requireSubscription>
                    <Pesquisas />
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
                  <ProtectedRoute allowedRoles={['corretor', 'imobiliaria_admin', 'super_admin']}>
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
                <Route path="/convites" element={
                  <ProtectedRoute allowedRoles={['corretor', 'imobiliaria_admin']} requireSubscription>
                    <Convites />
                  </ProtectedRoute>
                } />
                <Route path="/convites-recebidos" element={<Navigate to="/convites?tab=recebidos" replace />} />
                <Route path="/convites-enviados" element={<Navigate to="/convites?tab=enviados" replace />} />
                <Route path="/fichas-parceiro" element={
                  <ProtectedRoute allowedRoles={['corretor', 'imobiliaria_admin']} requireSubscription>
                    <FichasParceiro />
                  </ProtectedRoute>
                } />
                <Route path="/minha-equipe" element={
                  <ProtectedRoute allowedRoles={['corretor', 'imobiliaria_admin']} requireSubscription>
                    <MinhaEquipe />
                  </ProtectedRoute>
                } />
                <Route path="/minhas-indicacoes" element={
                  <ProtectedRoute allowedRoles={['corretor', 'imobiliaria_admin']} requireSubscription>
                    <MinhasIndicacoes />
                  </ProtectedRoute>
                } />

                {/* Afiliado routes */}
                <Route path="/afiliado" element={
                  <ProtectedRoute allowedRoles={['afiliado']}>
                    <AfiliadoDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/afiliado/comissoes" element={
                  <ProtectedRoute allowedRoles={['afiliado']}>
                    <AfiliadoComissoes />
                  </ProtectedRoute>
                } />
                <Route path="/afiliado/perfil" element={
                  <ProtectedRoute allowedRoles={['afiliado']}>
                    <AfiliadoPerfil />
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
