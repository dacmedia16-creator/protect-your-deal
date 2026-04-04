import { lazy } from "react";
import { Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";

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

const R = ['imobiliaria_admin'] as const;
const P = (C: React.ComponentType) => (
  <ProtectedRoute allowedRoles={[...R]}><C /></ProtectedRoute>
);

export const empresaRoutes = (
  <>
    <Route path="/empresa" element={P(EmpresaDashboard)} />
    <Route path="/empresa/corretores" element={P(EmpresaCorretores)} />
    <Route path="/empresa/corretores/:userId" element={P(EmpresaDetalhesCorretor)} />
    <Route path="/empresa/equipes" element={P(EmpresaEquipes)} />
    <Route path="/empresa/fichas" element={P(EmpresaFichas)} />
    <Route path="/empresa/relatorios" element={P(EmpresaRelatorios)} />
    <Route path="/empresa/assinatura" element={P(EmpresaAssinatura)} />
    <Route path="/empresa/configuracoes" element={P(EmpresaConfiguracoes)} />
    <Route path="/empresa/pesquisas" element={P(EmpresaPesquisas)} />
    <Route path="/empresa/parcerias-construtoras" element={P(EmpresaParceriasConstrutoras)} />
  </>
);
