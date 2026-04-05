import { lazy, Suspense } from "react";
import { Route, Outlet } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageLoader } from "@/components/PageLoader";
import { SuperAdminLayout } from "@/components/layouts/SuperAdminLayout";

const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminImobiliarias = lazy(() => import("@/pages/admin/AdminImobiliarias"));
const AdminNovaImobiliaria = lazy(() => import("@/pages/admin/AdminNovaImobiliaria"));
const AdminDetalhesImobiliaria = lazy(() => import("@/pages/admin/AdminDetalhesImobiliaria"));
const AdminPlanos = lazy(() => import("@/pages/admin/AdminPlanos"));
const AdminUsuarios = lazy(() => import("@/pages/admin/AdminUsuarios"));
const AdminUsuariosPendentes = lazy(() => import("@/pages/admin/AdminUsuariosPendentes"));
const AdminConfiguracoes = lazy(() => import("@/pages/admin/AdminConfiguracoes"));
const AdminDiagnostico = lazy(() => import("@/pages/admin/AdminDiagnostico"));
const AdminAssinaturas = lazy(() => import("@/pages/admin/AdminAssinaturas"));
const AdminConvites = lazy(() => import("@/pages/admin/AdminConvites"));
const AdminCorretoresAutonomos = lazy(() => import("@/pages/admin/AdminCorretoresAutonomos"));
const AdminDetalhesCorretorAutonomo = lazy(() => import("@/pages/admin/AdminDetalhesCorretorAutonomo"));
const AdminFichas = lazy(() => import("@/pages/admin/AdminFichas"));
const AdminRelatoriosFinanceiros = lazy(() => import("@/pages/admin/AdminRelatoriosFinanceiros"));
const AdminBackups = lazy(() => import("@/pages/admin/AdminBackups"));
const AdminMarketingImages = lazy(() => import("@/pages/admin/AdminMarketingImages"));
const AdminDepoimentos = lazy(() => import("@/pages/admin/AdminDepoimentos"));
const AdminAfiliados = lazy(() => import("@/pages/admin/AdminAfiliados"));
const AdminCupons = lazy(() => import("@/pages/admin/AdminCupons"));
const AdminComissoes = lazy(() => import("@/pages/admin/AdminComissoes"));
const AdminIndicacoes = lazy(() => import("@/pages/admin/AdminIndicacoes"));
const AdminSessoes = lazy(() => import("@/pages/admin/AdminSessoes"));
const AdminWhatsApp = lazy(() => import("@/pages/admin/AdminWhatsApp"));
const AdminConstrutoras = lazy(() => import("@/pages/admin/AdminConstrutoras"));
const AdminDetalhesConstrutora = lazy(() => import("@/pages/admin/AdminDetalhesConstrutora"));
const AdminNovaConstrutora = lazy(() => import("@/pages/admin/AdminNovaConstrutora"));
const ConfiguracoesEmail = lazy(() => import("@/pages/ConfiguracoesEmail"));
const HistoricoEmails = lazy(() => import("@/pages/HistoricoEmails"));

const AdminLayoutRoute = () => (
  <ProtectedRoute allowedRoles={['super_admin']}>
    <SuperAdminLayout>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </SuperAdminLayout>
  </ProtectedRoute>
);

export const adminRoutes = (
  <Route path="/admin" element={<AdminLayoutRoute />}>
    <Route index element={<AdminDashboard />} />
    <Route path="imobiliarias" element={<AdminImobiliarias />} />
    <Route path="imobiliarias/nova" element={<AdminNovaImobiliaria />} />
    <Route path="imobiliarias/:id" element={<AdminDetalhesImobiliaria />} />
    <Route path="planos" element={<AdminPlanos />} />
    <Route path="usuarios" element={<AdminUsuarios />} />
    <Route path="usuarios-pendentes" element={<AdminUsuariosPendentes />} />
    <Route path="configuracoes" element={<AdminConfiguracoes />} />
    <Route path="diagnostico" element={<AdminDiagnostico />} />
    <Route path="assinaturas" element={<AdminAssinaturas />} />
    <Route path="convites" element={<AdminConvites />} />
    <Route path="autonomos" element={<AdminCorretoresAutonomos />} />
    <Route path="autonomos/:userId" element={<AdminDetalhesCorretorAutonomo />} />
    <Route path="construtoras" element={<AdminConstrutoras />} />
    <Route path="construtoras/nova" element={<AdminNovaConstrutora />} />
    <Route path="construtoras/:id" element={<AdminDetalhesConstrutora />} />
    <Route path="financeiro" element={<AdminRelatoriosFinanceiros />} />
    <Route path="fichas" element={<AdminFichas />} />
    <Route path="backups" element={<AdminBackups />} />
    <Route path="marketing" element={<AdminMarketingImages />} />
    <Route path="depoimentos" element={<AdminDepoimentos />} />
    <Route path="afiliados" element={<AdminAfiliados />} />
    <Route path="cupons" element={<AdminCupons />} />
    <Route path="comissoes" element={<AdminComissoes />} />
    <Route path="indicacoes" element={<AdminIndicacoes />} />
    <Route path="sessoes" element={<AdminSessoes />} />
    <Route path="whatsapp" element={<AdminWhatsApp />} />
    <Route path="email" element={<ConfiguracoesEmail />} />
    <Route path="email/historico" element={<HistoricoEmails />} />
  </Route>
);
