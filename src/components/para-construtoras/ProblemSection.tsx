import AnimatedSection from "@/components/AnimatedSection";
import { Eye, GitCompare, TrendingDown, Brain, FolderOpen, Clock } from "lucide-react";

const problems = [
  {
    icon: Eye,
    title: "Parceiros sem leitura clara de performance",
    text: "Nem sempre fica evidente quais imobiliárias realmente trazem visitas qualificadas, confirmam presença e convertem em venda.",
  },
  {
    icon: GitCompare,
    title: "Empreendimentos difíceis de comparar",
    text: "Sem uma visão consolidada, a gestão perde velocidade para entender quais projetos performam melhor e quais estão travando.",
  },
  {
    icon: TrendingDown,
    title: "No-show e perdas sem diagnóstico",
    text: "A operação sente o impacto, mas raramente enxerga com precisão onde as visitas estão se perdendo.",
  },
  {
    icon: Brain,
    title: "Decisão baseada em percepção",
    text: "Quando os dados não estão centralizados, a tomada de decisão depende mais de feeling do que de evidência.",
  },
  {
    icon: FolderOpen,
    title: "Histórico fragmentado entre times e parceiros",
    text: "Informações espalhadas dificultam cobrança, acompanhamento e leitura real da operação.",
  },
  {
    icon: Clock,
    title: "Pouca previsibilidade comercial",
    text: "Sem indicadores confiáveis, fica mais difícil antecipar gargalos e ajustar a rota com rapidez.",
  },
];

const ProblemSection = () => (
  <section className="bg-[#0B1120] py-20">
    <div className="container mx-auto px-4">
      <AnimatedSection>
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Quando a operação cresce, a gestão pode ficar <span className="text-amber-400">cega</span>
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto leading-relaxed">
            Muitas construtoras crescem em volume, parceiros e empreendimentos — mas continuam operando com informações espalhadas, visibilidade parcial e pouca clareza sobre onde a venda realmente avança ou trava.
          </p>
        </div>
      </AnimatedSection>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
        {problems.map((p, i) => (
          <AnimatedSection key={p.title} delay={i * 80}>
            <div className="bg-white/[0.03] backdrop-blur border border-amber-500/10 rounded-2xl p-6 h-full hover:border-amber-500/20 transition-colors">
              <div className="bg-amber-500/10 rounded-xl w-10 h-10 flex items-center justify-center mb-4">
                <p.icon className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{p.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{p.text}</p>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </div>
  </section>
);

export default ProblemSection;
