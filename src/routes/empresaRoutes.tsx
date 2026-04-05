import { lazy, Suspense } from "react";
import { Route, Outlet } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageLoader } from "@/components/PageLoader";
import { ImobiliariaLayout } from "@/components/layouts/ImobiliariaLayout";

const EmpresaDashboard = lazy(() => import("@/pages/empresa/EmpresaDashboard"));
const EmpresaCorretores = lazy(() => import("@/pages/empresa/EmpresaCorretores"));
const EmpresaDetalhesCorretor = lazy(() => import("@/pages/empresa/EmpresaDetalhesCorretor"));
const EmpresaEquipes = lazy(() => import("@/pages/empresa/EmpresaEquipes"));
const EmpresaFichas = lazy(() => import("@/pages/empresa/EmpresaFichas"));
const EmpresaRelatorios = lazy(() => import("@/pages/empresa/EmpresaRelatorios"));
const EmpresaAssinatura = lazy(() => import("@/pages/empresa/EmpresaAssinatura"));
const EmpresaConfiguracoes = lazy(() => import("@/pages/empresa/EmpresaConfiguracoes"));
const EmpresaPesquisas = lazy(() => import("@/pages/empresa/EmpresaPesquisas"));
const EmpresaParceriasConstrutoras = lazy(() => import("@/pages/empresa/EmpresaParceriasConstrutoras"));

const EmpresaLayoutRoute = () => (
  <ProtectedRoute allowedRoles={['imobiliaria_admin']}>
    <ImobiliariaLayout>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </ImobiliariaLayout>
  </ProtectedRoute>
);

export const empresaRoutes = (
  <Route path="/empresa" element={<EmpresaLayoutRoute />}>
    <Route index element={<EmpresaDashboard />} />
    <Route path="corretores" element={<EmpresaCorretores />} />
    <Route path="corretores/:userId" element={<EmpresaDetalhesCorretor />} />
    <Route path="equipes" element={<EmpresaEquipes />} />
    <Route path="fichas" element={<EmpresaFichas />} />
    <Route path="relatorios" element={<EmpresaRelatorios />} />
    <Route path="assinatura" element={<EmpresaAssinatura />} />
    <Route path="configuracoes" element={<EmpresaConfiguracoes />} />
    <Route path="pesquisas" element={<EmpresaPesquisas />} />
    <Route path="parcerias-construtoras" element={<EmpresaParceriasConstrutoras />} />
  </Route>
);
