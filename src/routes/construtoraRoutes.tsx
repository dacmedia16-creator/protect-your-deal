import { lazy, Suspense } from "react";
import { Route, Outlet } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageLoader } from "@/components/PageLoader";
import { ConstutoraLayout } from "@/components/layouts/ConstutoraLayout";

const ConstrutoraDashboard = lazy(() => import("@/pages/construtora/ConstrutoraDashboard"));
const ConstutoraEmpreendimentos = lazy(() => import("@/pages/construtora/ConstutoraEmpreendimentos"));
const ConstutoraImobiliarias = lazy(() => import("@/pages/construtora/ConstutoraImobiliarias"));
const ConstutoraCorretores = lazy(() => import("@/pages/construtora/ConstutoraCorretores"));
const ConstutoraFichas = lazy(() => import("@/pages/construtora/ConstutoraFichas"));
const ConstutoraRelatorios = lazy(() => import("@/pages/construtora/ConstutoraRelatorios"));
const ConstutoraConfiguracoes = lazy(() => import("@/pages/construtora/ConstutoraConfiguracoes"));
const ConstutoraAssinatura = lazy(() => import("@/pages/construtora/ConstutoraAssinatura"));
const ConstutoraEquipes = lazy(() => import("@/pages/construtora/ConstutoraEquipes"));
const ConstutoraDetalhesCorretor = lazy(() => import("@/pages/construtora/ConstutoraDetalhesCorretor"));
const ConstutoraPesquisas = lazy(() => import("@/pages/construtora/ConstutoraPesquisas"));

const ConstutoraLayoutRoute = () => (
  <ProtectedRoute allowedRoles={['construtora_admin']}>
    <ConstutoraLayout>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </ConstutoraLayout>
  </ProtectedRoute>
);

export const construtoraRoutes = (
  <Route path="/construtora" element={<ConstutoraLayoutRoute />}>
    <Route index element={<ConstrutoraDashboard />} />
    <Route path="empreendimentos" element={<ConstutoraEmpreendimentos />} />
    <Route path="imobiliarias" element={<ConstutoraImobiliarias />} />
    <Route path="corretores" element={<ConstutoraCorretores />} />
    <Route path="fichas" element={<ConstutoraFichas />} />
    <Route path="pesquisas" element={<ConstutoraPesquisas />} />
    <Route path="relatorios" element={<ConstutoraRelatorios />} />
    <Route path="configuracoes" element={<ConstutoraConfiguracoes />} />
    <Route path="assinatura" element={<ConstutoraAssinatura />} />
    <Route path="equipes" element={<ConstutoraEquipes />} />
    <Route path="corretores/:userId" element={<ConstutoraDetalhesCorretor />} />
  </Route>
);
