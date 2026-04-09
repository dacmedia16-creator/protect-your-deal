import AnimatedSection from "@/components/AnimatedSection";
import { TrendingDown, GitCompare, Building2, CalendarCheck } from "lucide-react";

const callouts = [
  { icon: TrendingDown, text: "Veja onde a conversão cai" },
  { icon: GitCompare, text: "Compare parceiros com clareza" },
  { icon: Building2, text: "Enxergue empreendimentos mais eficientes" },
  { icon: CalendarCheck, text: "Acompanhe a evolução mês a mês" },
];

const SolutionSection = () => (
  <section className="py-20">
    <div className="container mx-auto px-4">
      <AnimatedSection>
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Uma central de inteligência para a <span className="text-[#60A5FA]">operação comercial</span>
          </h2>
          <p className="text-white/60 leading-relaxed mb-4">
            O VisitaProva centraliza visitas, confirmações, no-shows e vendas em um só lugar, dando à construtora uma leitura clara da operação — por parceiro, corretor, empreendimento e período.
          </p>
          <p className="text-white/40 text-sm leading-relaxed">
            Em vez de operar com planilhas soltas, repasses parciais e visões fragmentadas, sua equipe passa a acompanhar a jornada comercial com dados comparáveis, filtros inteligentes e indicadores acionáveis.
          </p>
        </div>
      </AnimatedSection>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {callouts.map((c, i) => (
          <AnimatedSection key={c.text} delay={i * 100}>
            <div className="bg-[#60A5FA]/5 border border-[#60A5FA]/15 rounded-xl p-5 text-center hover:border-[#60A5FA]/30 transition-colors">
              <c.icon className="w-6 h-6 text-[#60A5FA] mx-auto mb-3" />
              <p className="text-sm text-white/70 font-medium">{c.text}</p>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </div>
  </section>
);

export default SolutionSection;
