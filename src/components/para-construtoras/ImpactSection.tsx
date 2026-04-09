import AnimatedSection from "@/components/AnimatedSection";
import { Target, Building2, AlertTriangle, Search, ClipboardList, Database } from "lucide-react";

const impacts = [
  { icon: Target, title: "Identifique parceiros que realmente convertem", text: "Tenha critérios objetivos para avaliar imobiliárias além do volume bruto." },
  { icon: Building2, title: "Entenda quais empreendimentos sustentam a operação", text: "Compare projetos por resultado, conversão e valor vendido." },
  { icon: AlertTriangle, title: "Reduza no-show com mais contexto", text: "Saiba onde o problema se concentra e aja com mais precisão." },
  { icon: Search, title: "Enxergue perdas com mais profundidade", text: "Visualize padrões de não conversão e evite leitura superficial do funil." },
  { icon: ClipboardList, title: "Ganhe base para cobrar e ajustar a operação", text: "Use números claros para orientar parceiros, times e prioridades comerciais." },
  { icon: Database, title: "Construa histórico para decisões melhores", text: "Tenha um repositório confiável da operação, em vez de depender de memória e repasse informal." },
];

const ImpactSection = () => (
  <section className="py-20">
    <div className="container mx-auto px-4">
      <AnimatedSection>
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
          Mais do que acompanhar visitas: enxergar a operação com <span className="text-[#60A5FA]">precisão</span>
        </h2>
        <p className="text-white/50 text-center max-w-xl mx-auto mb-12">
          Relatórios que se traduzem em impacto executivo real.
        </p>
      </AnimatedSection>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
        {impacts.map((item, i) => (
          <AnimatedSection key={item.title} delay={i * 80}>
            <div className="border border-white/10 rounded-2xl p-6 h-full hover:border-[#60A5FA]/20 transition-colors">
              <item.icon className="w-6 h-6 text-[#60A5FA] mb-4" />
              <h3 className="text-base font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{item.text}</p>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </div>
  </section>
);

export default ImpactSection;
