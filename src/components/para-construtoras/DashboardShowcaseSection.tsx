import AnimatedSection from "@/components/AnimatedSection";
import DashboardMockup from "./DashboardMockup";

const tooltips = [
  { label: "Compare parceiros lado a lado", position: "top-4 -left-4 md:-left-36" },
  { label: "Veja a evolução do volume e das vendas", position: "top-1/3 -right-4 md:-right-44" },
  { label: "Filtre por corretor, empreendimento ou imobiliária", position: "bottom-1/3 -left-4 md:-left-48" },
  { label: "Identifique gargalos com rapidez", position: "bottom-8 -right-4 md:-right-40" },
];

const DashboardShowcaseSection = () => (
  <section className="bg-[#0B1120] py-20 overflow-hidden">
    <div className="container mx-auto px-4">
      <AnimatedSection>
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
          Um painel pensado para quem precisa <span className="text-[#60A5FA]">decidir com clareza</span>
        </h2>
        <p className="text-white/50 text-center max-w-xl mx-auto mb-14">
          Interface intuitiva, indicadores acionáveis e visão consolidada da operação comercial.
        </p>
      </AnimatedSection>

      <AnimatedSection>
        <div className="relative max-w-3xl mx-auto">
          {/* Tooltips - hidden on mobile for cleanliness */}
          {tooltips.map((t) => (
            <div key={t.label} className={`absolute ${t.position} hidden md:flex items-center gap-2 z-10`}>
              <div className="bg-[#60A5FA]/10 border border-[#60A5FA]/20 rounded-lg px-3 py-1.5 backdrop-blur">
                <span className="text-[11px] text-[#60A5FA] whitespace-nowrap">{t.label}</span>
              </div>
            </div>
          ))}

          <div className="flex justify-center">
            <DashboardMockup />
          </div>

          {/* Glow effect */}
          <div className="absolute inset-0 bg-[#60A5FA]/5 blur-3xl rounded-full -z-10 scale-110" />
        </div>
      </AnimatedSection>
    </div>
  </section>
);

export default DashboardShowcaseSection;
