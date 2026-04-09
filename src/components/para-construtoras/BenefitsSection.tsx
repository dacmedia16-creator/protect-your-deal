import AnimatedSection from "@/components/AnimatedSection";
import { Users, Filter, Building2, Layers, TrendingUp, BarChart3 } from "lucide-react";

const benefits = [
  { icon: Users, title: "Acompanhe parceiros com critérios reais", text: "Compare imobiliárias com base em confirmação, conversão e valor vendido." },
  { icon: Filter, title: "Descubra onde o funil trava", text: "Visualize em quais etapas a visita avança, para ou se perde." },
  { icon: Building2, title: "Compare empreendimentos com precisão", text: "Entenda quais projetos estão performando melhor e quais exigem atenção." },
  { icon: Layers, title: "Reduza ruído na operação", text: "Menos informação espalhada, mais histórico organizado e leitura centralizada." },
  { icon: TrendingUp, title: "Ganhe previsibilidade comercial", text: "Com dados consistentes, sua equipe consegue agir antes que o gargalo vire problema." },
  { icon: BarChart3, title: "Tome decisão com base em evidência", text: "Pare de depender de percepção parcial e passe a cobrar operação com números claros." },
];

const BenefitsSection = () => (
  <section className="bg-[#0B1120] py-20">
    <div className="container mx-auto px-4">
      <AnimatedSection>
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          Clareza operacional para <span className="text-[#60A5FA]">decidir melhor</span>
        </h2>
      </AnimatedSection>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
        {benefits.map((b, i) => (
          <AnimatedSection key={b.title} delay={i * 80}>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 h-full hover:border-[#60A5FA]/20 transition-colors group">
              <div className="bg-[#60A5FA]/10 rounded-xl w-10 h-10 flex items-center justify-center mb-4 group-hover:bg-[#60A5FA]/15 transition-colors">
                <b.icon className="w-5 h-5 text-[#60A5FA]" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{b.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{b.text}</p>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </div>
  </section>
);

export default BenefitsSection;
