import { lazy } from "react";
import { Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";

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

const R = ['super_admin'] as const;
const P = (C: React.ComponentType) => (
  <ProtectedRoute allowedRoles={[...R]}><C /></ProtectedRoute>
);

export const adminRoutes = (
  <>
    <Route path="/admin" element={P(AdminDashboard)} />
    <Route path="/admin/imobiliarias" element={P(AdminImobiliarias)} />
    <Route path="/admin/imobiliarias/nova" element={P(AdminNovaImobiliaria)} />
    <Route path="/admin/imobiliarias/:id" element={P(AdminDetalhesImobiliaria)} />
    <Route path="/admin/planos" element={P(AdminPlanos)} />
    <Route path="/admin/usuarios" element={P(AdminUsuarios)} />
    <Route path="/admin/usuarios-pendentes" element={P(AdminUsuariosPendentes)} />
    <Route path="/admin/configuracoes" element={P(AdminConfiguracoes)} />
    <Route path="/admin/diagnostico" element={P(AdminDiagnostico)} />
    <Route path="/admin/assinaturas" element={P(AdminAssinaturas)} />
    <Route path="/admin/convites" element={P(AdminConvites)} />
    <Route path="/admin/autonomos" element={P(AdminCorretoresAutonomos)} />
    <Route path="/admin/autonomos/:userId" element={P(AdminDetalhesCorretorAutonomo)} />
    <Route path="/admin/construtoras" element={P(AdminConstrutoras)} />
    <Route path="/admin/construtoras/nova" element={P(AdminNovaConstrutora)} />
    <Route path="/admin/construtoras/:id" element={P(AdminDetalhesConstrutora)} />
    <Route path="/admin/financeiro" element={P(AdminRelatoriosFinanceiros)} />
    <Route path="/admin/fichas" element={P(AdminFichas)} />
    <Route path="/admin/backups" element={P(AdminBackups)} />
    <Route path="/admin/marketing" element={P(AdminMarketingImages)} />
    <Route path="/admin/depoimentos" element={P(AdminDepoimentos)} />
    <Route path="/admin/afiliados" element={P(AdminAfiliados)} />
    <Route path="/admin/cupons" element={P(AdminCupons)} />
    <Route path="/admin/comissoes" element={P(AdminComissoes)} />
    <Route path="/admin/indicacoes" element={P(AdminIndicacoes)} />
    <Route path="/admin/sessoes" element={P(AdminSessoes)} />
    <Route path="/admin/whatsapp" element={P(AdminWhatsApp)} />
    <Route path="/admin/email" element={P(ConfiguracoesEmail)} />
    <Route path="/admin/email/historico" element={P(HistoricoEmails)} />
  </>
);
