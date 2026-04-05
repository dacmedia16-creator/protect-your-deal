import { lazy, Suspense } from "react";
import { Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageLoader } from "@/components/PageLoader";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const NovaFicha = lazy(() => import("@/pages/NovaFicha"));
const DetalhesFicha = lazy(() => import("@/pages/DetalhesFicha"));
const ListaFichas = lazy(() => import("@/pages/ListaFichas"));
const ListaClientes = lazy(() => import("@/pages/ListaClientes"));
const FormCliente = lazy(() => import("@/pages/FormCliente"));
const DetalhesCliente = lazy(() => import("@/pages/DetalhesCliente"));
const ListaImoveis = lazy(() => import("@/pages/ListaImoveis"));
const FormImovel = lazy(() => import("@/pages/FormImovel"));
const DetalhesImovel = lazy(() => import("@/pages/DetalhesImovel"));
const Integracoes = lazy(() => import("@/pages/Integracoes"));
const TemplatesMensagem = lazy(() => import("@/pages/TemplatesMensagem"));
const Perfil = lazy(() => import("@/pages/Perfil"));
const Relatorios = lazy(() => import("@/pages/Relatorios"));
const CorretorAssinatura = lazy(() => import("@/pages/CorretorAssinatura"));
const Convites = lazy(() => import("@/pages/Convites"));
const FichasParceiro = lazy(() => import("@/pages/FichasParceiro"));
const Pesquisas = lazy(() => import("@/pages/Pesquisas"));
const MinhaEquipe = lazy(() => import("@/pages/equipe/MinhaEquipe"));
const MinhasIndicacoes = lazy(() => import("@/pages/MinhasIndicacoes"));

const CR = ['corretor', 'imobiliaria_admin'] as const;

const S = (C: React.ComponentType) => (
  <Suspense fallback={<PageLoader />}><C /></Suspense>
);

export const corretorRoutes = (
  <>
    <Route path="/pesquisas" element={
      <ProtectedRoute allowedRoles={[...CR]} requireSubscription>{S(Pesquisas)}</ProtectedRoute>
    } />
    <Route path="/dashboard" element={
      <ProtectedRoute allowedRoles={[...CR]} requireSubscription>{S(Dashboard)}</ProtectedRoute>
    } />
    <Route path="/fichas" element={
      <ProtectedRoute allowedRoles={[...CR]} requireSubscription>{S(ListaFichas)}</ProtectedRoute>
    } />
    <Route path="/fichas/nova" element={
      <ProtectedRoute allowedRoles={[...CR]} requireSubscription>{S(NovaFicha)}</ProtectedRoute>
    } />
    <Route path="/fichas/:id" element={
      <ProtectedRoute allowedRoles={['corretor', 'imobiliaria_admin', 'super_admin', 'construtora_admin']}>
        {S(DetalhesFicha)}
      </ProtectedRoute>
    } />
    <Route path="/clientes" element={
      <ProtectedRoute allowedRoles={[...CR]} requireSubscription>{S(ListaClientes)}</ProtectedRoute>
    } />
    <Route path="/clientes/novo" element={
      <ProtectedRoute allowedRoles={[...CR]} requireSubscription>{S(FormCliente)}</ProtectedRoute>
    } />
    <Route path="/clientes/:id" element={
      <ProtectedRoute allowedRoles={[...CR]} requireSubscription>{S(DetalhesCliente)}</ProtectedRoute>
    } />
    <Route path="/clientes/:id/editar" element={
      <ProtectedRoute allowedRoles={[...CR]} requireSubscription>{S(FormCliente)}</ProtectedRoute>
    } />
    <Route path="/imoveis" element={
      <ProtectedRoute allowedRoles={[...CR]} requireSubscription>{S(ListaImoveis)}</ProtectedRoute>
    } />
    <Route path="/imoveis/novo" element={
      <ProtectedRoute allowedRoles={[...CR]} requireSubscription>{S(FormImovel)}</ProtectedRoute>
    } />
    <Route path="/imoveis/:id" element={
      <ProtectedRoute allowedRoles={[...CR]} requireSubscription>{S(DetalhesImovel)}</ProtectedRoute>
    } />
    <Route path="/imoveis/:id/editar" element={
      <ProtectedRoute allowedRoles={[...CR]} requireSubscription>{S(FormImovel)}</ProtectedRoute>
    } />
    <Route path="/integracoes" element={
      <ProtectedRoute allowedRoles={['imobiliaria_admin']} requireSubscription>{S(Integracoes)}</ProtectedRoute>
    } />
    <Route path="/integracoes/templates" element={
      <ProtectedRoute allowedRoles={['imobiliaria_admin']} requireSubscription>{S(TemplatesMensagem)}</ProtectedRoute>
    } />
    <Route path="/relatorios" element={
      <ProtectedRoute allowedRoles={[...CR]} requireSubscription>{S(Relatorios)}</ProtectedRoute>
    } />
    <Route path="/perfil" element={
      <ProtectedRoute allowedRoles={['corretor', 'imobiliaria_admin', 'super_admin', 'construtora_admin']}>
        {S(Perfil)}
      </ProtectedRoute>
    } />
    <Route path="/minha-assinatura" element={
      <ProtectedRoute allowedRoles={['corretor']}>{S(CorretorAssinatura)}</ProtectedRoute>
    } />
    <Route path="/convites" element={
      <ProtectedRoute allowedRoles={[...CR]} requireSubscription>{S(Convites)}</ProtectedRoute>
    } />
    <Route path="/convites-recebidos" element={<Navigate to="/convites?tab=recebidos" replace />} />
    <Route path="/convites-enviados" element={<Navigate to="/convites?tab=enviados" replace />} />
    <Route path="/fichas-parceiro" element={
      <ProtectedRoute allowedRoles={[...CR]} requireSubscription>{S(FichasParceiro)}</ProtectedRoute>
    } />
    <Route path="/minha-equipe" element={
      <ProtectedRoute allowedRoles={[...CR]} requireSubscription>{S(MinhaEquipe)}</ProtectedRoute>
    } />
    <Route path="/minhas-indicacoes" element={
      <ProtectedRoute allowedRoles={[...CR]} requireSubscription>{S(MinhasIndicacoes)}</ProtectedRoute>
    } />
  </>
);
