import { lazy, Suspense } from "react";
import { Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageLoader } from "@/components/PageLoader";

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

const R = ['construtora_admin'] as const;
const P = (C: React.ComponentType) => (
  <ProtectedRoute allowedRoles={[...R]}>
    <Suspense fallback={<PageLoader />}><C /></Suspense>
  </ProtectedRoute>
);

export const construtoraRoutes = (
  <>
    <Route path="/construtora" element={P(ConstrutoraDashboard)} />
    <Route path="/construtora/empreendimentos" element={P(ConstutoraEmpreendimentos)} />
    <Route path="/construtora/imobiliarias" element={P(ConstutoraImobiliarias)} />
    <Route path="/construtora/corretores" element={P(ConstutoraCorretores)} />
    <Route path="/construtora/fichas" element={P(ConstutoraFichas)} />
    <Route path="/construtora/pesquisas" element={P(ConstutoraPesquisas)} />
    <Route path="/construtora/relatorios" element={P(ConstutoraRelatorios)} />
    <Route path="/construtora/configuracoes" element={P(ConstutoraConfiguracoes)} />
    <Route path="/construtora/assinatura" element={P(ConstutoraAssinatura)} />
    <Route path="/construtora/equipes" element={P(ConstutoraEquipes)} />
    <Route path="/construtora/corretores/:userId" element={P(ConstutoraDetalhesCorretor)} />
  </>
);
