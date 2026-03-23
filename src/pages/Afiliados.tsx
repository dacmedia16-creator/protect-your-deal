import { useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";
import AnimatedSection from "@/components/AnimatedSection";
import { LogoIcon } from "@/components/LogoIcon";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Rocket,
  Building2,
  Users,
  TrendingUp,
  Zap,
  Crown,
  MessageCircle,
  ArrowLeft,
  Network,
  BadgeDollarSign,
  Star,
} from "lucide-react";

const Afiliados = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const whatsappUrl =
    "https://wa.me/5515981788214?text=Quero%20ser%20afiliado%20VisitaProva";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F172A] to-[#1E3A5F] text-white">
      <SEOHead
        title="Programa de Afiliados | VisitaProva"
        description="Ganhe dinheiro indicando o VisitaProva. Comissão recorrente e vitalícia de até 10% sobre cada venda. Mercado com +600 mil corretores ativos no Brasil."
      />

      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Voltar ao início</span>
        </Link>
        <LogoIcon className="w-8 h-8" />
      </header>

      {/* Hero */}
      <AnimatedSection>
        <section className="container mx-auto px-4 pt-12 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-[#60A5FA]/10 border border-[#60A5FA]/30 rounded-full px-5 py-2 mb-8">
            <Rocket className="w-5 h-5 text-[#60A5FA]" />
            <span className="text-[#60A5FA] font-medium text-sm">Programa de Afiliados</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            GANHE DINHEIRO
            <br />
            <span className="text-[#60A5FA]">INDICANDO</span>
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-8">
            Torne-se um revendedor VisitaProva e receba comissões{" "}
            <span className="text-green-400 font-semibold">recorrentes e vitalícias</span> sobre cada indicação.
          </p>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white text-lg px-8 py-6 rounded-xl gap-2">
              <MessageCircle className="w-5 h-5" />
              Quero Ser Afiliado
            </Button>
          </a>
        </section>
      </AnimatedSection>

      {/* Mercado */}
      <AnimatedSection>
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            Um Mercado <span className="text-[#60A5FA]">Gigante</span> Esperando por Você
          </h2>
          <p className="text-white/50 text-center mb-10 max-w-xl mx-auto">
            O setor imobiliário brasileiro é enorme e ainda pouco digitalizado.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 text-center">
              <Building2 className="w-10 h-10 text-[#60A5FA] mx-auto mb-4" />
              <p className="text-4xl font-bold text-white mb-1">+47 mil</p>
              <p className="text-white/60">Imobiliárias ativas no Brasil</p>
            </div>
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 text-center">
              <Users className="w-10 h-10 text-[#60A5FA] mx-auto mb-4" />
              <p className="text-4xl font-bold text-white mb-1">+600 mil</p>
              <p className="text-white/60">Corretores ativos no Brasil</p>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Plano de Ganhos */}
      <AnimatedSection>
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">
            COMO VOCÊ <span className="text-green-400">GANHA</span>
          </h2>
          <p className="text-white/50 text-center mb-10">Dois níveis de comissão recorrente</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
            {/* Nível 1 */}
            <div className="bg-white/5 backdrop-blur border border-[#60A5FA]/30 rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#60A5FA]/20 px-4 py-1.5 rounded-bl-xl text-xs font-semibold text-[#60A5FA]">
                NÍVEL 1
              </div>
              <BadgeDollarSign className="w-10 h-10 text-green-400 mb-4" />
              <p className="text-5xl font-extrabold text-green-400 mb-2">10%</p>
              <p className="text-lg font-semibold text-white mb-2">Comissão Direta</p>
              <p className="text-white/60 text-sm leading-relaxed">
                Você indica → cliente assina → você ganha <strong className="text-white">todo mês</strong> enquanto ele for assinante.
              </p>
            </div>

            {/* Nível 2 */}
            <div className="bg-white/5 backdrop-blur border border-purple-500/30 rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-purple-500/20 px-4 py-1.5 rounded-bl-xl text-xs font-semibold text-purple-400">
                NÍVEL 2
              </div>
              <Network className="w-10 h-10 text-purple-400 mb-4" />
              <p className="text-5xl font-extrabold text-purple-400 mb-2">5%</p>
              <p className="text-lg font-semibold text-white mb-2">Comissão Indireta</p>
              <p className="text-white/60 text-sm leading-relaxed">
                Seus indicados indicam → você <strong className="text-white">também ganha</strong> sobre as vendas da sua rede.
              </p>
            </div>
          </div>

          {/* Badge Vitalícia */}
          <div className="max-w-md mx-auto bg-gradient-to-r from-green-500/20 to-[#60A5FA]/20 border border-green-400/30 rounded-xl px-6 py-4 flex items-center gap-3 justify-center">
            <Zap className="w-6 h-6 text-yellow-400 flex-shrink-0" />
            <p className="text-white font-bold text-center">
              COMISSÃO VITALÍCIA — <span className="text-green-400">Sem limite de meses!</span>
            </p>
          </div>
        </section>
      </AnimatedSection>

      {/* Simulação 100 Clientes */}
      <AnimatedSection>
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">
            QUANTO VOCÊ GANHARIA COM{" "}
            <span className="text-[#60A5FA]">100 CLIENTES?</span>
          </h2>
          <p className="text-white/50 text-center mb-12">Simulações reais com os valores dos nossos planos</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Conservador */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-[#60A5FA]" />
                <p className="font-semibold text-[#60A5FA]">Cenário Conservador</p>
              </div>
              <p className="text-sm text-white/60 mb-4">100 imobiliárias pequenas <span className="text-[#60A5FA]">(apenas 0,2% do mercado)</span></p>
              <div className="space-y-2 text-sm text-white/70 mb-6">
                <p>100 × Pequena (R$297,90)</p>
                <p>Comissão 10%</p>
              </div>
              <p className="text-3xl font-extrabold text-green-400">R$2.979<span className="text-xl">,00</span><span className="text-base text-white/50 font-normal">/mês</span></p>
              <p className="text-sm text-white/40 mt-1">= R$35.748,00/ano</p>
            </div>

            {/* Misto */}
            <div className="bg-white/5 backdrop-blur border border-green-400/30 rounded-2xl p-6 ring-1 ring-green-400/20 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3" /> MAIS PROVÁVEL
              </div>
              <div className="flex items-center gap-2 mb-4 mt-2">
                <Crown className="w-5 h-5 text-green-400" />
                <p className="font-semibold text-green-400">Cenário Misto</p>
              </div>
              <p className="text-sm text-white/60 mb-4">60 pequenas + 30 médias + 10 grandes</p>
              <div className="space-y-1.5 text-sm text-white/70 mb-6">
                <p>60 × R$297,90 = R$1.787,40</p>
                <p>30 × R$497,90 = R$1.493,70</p>
                <p>10 × R$697,90 = R$697,90</p>
              </div>
              <p className="text-3xl font-extrabold text-green-400">R$3.979<span className="text-xl">,00</span><span className="text-base text-white/50 font-normal">/mês</span></p>
              <p className="text-sm text-white/40 mt-1">= R$47.748,00/ano</p>
            </div>

            {/* Rede 2º Nível */}
            <div className="bg-white/5 backdrop-blur border border-purple-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Network className="w-5 h-5 text-purple-400" />
                <p className="font-semibold text-purple-400">Bônus — Rede 2º Nível</p>
              </div>
              <p className="text-sm text-white/60 mb-4">10 afiliados × 20 vendas cada</p>
              <div className="space-y-2 text-sm text-white/70 mb-6">
                <p>200 × R$297,90 × 5%</p>
                <p>Comissão indireta</p>
              </div>
              <p className="text-3xl font-extrabold text-purple-400">+R$2.979<span className="text-xl">,00</span><span className="text-base text-white/50 font-normal">/mês</span></p>
              <p className="text-sm text-white/40 mt-1">extra, além do direto</p>
            </div>
          </div>

          {/* Total Combinado */}
          <div className="max-w-md mx-auto mt-8 bg-gradient-to-r from-green-500/10 to-purple-500/10 border border-white/10 rounded-2xl p-6 text-center">
            <p className="text-white/60 text-sm mb-1">Total Combinado Potencial</p>
            <p className="text-4xl md:text-5xl font-extrabold text-green-400">
              R$6.958<span className="text-2xl">,00</span><span className="text-lg text-white/50 font-normal">/mês</span>
            </p>
          </div>
        </section>
      </AnimatedSection>

      {/* Tabela de Planos */}
      <AnimatedSection>
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">
            Valores dos <span className="text-[#60A5FA]">Planos</span>
          </h2>
          <p className="text-white/50 text-center mb-10">Sua comissão é calculada sobre esses valores</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { nome: "Profissional", valor: "R$79,90", desc: "Corretor autônomo", cor: "border-[#60A5FA]/30" },
              { nome: "Pequena", valor: "R$297,90", desc: "Até 5 corretores", cor: "border-green-400/30" },
              { nome: "Média", valor: "R$497,90", desc: "Até 10 corretores", cor: "border-purple-500/30" },
            ].map((plano) => (
              <div key={plano.nome} className={`bg-white/5 backdrop-blur border ${plano.cor} rounded-2xl p-6 text-center`}>
                <p className="text-white/50 text-sm mb-1">{plano.desc}</p>
                <p className="text-lg font-bold text-white mb-1">{plano.nome}</p>
                <p className="text-2xl font-extrabold text-green-400">{plano.valor}<span className="text-sm text-white/50 font-normal">/mês</span></p>
              </div>
            ))}
          </div>
        </section>
      </AnimatedSection>

      {/* CTA Final */}
      <AnimatedSection>
        <section className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            COMECE AGORA — <span className="text-green-400">GRÁTIS!</span>
          </h2>
          <p className="text-white/60 max-w-lg mx-auto mb-8">
            Não precisa investir nada. Cadastre-se como afiliado, receba seu link exclusivo e comece a ganhar.
          </p>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white text-lg px-10 py-7 rounded-xl gap-3 shadow-lg shadow-green-500/20">
              <MessageCircle className="w-6 h-6" />
              Falar no WhatsApp
            </Button>
          </a>

          <div className="mt-12 flex flex-col items-center gap-3">
            <LogoIcon className="w-10 h-10" />
            <p className="text-white/40 text-sm">www.visitaprova.com.br</p>
          </div>
        </section>
      </AnimatedSection>
    </div>
  );
};

export default Afiliados;
