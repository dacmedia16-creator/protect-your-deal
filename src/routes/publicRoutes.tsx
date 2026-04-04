import { lazy } from "react";
import { Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SmartRedirect } from "@/components/SmartRedirect";

const Index = lazy(() => import("@/pages/Index"));
const AppLanding = lazy(() => import("@/pages/AppLanding"));
const Auth = lazy(() => import("@/pages/Auth"));
const ConfirmarVisita = lazy(() => import("@/pages/ConfirmarVisita"));
const VerificarComprovante = lazy(() => import("@/pages/VerificarComprovante"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const AssinaturaSuspensa = lazy(() => import("@/pages/AssinaturaSuspensa"));
const SemPermissao = lazy(() => import("@/pages/SemPermissao"));
const ContaDesativada = lazy(() => import("@/pages/ContaDesativada"));
const InstalarApp = lazy(() => import("@/pages/InstalarApp"));
const Funcionalidades = lazy(() => import("@/pages/Funcionalidades"));
const ComoFunciona = lazy(() => import("@/pages/ComoFunciona"));
const Tutoriais = lazy(() => import("@/pages/Tutoriais"));
const TourAudio = lazy(() => import("@/pages/TourAudio"));
const TourAudioLanding = lazy(() => import("@/pages/TourAudioLanding"));
const Afiliados = lazy(() => import("@/pages/Afiliados"));
const ParaImobiliarias = lazy(() => import("@/pages/ParaImobiliarias"));
const SobreNos = lazy(() => import("@/pages/SobreNos"));
const NossaHistoria = lazy(() => import("@/pages/NossaHistoria"));
const RegistroImobiliaria = lazy(() => import("@/pages/auth/RegistroImobiliaria"));
const RegistroCorretorAutonomo = lazy(() => import("@/pages/auth/RegistroCorretorAutonomo"));
const RegistroTipo = lazy(() => import("@/pages/auth/RegistroTipo"));
const RegistroVinculado = lazy(() => import("@/pages/auth/RegistroVinculado"));
const AceitarConvite = lazy(() => import("@/pages/auth/AceitarConvite"));
const CadastroConcluido = lazy(() => import("@/pages/auth/CadastroConcluido"));
const SelecionarEquipe = lazy(() => import("@/pages/auth/SelecionarEquipe"));
const RecuperarSenha = lazy(() => import("@/pages/auth/RecuperarSenha"));
const RedefinirSenha = lazy(() => import("@/pages/auth/RedefinirSenha"));
const ConviteParceiro = lazy(() => import("@/pages/ConviteParceiro"));
const ConviteParceiroExterno = lazy(() => import("@/pages/ConviteParceiroExterno"));
const TermosDeUso = lazy(() => import("@/pages/TermosDeUso"));
const AceitarTermos = lazy(() => import("@/pages/AceitarTermos"));
const PoliticaPrivacidade = lazy(() => import("@/pages/PoliticaPrivacidade"));
const SurveyPublic = lazy(() => import("@/pages/SurveyPublic"));
const RegistroConstrutora = lazy(() => import("@/pages/auth/RegistroConstrutora"));

export const publicRoutes = (
  <>
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
    <Route path="/tour" element={<TourAudioLanding />} />
    <Route path="/tour-audio" element={<TourAudio />} />
    <Route path="/convite-parceiro/:token" element={<ConviteParceiro />} />
    <Route path="/convite-externo/:token" element={<ConviteParceiroExterno />} />
    <Route path="/termos-de-uso" element={<TermosDeUso />} />
    <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
    <Route path="/auth/recuperar-senha" element={<RecuperarSenha />} />
    <Route path="/auth/redefinir-senha" element={<RedefinirSenha />} />
    <Route path="/survey/:token" element={<SurveyPublic />} />
    <Route path="/aceitar-termos" element={
      <ProtectedRoute skipTermsCheck>
        <AceitarTermos />
      </ProtectedRoute>
    } />
    <Route path="*" element={<NotFound />} />
  </>
);
