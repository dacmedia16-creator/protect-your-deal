import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2, Calendar, BarChart3, Users, Layers } from "lucide-react";
import DashboardMockup from "./DashboardMockup";

const badges = [
  { icon: Layers, label: "Operação comercial centralizada" },
  { icon: Users, label: "Performance por parceiro" },
  { icon: BarChart3, label: "Funil com visão real" },
  { icon: Building2, label: "Indicadores por empreendimento" },
];

const WHATSAPP_URL = "https://wa.me/5511999999999?text=Olá!%20Gostaria%20de%20agendar%20uma%20demonstração%20do%20VisitaProva%20para%20construtoras.";

const HeroSection = () => (
  <section className="container mx-auto px-4 pt-12 pb-20">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      {/* Left */}
      <div>
        <div className="inline-flex items-center gap-2 bg-[#60A5FA]/10 border border-[#60A5FA]/30 rounded-full px-5 py-2 mb-8">
          <Building2 className="w-4 h-4 text-[#60A5FA]" />
          <span className="text-[#60A5FA] font-medium text-sm">Para Construtoras</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1] mb-5">
          Sua construtora com mais controle sobre{" "}
          <span className="text-[#60A5FA]">visitas, parceiros e vendas</span>
        </h1>

        <p className="text-base md:text-lg text-white/60 max-w-lg mb-8 leading-relaxed">
          Organize a operação comercial, acompanhe imobiliárias parceiras em tempo real e transforme cada visita em dado útil para decisão.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-10">
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="bg-[#60A5FA] hover:bg-[#60A5FA]/90 text-white text-base px-7 py-6 rounded-xl gap-2 w-full sm:w-auto">
              <Calendar className="w-5 h-5" />
              Agendar demonstração
            </Button>
          </a>
          <Link to="/registro-construtora">
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/5 text-base px-7 py-6 rounded-xl gap-2 w-full sm:w-auto">
              <BarChart3 className="w-5 h-5" />
              Ver painel em funcionamento
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {badges.map((b) => (
            <div key={b.label} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
              <b.icon className="w-3.5 h-3.5 text-[#60A5FA]/70" />
              <span className="text-[11px] text-white/50">{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right */}
      <div className="flex justify-center lg:justify-end">
        <DashboardMockup />
      </div>
    </div>
  </section>
);

export default HeroSection;
