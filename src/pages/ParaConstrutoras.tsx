import { useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";
import { LogoIcon } from "@/components/LogoIcon";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import HeroSection from "@/components/para-construtoras/HeroSection";
import ProblemSection from "@/components/para-construtoras/ProblemSection";
import SolutionSection from "@/components/para-construtoras/SolutionSection";
import BenefitsSection from "@/components/para-construtoras/BenefitsSection";
import ReportsSection from "@/components/para-construtoras/ReportsSection";
import ImpactSection from "@/components/para-construtoras/ImpactSection";
import DashboardShowcaseSection from "@/components/para-construtoras/DashboardShowcaseSection";
import ComparisonSection from "@/components/para-construtoras/ComparisonSection";
import FAQSection from "@/components/para-construtoras/FAQSection";
import FinalCTASection from "@/components/para-construtoras/FinalCTASection";

const ParaConstrutoras = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F172A] to-[#1E3A5F] text-white">
      <SEOHead
        title="Para Construtoras | VisitaProva"
        description="Organize a operação comercial da sua construtora. Acompanhe visitas, parceiros, corretores e empreendimentos com indicadores claros e relatórios acionáveis."
      />

      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Voltar ao início</span>
        </Link>
        <LogoIcon className="w-8 h-8" />
      </header>

      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <BenefitsSection />
      <ReportsSection />
      <ImpactSection />
      <DashboardShowcaseSection />
      <ComparisonSection />
      <FAQSection />
      <FinalCTASection />
    </div>
  );
};

export default ParaConstrutoras;
