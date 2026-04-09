import AnimatedSection from "@/components/AnimatedSection";
import {
  BarChart3, Filter as FilterIcon, TrendingUp, Trophy, AlertTriangle, SlidersHorizontal,
} from "lucide-react";

const categories = [
  {
    icon: BarChart3,
    title: "Visão executiva",
    subtitle: "Painel de KPIs com variação",
    items: ["Total de registros", "Confirmados", "Taxa de confirmação", "Vendas", "Valor vendido", "Ticket médio", "Variação % vs período anterior"],
    micro: "Uma leitura rápida do cenário atual, com comparação automática para entender evolução ou queda de performance.",
    color: "bg-[#60A5FA]",
  },
  {
    icon: FilterIcon,
    title: "Funil e conversão",
    subtitle: "Funil de conversão visual",
    items: ["Criadas → Confirmadas → No-show → Vendas", "Taxas de conversão entre etapas"],
    micro: "Veja com clareza onde a operação perde força e onde o volume realmente se transforma em venda.",
    color: "bg-[#3B82F6]",
  },
  {
    icon: TrendingUp,
    title: "Evolução da operação",
    subtitle: "Evolução mensal em 6 meses",
    items: ["Total por mês", "Confirmados por mês", "Vendas por mês", "Gráfico de barras empilhadas"],
    micro: "Acompanhe ritmo, consistência e mudanças de comportamento ao longo do tempo.",
    color: "bg-emerald-500",
  },
  {
    icon: Trophy,
    title: "Performance comercial",
    subtitle: "Rankings comparativos",
    items: ["Top 15 corretores por vendas e conversão", "Top 10 empreendimentos por valor vendido", "Top 10 imobiliárias parceiras", "Medalhas visuais para os 3 primeiros"],
    micro: "Entenda quem performa melhor, onde está a tração e quais frentes pedem ajuste.",
    color: "bg-amber-500",
  },
  {
    icon: AlertTriangle,
    title: "Gargalos e perdas",
    subtitle: "Diagnóstico operacional",
    items: ["Relatório de no-show com ranking por empreendimento", "Motivos de perda mais frequentes", "Tempo médio de confirmação (proprietário, comprador, total)"],
    micro: "Não basta saber que houve perda. O ponto é entender por que ela aconteceu e onde ela começa.",
    color: "bg-red-400",
  },
  {
    icon: SlidersHorizontal,
    title: "Análise avançada",
    subtitle: "Filtros e exportação",
    items: ["Filtro por período, status, empreendimento", "Filtro por imobiliária parceira e corretor", "Exportação completa em CSV"],
    micro: "Aprofunde a leitura e extraia os dados com o recorte que fizer sentido para sua gestão.",
    color: "bg-violet-500",
  },
];

const ReportsSection = () => (
  <section className="py-20">
    <div className="container mx-auto px-4">
      <AnimatedSection>
        <div className="text-center mb-4">
          <h2 className="text-2xl md:text-3xl font-bold">
            Relatórios que mostram o que está funcionando — e o que está <span className="text-[#60A5FA]">escapando</span>
          </h2>
        </div>
        <p className="text-white/50 text-center max-w-2xl mx-auto mb-12">
          Do panorama executivo ao detalhe operacional, sua equipe acompanha a operação comercial com profundidade e clareza.
        </p>
      </AnimatedSection>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
        {categories.map((cat, i) => (
          <AnimatedSection key={cat.title} delay={i * 80}>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 h-full flex flex-col hover:border-white/20 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className={`${cat.color}/15 rounded-xl w-10 h-10 flex items-center justify-center`}>
                  <cat.icon className={`w-5 h-5`} style={{ color: cat.color === 'bg-[#60A5FA]' ? '#60A5FA' : cat.color === 'bg-[#3B82F6]' ? '#3B82F6' : cat.color === 'bg-emerald-500' ? '#10B981' : cat.color === 'bg-amber-500' ? '#F59E0B' : cat.color === 'bg-red-400' ? '#F87171' : '#8B5CF6' }} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">{cat.title}</h3>
                  <p className="text-[11px] text-white/40">{cat.subtitle}</p>
                </div>
              </div>
              <ul className="space-y-1.5 mb-4 flex-1">
                {cat.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-white/50">
                    <span className="w-1 h-1 rounded-full bg-white/20 mt-2 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-white/30 leading-relaxed border-t border-white/5 pt-3">{cat.micro}</p>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </div>
  </section>
);

export default ReportsSection;
