import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import ceoPhoto from "@/assets/ceo-photo.png";
import AnimatedSection from "@/components/AnimatedSection";
import { LogoIcon } from "@/components/LogoIcon";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Building,
  CheckCircle2,
  Eye,
  Heart,
  Shield,
  Target,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";

const beneficios = [
  {
    icon: Award,
    titulo: "Mais profissionalismo",
    texto: "O corretor deixa para trás um processo antigo e passa a atuar com mais postura, mais formalidade e mais valor percebido diante do cliente.",
  },
  {
    icon: TrendingUp,
    titulo: "Mais organização",
    texto: "A imobiliária e o corretor ganham padronização, controle e mais clareza sobre o processo de visita.",
  },
  {
    icon: Shield,
    titulo: "Mais proteção operacional",
    texto: "A visita passa a ter um registro mais robusto, com mais rastreabilidade e melhores condições de comprovação da intermediação.",
  },
  {
    icon: Eye,
    titulo: "Mais prevenção de problemas",
    texto: "Quando existe formalização, compromisso e registro, as pessoas passam a pensar de forma diferente. O Visita Prova ajuda a evitar que o problema aconteça.",
  },
];

const crencas = [
  "A visita imobiliária não pode continuar sendo um ponto frágil dentro de uma operação tão importante.",
  "O corretor merece mais proteção, mais organização e mais reconhecimento pelo seu trabalho.",
  "A imobiliária precisa de processos mais sólidos, mais auditáveis e mais profissionais.",
  "A tecnologia deve servir para melhorar a prática real do mercado, reduzindo vulnerabilidades e elevando o padrão da operação comercial.",
];

const SobreNos = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Sobre Nós | VisitaProva"
        description="Conheça a história do VisitaProva: nascido da experiência real do mercado imobiliário para transformar a visita em um processo mais profissional, organizado e protegido."
      />

      {/* Header */}
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

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero institucional */}
        <AnimatedSection className="text-center mb-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-6 leading-tight">
            O Visita Prova nasceu para transformar a visita imobiliária em um processo mais{" "}
            <span className="text-primary">profissional, organizado e protegido</span>.
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Nascido da experiência real de quem vive o mercado imobiliário na prática, 
            transformamos essa dor em uma solução especializada para corretores e imobiliárias.
          </p>
        </AnimatedSection>

        {/* História real */}
        <AnimatedSection delay={150} className="mb-16">
          <div className="bg-muted/30 rounded-2xl p-8 md:p-12">
            <div className="flex items-center gap-2 mb-6">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-heading font-bold">Nossa História</h2>
            </div>

            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <p>
                Antes de criar a solução, eu já atuava como corretor e dono de imobiliária. 
                Vivi na prática os desafios, os riscos e a vulnerabilidade que muitos profissionais 
                enfrentam todos os dias no momento da visita e da intermediação.
              </p>

              <div className="border-l-4 border-primary pl-6 py-2">
                <p className="text-foreground font-medium text-lg">
                  Em uma dessas situações, acompanhei um cliente por quase um ano. No fim, ele fechou 
                  diretamente com o proprietário e eu perdi uma comissão de mais de{" "}
                  <span className="text-primary font-bold text-2xl">R$ 240 mil</span>.
                </p>
              </div>

              <p>
                Entrei na Justiça para buscar meus direitos, mas provar a intermediação foi extremamente 
                difícil. Precisei reunir prints de WhatsApp, áudios, documentos e até fazer ata notarial 
                para sustentar o processo.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
                <div className="bg-card border rounded-xl p-4 text-center">
                  <p className="text-primary font-bold text-2xl font-heading">3+ anos</p>
                  <p className="text-sm text-muted-foreground">de processo judicial</p>
                </div>
                <div className="bg-card border rounded-xl p-4 text-center">
                  <p className="text-primary font-bold text-2xl font-heading">R$ 20 mil+</p>
                  <p className="text-sm text-muted-foreground">gastos com o processo</p>
                </div>
                <div className="bg-card border rounded-xl p-4 text-center">
                  <p className="text-primary font-bold text-2xl font-heading">R$ 240 mil</p>
                  <p className="text-sm text-muted-foreground">de comissão perdida</p>
                </div>
              </div>

              <p>
                Foi algo pesado emocionalmente, desgastante financeiramente e muito frustrante. 
                Mesmo tendo vencido a ação, depois de mais de três anos, ainda não recebi.
              </p>

              <div className="border-l-4 border-primary pl-6 py-2">
                <p className="text-foreground font-semibold text-lg">
                  Foi dessa dor que nasceu o Visita Prova.
                </p>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Palavras do CEO */}
        <AnimatedSection delay={175} className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 items-center">
            <div className="flex justify-center md:justify-start">
              <img
                src={ceoPhoto}
                alt="Foto do CEO do VisitaProva"
                className="w-64 h-64 md:w-[280px] md:h-[280px] rounded-2xl object-cover shadow-lg border-2 border-primary/10"
              />
            </div>
            <div>
              <div className="border-l-4 border-primary pl-6">
                <p className="text-lg md:text-xl italic text-muted-foreground leading-relaxed">
                  "O Visita Prova nasceu de uma dor real que eu enfrentei no mercado imobiliário. 
                  Desde então, meu objetivo passou a ser claro: ajudar o corretor de imóveis a ser 
                  mais respeitado, elevando o nível de profissionalismo da operação e educando 
                  compradores, vendedores e profissionais sobre o valor da intermediação."
                </p>
                <p className="mt-4 font-heading font-semibold text-foreground">
                  — Fundador & CEO
                </p>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Por que existimos */}
        <AnimatedSection delay={225} className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-heading font-bold mb-4">
              Por que <span className="text-primary">existimos</span>
            </h2>
          </div>
          <div className="bg-card border rounded-xl p-8 text-center">
            <Target className="h-10 w-10 text-primary mx-auto mb-4" />
            <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Durante muito tempo, a visita imobiliária foi tratada de forma informal, desorganizada e vulnerável. 
              Em muitos casos, ainda é feita com ficha em papel, pouca padronização, baixa rastreabilidade e um 
              processo fraco para um momento que é extremamente sensível na jornada de compra e venda.{" "}
              <strong className="text-foreground">Nós acreditamos que isso precisa mudar.</strong>
            </p>
            <p className="text-primary font-semibold mt-4">
              O Visita Prova existe para profissionalizar esse momento.
            </p>
          </div>
        </AnimatedSection>

        {/* O que faz de verdade */}
        <AnimatedSection delay={250} className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-heading font-bold mb-4">
              O que o Visita Prova faz <span className="text-primary">de verdade</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Mais do que uma ficha digital, é uma solução criada para fortalecer a operação comercial no momento da visita.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {beneficios.map((item) => (
              <div key={item.titulo} className="bg-card border rounded-xl p-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{item.titulo}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.texto}</p>
              </div>
            ))}
          </div>
        </AnimatedSection>

        {/* Nossa visão */}
        <AnimatedSection delay={300} className="mb-16">
          <div className="bg-muted/30 rounded-2xl p-8 md:p-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-heading font-bold mb-4">
                Nossa <span className="text-primary">visão</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Queremos ajudar a educar todas as partes envolvidas na venda imobiliária.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCheck className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold">O Corretor</h3>
                <p className="text-muted-foreground text-sm">
                  Para atuar com mais profissionalismo e proteção.
                </p>
              </div>
              <div className="flex flex-col items-center text-center gap-3">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold">A Imobiliária</h3>
                <p className="text-muted-foreground text-sm">
                  Para operar com mais padrão e mais controle.
                </p>
              </div>
              <div className="flex flex-col items-center text-center gap-3">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold">Comprador e Vendedor</h3>
                <p className="text-muted-foreground text-sm">
                  Para compreenderem melhor o compromisso assumido e respeitarem o trabalho de intermediação.
                </p>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* O que acreditamos */}
        <AnimatedSection delay={350} className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-heading font-bold mb-4">
              O que <span className="text-primary">acreditamos</span>
            </h2>
          </div>
          <div className="space-y-4">
            {crencas.map((crenca, index) => (
              <div key={index} className="flex gap-4 items-start bg-card border rounded-xl p-5">
                <Heart className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <p className="text-muted-foreground leading-relaxed">{crenca}</p>
              </div>
            ))}
          </div>
        </AnimatedSection>

        {/* Missão e CTA */}
        <AnimatedSection delay={400} className="mb-16">
          <div className="bg-primary text-primary-foreground rounded-2xl p-8 md:p-12 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-6 opacity-90" />
            <h2 className="text-2xl md:text-3xl font-heading font-bold mb-4">
              Nossa Missão
            </h2>
            <p className="opacity-90 max-w-2xl mx-auto mb-8 leading-relaxed">
              Fortalecer a visita imobiliária como um processo mais profissional, rastreável, 
              organizado e respeitado no mercado imobiliário brasileiro. Mais do que digitalizar 
              uma ficha, queremos ajudar a mudar a cultura da visita imobiliária no Brasil.
            </p>
            <Button size="lg" variant="secondary" className="text-base" asChild>
              <Link to="/registro-autonomo?plano=gratuito">
                Testar Grátis Agora
              </Link>
            </Button>
          </div>
        </AnimatedSection>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-border">
          <div className="flex flex-col items-center gap-3">
            <LogoIcon size={32} />
            <p className="text-muted-foreground text-sm">www.visitaprova.com.br</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SobreNos;
