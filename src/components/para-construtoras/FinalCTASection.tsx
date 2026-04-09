import { Link } from "react-router-dom";
import AnimatedSection from "@/components/AnimatedSection";
import { LogoIcon } from "@/components/LogoIcon";
import { Button } from "@/components/ui/button";
import { Calendar, BarChart3 } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/5511999999999?text=Olá!%20Gostaria%20de%20agendar%20uma%20demonstração%20do%20VisitaProva%20para%20construtoras.";

const FinalCTASection = () => (
  <section className="py-24 relative overflow-hidden">
    {/* Background glow */}
    <div className="absolute inset-0 flex items-center justify-center -z-10">
      <div className="w-[600px] h-[400px] bg-[#60A5FA]/5 blur-[120px] rounded-full" />
    </div>

    <div className="container mx-auto px-4">
      <AnimatedSection>
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            Sua operação comercial merece mais <span className="text-[#60A5FA]">visibilidade</span>
          </h2>
          <p className="text-white/50 max-w-lg mx-auto mb-10 leading-relaxed">
            Veja como o VisitaProva pode ajudar sua construtora a acompanhar visitas, parceiros e vendas com muito mais clareza.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-14">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-[#60A5FA] hover:bg-[#60A5FA]/90 text-white text-base px-8 py-7 rounded-xl gap-2 shadow-lg shadow-[#60A5FA]/20 w-full sm:w-auto">
                <Calendar className="w-5 h-5" />
                Agendar demonstração
              </Button>
            </a>
            <Link to="/registro-construtora">
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/5 text-base px-8 py-7 rounded-xl gap-2 w-full sm:w-auto">
                <BarChart3 className="w-5 h-5" />
                Ver painel em funcionamento
              </Button>
            </Link>
          </div>

          <div className="flex flex-col items-center gap-3">
            <LogoIcon className="w-10 h-10" />
            <p className="text-white/30 text-sm">www.visitaprova.com.br</p>
          </div>
        </div>
      </AnimatedSection>
    </div>
  </section>
);

export default FinalCTASection;
