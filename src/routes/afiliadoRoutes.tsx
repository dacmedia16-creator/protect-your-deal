import { lazy, Suspense } from "react";
import { Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageLoader } from "@/components/PageLoader";

const AfiliadoDashboard = lazy(() => import("@/pages/afiliado/AfiliadoDashboard"));
const AfiliadoComissoes = lazy(() => import("@/pages/afiliado/AfiliadoComissoes"));
const AfiliadoPerfil = lazy(() => import("@/pages/afiliado/AfiliadoPerfil"));

const P = (C: React.ComponentType) => (
  <ProtectedRoute allowedRoles={['afiliado']}>
    <Suspense fallback={<PageLoader />}><C /></Suspense>
  </ProtectedRoute>
);

export const afiliadoRoutes = (
  <>
    <Route path="/afiliado" element={P(AfiliadoDashboard)} />
    <Route path="/afiliado/comissoes" element={P(AfiliadoComissoes)} />
    <Route path="/afiliado/perfil" element={P(AfiliadoPerfil)} />
  </>
);
