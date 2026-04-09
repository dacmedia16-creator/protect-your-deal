import AnimatedSection from "@/components/AnimatedSection";
import { X, Check } from "lucide-react";

const rows = [
  { label: "Dados centralizados", old: false, novo: true },
  { label: "Histórico consolidado", old: false, novo: true },
  { label: "Performance comparável entre parceiros", old: false, novo: true },
  { label: "Leitura por empreendimento", old: false, novo: true },
  { label: "Filtros inteligentes", old: false, novo: true },
  { label: "Gestão com previsibilidade", old: false, novo: true },
  { label: "Planilhas espalhadas", old: true, novo: false },
  { label: "Informações repassadas por mensagem", old: true, novo: false },
  { label: "Leitura parcial da operação", old: true, novo: false },
  { label: "Gestão reativa", old: true, novo: false },
];

const ComparisonSection = () => (
  <section className="py-20">
    <div className="container mx-auto px-4">
      <AnimatedSection>
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          Feito para a realidade da <span className="text-[#60A5FA]">operação imobiliária</span>
        </h2>
      </AnimatedSection>

      <AnimatedSection>
        <div className="max-w-3xl mx-auto bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-3 border-b border-white/10">
            <div className="p-4" />
            <div className="p-4 text-center border-l border-white/10">
              <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Descentralizada</p>
            </div>
            <div className="p-4 text-center border-l border-[#60A5FA]/20 bg-[#60A5FA]/5">
              <p className="text-xs text-[#60A5FA] uppercase tracking-wider font-semibold">Com VisitaProva</p>
            </div>
          </div>

          {/* Rows */}
          {rows.map((row) => (
            <div key={row.label} className="grid grid-cols-3 border-b border-white/5 last:border-0">
              <div className="p-3 px-4 flex items-center">
                <span className="text-sm text-white/60">{row.label}</span>
              </div>
              <div className="p-3 flex items-center justify-center border-l border-white/5">
                {row.old ? (
                  <X className="w-4 h-4 text-red-400/60" />
                ) : (
                  <div className="w-4 h-4" />
                )}
              </div>
              <div className="p-3 flex items-center justify-center border-l border-[#60A5FA]/10 bg-[#60A5FA]/[0.02]">
                {row.novo ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <div className="w-4 h-4" />
                )}
              </div>
            </div>
          ))}
        </div>
      </AnimatedSection>
    </div>
  </section>
);

export default ComparisonSection;
