import { lazy, Suspense } from "react";
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
import { VersionCheckWithOverlay } from "@/components/VersionCheckWithOverlay";

// Lazy-loaded ChatAssistente
const ChatAssistente = lazy(() => import("@/components/ChatAssistente").then(m => ({ default: m.ChatAssistente })));

// Public pages
const Index = lazy(() => import("./pages/Index"));
const AppLanding = lazy(() => import("./pages/AppLanding"));
const Auth = lazy(() => import("./pages/Auth"));
const ConfirmarVisita = lazy(() => import("./pages/ConfirmarVisita"));
const VerificarComprovante = lazy(() => import("./pages/VerificarComprovante"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AssinaturaSuspensa = lazy(() => import("./pages/AssinaturaSuspensa"));
const SemPermissao = lazy(() => import("./pages/SemPermissao"));
const ContaDesativada = lazy(() => import("./pages/ContaDesativada"));
const InstalarApp = lazy(() => import("./pages/InstalarApp"));
const Funcionalidades = lazy(() => import("./pages/Funcionalidades"));
const ComoFunciona = lazy(() => import("./pages/ComoFunciona"));
const Tutoriais = lazy(() => import("./pages/Tutoriais"));
const TourAudio = lazy(() => import("./pages/TourAudio"));
const TourAudioLanding = lazy(() => import("./pages/TourAudioLanding"));
const Afiliados = lazy(() => import("./pages/Afiliados"));
const ParaImobiliarias = lazy(() => import("./pages/ParaImobiliarias"));
const SobreNos = lazy(() => import("./pages/SobreNos"));
const NossaHistoria = lazy(() => import("./pages/NossaHistoria"));

// Auth pages
const RegistroImobiliaria = lazy(() => import("./pages/auth/RegistroImobiliaria"));
const RegistroCorretorAutonomo = lazy(() => import("./pages/auth/RegistroCorretorAutonomo"));
const RegistroTipo = lazy(() => import("./pages/auth/RegistroTipo"));
const RegistroVinculado = lazy(() => import("./pages/auth/RegistroVinculado"));
const AceitarConvite = lazy(() => import("./pages/auth/AceitarConvite"));
const CadastroConcluido = lazy(() => import("./pages/auth/CadastroConcluido"));
const SelecionarEquipe = lazy(() => import("./pages/auth/SelecionarEquipe"));
const RecuperarSenha = lazy(() => import("./pages/auth/RecuperarSenha"));
const RedefinirSenha = lazy(() => import("./pages/auth/RedefinirSenha"));
const ConviteParceiro = lazy(() => import("./pages/ConviteParceiro"));
const ConviteParceiroExterno = lazy(() => import("./pages/ConviteParceiroExterno"));
const TermosDeUso = lazy(() => import("./pages/TermosDeUso"));
const AceitarTermos = lazy(() => import("./pages/AceitarTermos"));
const PoliticaPrivacidade = lazy(() => import("./pages/PoliticaPrivacidade"));
const SurveyPublic = lazy(() => import("./pages/SurveyPublic"));
const RegistroConstrutora = lazy(() => import("./pages/auth/RegistroConstrutora"));

// Corretor pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const NovaFicha = lazy(() => import("./pages/NovaFicha"));
const DetalhesFicha = lazy(() => import("./pages/DetalhesFicha"));
const ListaFichas = lazy(() => import("./pages/ListaFichas"));
const ListaClientes = lazy(() => import("./pages/ListaClientes"));
const FormCliente = lazy(() => import("./pages/FormCliente"));
const DetalhesCliente = lazy(() => import("./pages/DetalhesCliente"));
const ListaImoveis = lazy(() => import("./pages/ListaImoveis"));
const FormImovel = lazy(() => import("./pages/FormImovel"));
const DetalhesImovel = lazy(() => import("./pages/DetalhesImovel"));
const Integracoes = lazy(() => import("./pages/Integracoes"));
const TemplatesMensagem = lazy(() => import("./pages/TemplatesMensagem"));
const ConfiguracoesEmail = lazy(() => import("./pages/ConfiguracoesEmail"));
const HistoricoEmails = lazy(() => import("./pages/HistoricoEmails"));
const Perfil = lazy(() => import("./pages/Perfil"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const CorretorAssinatura = lazy(() => import("./pages/CorretorAssinatura"));
const Convites = lazy(() => import("./pages/Convites"));
const FichasParceiro = lazy(() => import("./pages/FichasParceiro"));
const Pesquisas = lazy(() => import("./pages/Pesquisas"));
const MinhaEquipe = lazy(() => import("./pages/equipe/MinhaEquipe"));
const MinhasIndicacoes = lazy(() => import("./pages/MinhasIndicacoes"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminImobiliarias = lazy(() => import("./pages/admin/AdminImobiliarias"));
const AdminNovaImobiliaria = lazy(() => import("./pages/admin/AdminNovaImobiliaria"));
const AdminDetalhesImobiliaria = lazy(() => import("./pages/admin/AdminDetalhesImobiliaria"));
const AdminPlanos = lazy(() => import("./pages/admin/AdminPlanos"));
const AdminUsuarios = lazy(() => import("./pages/admin/AdminUsuarios"));
const AdminUsuariosPendentes = lazy(() => import("./pages/admin/AdminUsuariosPendentes"));
const AdminConfiguracoes = lazy(() => import("./pages/admin/AdminConfiguracoes"));
const AdminDiagnostico = lazy(() => import("./pages/admin/AdminDiagnostico"));
const AdminAssinaturas = lazy(() => import("./pages/admin/AdminAssinaturas"));
const AdminConvites = lazy(() => import("./pages/admin/AdminConvites"));
const AdminCorretoresAutonomos = lazy(() => import("./pages/admin/AdminCorretoresAutonomos"));
const AdminDetalhesCorretorAutonomo = lazy(() => import("./pages/admin/AdminDetalhesCorretorAutonomo"));
const AdminFichas = lazy(() => import("./pages/admin/AdminFichas"));
const AdminRelatoriosFinanceiros = lazy(() => import("./pages/admin/AdminRelatoriosFinanceiros"));
const AdminBackups = lazy(() => import("./pages/admin/AdminBackups"));
const AdminMarketingImages = lazy(() => import("./pages/admin/AdminMarketingImages"));
const AdminDepoimentos = lazy(() => import("./pages/admin/AdminDepoimentos"));
const AdminAfiliados = lazy(() => import("./pages/admin/AdminAfiliados"));
const AdminCupons = lazy(() => import("./pages/admin/AdminCupons"));
const AdminComissoes = lazy(() => import("./pages/admin/AdminComissoes"));
const AdminIndicacoes = lazy(() => import("./pages/admin/AdminIndicacoes"));
const AdminSessoes = lazy(() => import("./pages/admin/AdminSessoes"));
const AdminWhatsApp = lazy(() => import("./pages/admin/AdminWhatsApp"));
const AdminConstrutoras = lazy(() => import("./pages/admin/AdminConstrutoras"));
const AdminDetalhesConstrutora = lazy(() => import("./pages/admin/AdminDetalhesConstrutora"));
const AdminNovaConstrutora = lazy(() => import("./pages/admin/AdminNovaConstrutora"));

// Afiliado pages
const AfiliadoDashboard = lazy(() => import("./pages/afiliado/AfiliadoDashboard"));
const AfiliadoComissoes = lazy(() => import("./pages/afiliado/AfiliadoComissoes"));
const AfiliadoPerfil = lazy(() => import("./pages/afiliado/AfiliadoPerfil"));

// Construtora pages
const ConstrutoraDashboard = lazy(() => import("./pages/construtora/ConstrutoraDashboard"));
const ConstutoraEmpreendimentos = lazy(() => import("./pages/construtora/ConstutoraEmpreendimentos"));
const ConstutoraImobiliarias = lazy(() => import("./pages/construtora/ConstutoraImobiliarias"));
const ConstutoraCorretores = lazy(() => import("./pages/construtora/ConstutoraCorretores"));
const ConstutoraFichas = lazy(() => import("./pages/construtora/ConstutoraFichas"));
const ConstutoraRelatorios = lazy(() => import("./pages/construtora/ConstutoraRelatorios"));
const ConstutoraConfiguracoes = lazy(() => import("./pages/construtora/ConstutoraConfiguracoes"));
const ConstutoraAssinatura = lazy(() => import("./pages/construtora/ConstutoraAssinatura"));
const ConstutoraEquipes = lazy(() => import("./pages/construtora/ConstutoraEquipes"));
const ConstutoraDetalhesCorretor = lazy(() => import("./pages/construtora/ConstutoraDetalhesCorretor"));
const ConstutoraPesquisas = lazy(() => import("./pages/construtora/ConstutoraPesquisas"));

// Empresa (Imobiliaria Admin) pages
const EmpresaDashboard = lazy(() => import("./pages/empresa/EmpresaDashboard"));
const EmpresaCorretores = lazy(() => import("./pages/empresa/EmpresaCorretores"));
const EmpresaDetalhesCorretor = lazy(() => import("./pages/empresa/EmpresaDetalhesCorretor"));
const EmpresaEquipes = lazy(() => import("./pages/empresa/EmpresaEquipes"));
const EmpresaAssinatura = lazy(() => import("./pages/empresa/EmpresaAssinatura"));
const EmpresaRelatorios = lazy(() => import("./pages/empresa/EmpresaRelatorios"));
const EmpresaConfiguracoes = lazy(() => import("./pages/empresa/EmpresaConfiguracoes"));
const EmpresaFichas = lazy(() => import("./pages/empresa/EmpresaFichas"));
const EmpresaPesquisas = lazy(() => import("./pages/empresa/EmpresaPesquisas"));
const EmpresaParceriasConstrutoras = lazy(() => import("./pages/empresa/EmpresaParceriasConstrutoras"));

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
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
              {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/redirect" element={<SmartRedirect />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/registro" element={<RegistroImobiliaria />} />
                <Route path="/registro/tipo" element={<RegistroTipo />} />
                <Route path="/registro-tipo" element={<RegistroTipo />} />
                <Route path="/registro-autonomo" element={<RegistroCorretorAutonomo />} />
                <Route path="/registro-construtora" element={<RegistroConstrutora />} />
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
                <Route path="/nossa-historia" element={<NossaHistoria />} />
{/* Tour routes */}
                <Route path="/tour" element={<TourAudioLanding />} />
                <Route path="/tour-audio" element={<TourAudio />} />
                
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
                <Route path="/admin/construtoras" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdminConstrutoras />
                  </ProtectedRoute>
                } />
                <Route path="/admin/construtoras/nova" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdminNovaConstrutora />
                  </ProtectedRoute>
                } />
                <Route path="/admin/construtoras/:id" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdminDetalhesConstrutora />
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
                <Route path="/empresa/parcerias-construtoras" element={
                  <ProtectedRoute allowedRoles={['imobiliaria_admin']}>
                    <EmpresaParceriasConstrutoras />
                  </ProtectedRoute>
                } />

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
                <Route path="/construtora/pesquisas" element={
                  <ProtectedRoute allowedRoles={['construtora_admin']}>
                    <ConstutoraPesquisas />
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
                <Route path="/construtora/equipes" element={
                  <ProtectedRoute allowedRoles={['construtora_admin']}>
                    <ConstutoraEquipes />
                  </ProtectedRoute>
                } />
                <Route path="/construtora/corretores/:userId" element={
                  <ProtectedRoute allowedRoles={['construtora_admin']}>
                    <ConstutoraDetalhesCorretor />
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
                  <ProtectedRoute allowedRoles={['corretor', 'imobiliaria_admin', 'super_admin', 'construtora_admin']}>
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
                  <ProtectedRoute allowedRoles={['corretor', 'imobiliaria_admin', 'super_admin', 'construtora_admin']}>
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
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </UserRoleProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
