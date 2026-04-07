import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import AnimatedSection from "@/components/AnimatedSection";
import { LogoIcon } from "@/components/LogoIcon";
import { Button } from "@/components/ui/button";
import denisHero from "@/assets/DenisfotoBanner.png";
import denisPremios from "@/assets/denis-premios-remax.jpeg";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  ChevronRight,
  Clock,
  DollarSign,
  FileCheck,
  FileText,
  Gavel,
  Heart,
  Image,
  Landmark,
  MessageCircle,
  Mic,
  Phone,
  Quote,
  Scale,
  Shield,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Video,
  Zap,
} from "lucide-react";

/* ─── data ─── */

const timeline = [
  {
    year: "2019",
    title: "Início no Mercado Imobiliário",
    text: "Primeiros passos fazendo treinamentos para treinar franquiados e corretores REMAX .",
    icon: Briefcase,
  },
  {
    year: "2019",
    title: "Expansão REMAX",
    text: "Atuou na expansão de vendas da franquia REMAX, sendo parte do crescimento da marca no Brasil.",
    icon: TrendingUp,
  },
  {
    year: "2020",
    title: "Franqueado ",
    text: "Tornou-se franqueado REMAX , liderando equipes e formando novos corretores.",
    icon: Building2,
  },
  {
    year: "2021–2022",
    title: "Campeão de Vendas 2× consecutivas",
    text: "Como Corretor Reconhecido como campeão de vendas por dois anos seguidos, alcançando quase R$ 2 milhões em comissões.",
    icon: Trophy,
  },
  {
    year: "2023+",
    title: "Fundação da VIP7 Imóveis",
    text: "Fundou a VIP7 Imóveis, construindo sua própria operação e acumulando cerca de R$ 60 milhões em VGV.",
    icon: Star,
  },
];

const evidencias = [
  { icon: MessageCircle, label: "Conversas de WhatsApp" },
  { icon: Mic, label: "Áudios" },
  { icon: Phone, label: "Mensagens" },
  { icon: Video, label: "Vídeos" },
  { icon: Image, label: "Fotos" },
  { icon: FileText, label: "Materiais de divulgação" },
  { icon: BookOpen, label: "Registros de atendimento" },
  { icon: FileCheck, label: "Documentos" },
  { icon: Landmark, label: "Ata em cartório" },
  { icon: Gavel, label: "Advogado" },
  { icon: DollarSign, label: "Custos processuais" },
  { icon: Clock, label: "Tempo" },
  { icon: Heart, label: "Energia emocional" },
];

const storySteps = [
  {
    text: "Era um imóvel de aproximadamente R$ 4,5 milhões. O proprietário tinha urgência na venda.",
  },
  {
    text: "Eu fiz a captação, estruturei o trabalho comercial e, depois de muito esforço, encontrei uma compradora interessada.",
  },
  {
    text: "Durante quase um ano, acompanhei cada etapa da negociação de perto. Conduzi comprador e vendedor com dedicação, atenção e constância.",
  },
  {
    text: "Tudo parecia caminhar com confiança, respeito e boa-fé.",
  },
  {
    text: "Até que, de repente, os dois lados simplesmente pararam de responder.",
  },
  {
    text: "Depois veio o bloqueio. Sem explicações. Sem retorno. Sem consideração.",
  },
  {
    text: "Naquele momento, ficou claro que, depois de quase um ano de trabalho, eu havia sido passado para trás.",
  },
];

/* ─── component ─── */

const Denis = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Denis Souza | Fundador do VisitaProva"
        description="Conheça Denis Souza — corretor de imóveis, fundador do VisitaProva e a história real que originou a solução que está transformando o mercado imobiliário."
        keywords="Denis Souza, VisitaProva, corretor de imóveis, VIP7 Imóveis"
      />

      {/* ── Header ── */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <LogoIcon size={24} />
            <span className="font-heading text-lg font-bold">VisitaProva</span>
          </div>
          <div className="w-20" />
        </div>
      </header>

      <main>
        {/* ═══════════════════════════════════════
            1. HERO
        ═══════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 py-20 md:py-28 lg:py-32">
          {/* decorative blobs */}
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16 max-w-5xl mx-auto">
              {/* photo */}
              <AnimatedSection direction="left" className="shrink-0">
                <div className="relative">
                  <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-2xl scale-95" />
                  <img
                    src={denisHero}
                    alt="Denis Souza — Fundador do VisitaProva"
                    className="relative w-56 h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 rounded-2xl object-cover shadow-lg border-2 border-primary/10"
                  />
                </div>
              </AnimatedSection>

              {/* text */}
              <AnimatedSection direction="right" className="text-center md:text-left">
                <p className="text-primary font-semibold tracking-wide uppercase text-sm mb-2">Fundador do VisitaProva</p>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold leading-tight mb-4">
                  Denis Souza
                </h1>
                <p className="text-muted-foreground text-lg md:text-xl max-w-lg leading-relaxed mb-6">
                  Corretor de imóveis, proprietário da <strong className="text-foreground">VIP7 Imóveis</strong> e criador da solução que está transformando a forma como o mercado registra e protege suas visitas.
                </p>

                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  {[
                    { icon: Calendar, label: "8 anos de mercado" },
                    { icon: TrendingUp, label: "R$ 60M+ em VGV" },
                    { icon: Building2, label: "VIP7 Imóveis" },
                  ].map((b) => (
                    <span
                      key={b.label}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border text-sm font-medium"
                    >
                      <b.icon className="h-4 w-4 text-primary" />
                      {b.label}
                    </span>
                  ))}
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            2. MINHA TRAJETÓRIA
        ═══════════════════════════════════════ */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4 max-w-4xl">
            <AnimatedSection className="text-center mb-14">
              <p className="text-primary font-semibold text-sm tracking-wide uppercase mb-2">Trajetória</p>
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                Minha <span className="text-primary">história</span> no mercado
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Meu nome é Denis Souza e atuo há 8 anos no mercado imobiliário. Sou corretor de imóveis e também proprietário da VIP7 Imóveis. Ao longo da minha trajetória, participei de negociações que somam cerca de R$ 60 milhões em VGV.
              </p>
            </AnimatedSection>

            {/* timeline */}
            <div className="relative">
              {/* vertical line */}
              <div className="absolute left-5 md:left-1/2 top-0 bottom-0 w-px bg-border md:-translate-x-px" />

              {timeline.map((item, i) => {
                const isLeft = i % 2 === 0;
                return (
                  <AnimatedSection
                    key={item.year}
                    delay={i * 120}
                    direction={isLeft ? "left" : "right"}
                    className="relative mb-12 last:mb-0"
                  >
                    <div
                      className={`flex flex-col md:flex-row items-start md:items-center gap-4 ${
                        isLeft ? "md:flex-row-reverse md:text-right" : ""
                      }`}
                    >
                      {/* dot */}
                      <div className="absolute left-5 md:left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center z-10">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>

                      {/* card */}
                      <div
                        className={`ml-16 md:ml-0 md:w-[calc(50%-2.5rem)] ${
                          isLeft ? "md:mr-auto md:pr-6" : "md:ml-auto md:pl-6"
                        }`}
                      >
                        <span className="text-primary font-bold text-sm">{item.year}</span>
                        <h3 className="font-heading font-semibold text-lg mt-1 mb-1">{item.title}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">{item.text}</p>
                      </div>
                    </div>
                  </AnimatedSection>
                );
              })}
            </div>

            {/* highlight card */}
            <AnimatedSection delay={600} className="mt-14">
              <div className="flex flex-col sm:flex-row items-center gap-6 bg-card border rounded-2xl p-6 md:p-8">
                <img
                   src={denisPremios}
                   alt="Denis Souza com troféus e certificados REMAX"
                   className="w-28 h-28 rounded-xl object-cover border border-primary/10"
                />
                <div>
                  <p className="text-muted-foreground leading-relaxed">
                    Minha história no mercado começou com muita intensidade. Atuei na expansão de vendas da franquia REMAX, fui franqueado REMAX, corretor REMAX e Team Leader. Nesse período, fui <strong className="text-foreground">campeão de vendas por dois anos consecutivos</strong> e alcancei quase <strong className="text-primary">R$ 2 milhões em comissões</strong>.
                  </p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            3. A DOR QUE O MERCADO NÃO VÊ
        ═══════════════════════════════════════ */}
        <section className="py-20 md:py-28 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <AnimatedSection className="text-center mb-12">
              <p className="text-primary font-semibold text-sm tracking-wide uppercase mb-2">Realidade</p>
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                A dor que o mercado <span className="text-primary">não vê</span>
              </h2>
            </AnimatedSection>

            <AnimatedSection delay={150}>
              <div className="space-y-6 max-w-3xl mx-auto">
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Mas, junto com os resultados, veio também uma dor que muitos corretores conhecem bem: a falta de um processo realmente seguro na hora da visita e da negociação.
                </p>

                <div className="bg-card border rounded-xl p-6">
                  <p className="text-muted-foreground leading-relaxed">
                    Durante esses anos, vivi situações difíceis, desgastantes e injustas. Em algumas negociações, <strong className="text-foreground">tentaram me passar para trás</strong>. Em outras, <strong className="text-foreground">conseguiram</strong>. E em várias, talvez eu nunca nem tenha descoberto.
                  </p>
                </div>

                <div className="bg-card border border-primary/20 rounded-xl p-6 text-center">
                  <p className="text-foreground text-xl md:text-2xl font-heading font-bold leading-snug">
                    A maior dessas dores foi perder uma comissão de mais de{" "}
                    <span className="text-primary">R$ 200 mil</span>.
                  </p>
                </div>
              </div>
            </AnimatedSection>

            {/* big quote */}
            <AnimatedSection delay={300} className="mt-14">
              <div className="relative bg-primary text-primary-foreground rounded-2xl p-8 md:p-12 text-center overflow-hidden">
                <Quote className="absolute top-4 left-4 h-16 w-16 opacity-10" />
                <p className="relative text-2xl md:text-3xl font-heading font-bold leading-snug max-w-2xl mx-auto">
                  "Não basta trabalhar duro. É preciso ter como provar."
                </p>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            4. A HISTÓRIA QUE DEU ORIGEM AO VP
        ═══════════════════════════════════════ */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4 max-w-4xl">
            <AnimatedSection className="text-center mb-14">
              <p className="text-primary font-semibold text-sm tracking-wide uppercase mb-2">Origem</p>
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                A história que deu origem ao <span className="text-primary">Visita Prova</span>
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Depois de quase um ano inteiro conduzindo uma negociação, fui passado para trás.
              </p>
            </AnimatedSection>

            <div className="space-y-6 max-w-3xl mx-auto">
              {storySteps.map((step, i) => {
                const isHighlight = i >= 4;
                return (
                  <AnimatedSection key={i} delay={i * 100}>
                    <div
                      className={`flex items-start gap-4 rounded-xl p-5 transition-colors ${
                        isHighlight
                          ? "bg-destructive/5 border border-destructive/20"
                          : "bg-card border"
                      }`}
                    >
                      <div
                        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          isHighlight
                            ? "bg-destructive/10 text-destructive"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <p
                        className={`leading-relaxed ${
                          isHighlight ? "text-foreground font-medium" : "text-muted-foreground"
                        }`}
                      >
                        {step.text}
                      </p>
                    </div>
                  </AnimatedSection>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            5. NÃO FOI SÓ UMA COMISSÃO PERDIDA
        ═══════════════════════════════════════ */}
        <section className="py-20 md:py-28 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <AnimatedSection className="text-center mb-12">
              <p className="text-primary font-semibold text-sm tracking-wide uppercase mb-2">Impacto</p>
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                Não foi só uma <span className="text-primary">comissão perdida</span>
              </h2>
            </AnimatedSection>

            <AnimatedSection delay={100}>
              <div className="bg-card border rounded-xl p-6 md:p-8 max-w-3xl mx-auto mb-10">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  A comissão era de mais de <strong className="text-primary">R$ 200 mil</strong>. Mas o prejuízo não foi apenas financeiro.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Foi um impacto <strong className="text-foreground">emocional, psicológico e profissional</strong>.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Depois de dedicar tanto tempo, energia e expectativa a uma negociação, perceber que todo aquele trabalho tinha sido ignorado gera uma frustração profunda.
                </p>
                <p className="text-foreground font-medium leading-relaxed">
                  É uma dor que não machuca só o bolso. Machuca a motivação, a confiança e o respeito pelo próprio trabalho.
                </p>
              </div>
            </AnimatedSection>

            {/* stats */}
            <AnimatedSection delay={250}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
                {[
                  { value: "1 ano", label: "de negociação dedicada", icon: Calendar },
                  { value: "R$ 20 mil+", label: "em custos de processo", icon: Scale },
                  { value: "~3 anos", label: "sem receber", icon: Clock },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="bg-card border rounded-xl p-6 text-center"
                  >
                    <s.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                    <p className="text-primary font-bold text-2xl font-heading">{s.value}</p>
                    <p className="text-muted-foreground text-sm mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            6. O PROBLEMA NÃO ACABOU ALI
        ═══════════════════════════════════════ */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4 max-w-4xl">
            <AnimatedSection className="text-center mb-12">
              <p className="text-primary font-semibold text-sm tracking-wide uppercase mb-2">Desafio</p>
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                E o problema <span className="text-primary">não acabou ali</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Perder a comissão foi apenas o começo. Depois disso, começou outra batalha: provar que o trabalho tinha sido feito.
              </p>
            </AnimatedSection>

            {/* evidence grid */}
            <AnimatedSection delay={150}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-10">
                {evidencias.map((e) => (
                  <div
                    key={e.label}
                    className="bg-card border rounded-xl p-4 flex flex-col items-center text-center gap-2 hover:border-primary/30 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <e.icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground leading-tight">{e.label}</span>
                  </div>
                ))}
              </div>
            </AnimatedSection>

            <AnimatedSection delay={300}>
              <div className="bg-card border border-primary/20 rounded-2xl p-6 md:p-8 max-w-3xl mx-auto text-center space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Investi mais de <strong className="text-primary">R$ 20 mil</strong> no processo.
                </p>
                <p className="text-foreground font-semibold text-lg">
                  Ganhei a ação principal.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  E mesmo assim, <strong className="text-foreground">até hoje ainda não recebi</strong>.
                </p>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            7. MANIFESTO — FOI POR ISSO QUE O VP NASCEU
        ═══════════════════════════════════════ */}
        <section className="py-20 md:py-28 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <AnimatedSection className="text-center mb-12">
              <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                Foi por isso que o <span className="text-primary">Visita Prova</span> nasceu
              </h2>
            </AnimatedSection>

            <AnimatedSection delay={150}>
              <div className="space-y-6 max-w-3xl mx-auto">
                {[
                  "Foi dessa experiência real, dura e vivida na prática que nasceu o Visita Prova.",
                  "O Visita Prova nasceu para que outros corretores não precisem passar pelo que eu passei.",
                  "Nasceu da dor real de quem vive o mercado na prática.",
                  "Nasceu da necessidade de gerar mais segurança, mais respeito e mais proteção para o corretor.",
                  "Nasceu para transformar visitas, atendimentos e negociações em provas organizadas, claras e profissionalmente registradas.",
                ].map((text, i) => (
                  <AnimatedSection key={i} delay={200 + i * 80}>
                    <div className="flex items-start gap-4">
                      <ChevronRight className="h-5 w-5 text-primary mt-1 shrink-0" />
                      <p className="text-muted-foreground text-lg leading-relaxed">{text}</p>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </AnimatedSection>

            {/* manifesto quote */}
            <AnimatedSection delay={700} className="mt-14">
              <div className="relative bg-primary text-primary-foreground rounded-2xl p-10 md:p-14 text-center overflow-hidden">
                <Quote className="absolute top-4 left-4 h-20 w-20 opacity-10" />
                <Quote className="absolute bottom-4 right-4 h-20 w-20 opacity-10 rotate-180" />
                <p className="relative text-xl md:text-2xl leading-relaxed max-w-2xl mx-auto mb-4">
                  Porque não basta trabalhar duro.
                </p>
                <p className="relative text-3xl md:text-4xl font-heading font-bold max-w-2xl mx-auto">
                  É preciso ter como provar.
                </p>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            8. CTA FINAL
        ═══════════════════════════════════════ */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <AnimatedSection>
              <div className="mb-8">
                <img
                  src={denisPremios}
                  alt="Denis Souza"
                  className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-primary/10 shadow-lg mb-6"
                />
                <h2 className="text-2xl md:text-3xl font-heading font-bold mb-4">
                  Construído por quem vive o mercado na prática
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed max-w-xl mx-auto">
                  Se você é corretor, gestor ou dono de imobiliária e quer elevar o padrão da sua operação, eu convido você a conhecer o Visita Prova. Uma solução nascida da experiência real, construída com propósito e pensada para quem leva o mercado imobiliário a sério.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" asChild className="text-base">
                  <Link to="/como-funciona">
                    Conhecer o Visita Prova
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-base">
                  <a
                    href="https://wa.me/5511999999999?text=Olá%20Denis,%20vim%20pelo%20seu%20site%20e%20gostaria%20de%20saber%20mais%20sobre%20o%20Visita%20Prova."
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Falar com Denis
                  </a>
                </Button>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* ── Footer ── */}
        <div className="border-t border-border py-10">
          <div className="container mx-auto px-4 text-center">
            <div className="flex flex-col items-center gap-3">
              <LogoIcon size={32} />
              <p className="text-muted-foreground text-sm">www.visitaprova.com.br</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Denis;
