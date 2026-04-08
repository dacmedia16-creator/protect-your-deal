import { Link } from 'react-router-dom';
import denisPhoto from '@/assets/DenisfotoBanner.png';
import { SEOHead } from '@/components/SEOHead';
import AnimatedSection from '@/components/AnimatedSection';
import { LogoIcon } from '@/components/LogoIcon';
import { Button } from '@/components/ui/button';
import { DepoimentosSection } from '@/components/DepoimentosSection';
import { WhatsAppFAB } from '@/components/WhatsAppFAB';
import {
  Shield, Clock, FileText, MessageSquare, Mic, Camera, Video,
  Scale, Landmark, DollarSign, CheckCircle2, XCircle, ArrowRight, ArrowLeft,
  Quote, Zap, Users, Lock, Eye, Heart, ChevronRight, Award,
  AlertTriangle, Ban, CreditCard, Gavel, Instagram, Linkedin,
  Mail, Phone, MapPin, Star
} from 'lucide-react';

/* ─── Authority Stats Block ─── */
function AuthorityBlock() {
  const stats = [
    { value: '+R$ 200 mil', label: 'em comissão perdida', icon: DollarSign },
    { value: '+R$ 20 mil', label: 'em custos do processo', icon: Scale },
    { value: '~1 ano', label: 'de negociação', icon: Clock },
    { value: '~3 anos', label: 'sem receber', icon: AlertTriangle },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4">
      {stats.map((s, i) => (
        <AnimatedSection key={i} delay={200 + i * 100}>
          <div className="glass rounded-xl p-4 md:p-5 text-center border border-border/60 hover:border-primary/30 transition-colors">
            <s.icon className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-lg md:text-xl font-display font-bold text-foreground">{s.value}</p>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">{s.label}</p>
          </div>
        </AnimatedSection>
      ))}
    </div>
  );
}

/* ─── Timeline Item ─── */
function TimelineItem({ number, text, delay = 0 }: { number: number; text: string; delay?: number }) {
  return (
    <AnimatedSection delay={delay} direction="left">
      <div className="flex gap-4 items-start">
        <div className="flex-shrink-0 h-9 w-9 rounded-full bg-primary/10 text-primary font-display font-bold text-sm flex items-center justify-center border border-primary/20">
          {number}
        </div>
        <p className="text-muted-foreground leading-relaxed pt-1.5">{text}</p>
      </div>
    </AnimatedSection>
  );
}

/* ─── Comparison Column ─── */
function ComparisonColumn({ title, items, variant }: {
  title: string;
  items: string[];
  variant: 'negative' | 'positive';
}) {
  const isPositive = variant === 'positive';
  return (
    <div className={`rounded-2xl p-6 md:p-8 border ${isPositive ? 'border-success/30 bg-success/5' : 'border-destructive/20 bg-destructive/5'}`}>
      <h4 className={`font-display font-bold text-lg mb-6 ${isPositive ? 'text-success' : 'text-destructive'}`}>
        {title}
      </h4>
      <ul className="space-y-4">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            {isPositive
              ? <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
              : <XCircle className="h-5 w-5 text-destructive/70 flex-shrink-0 mt-0.5" />
            }
            <span className="text-foreground/80 text-sm leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── Benefit Card ─── */
function BenefitCard({ icon: Icon, title, description, delay = 0 }: {
  icon: React.ElementType; title: string; description: string; delay?: number;
}) {
  return (
    <AnimatedSection delay={delay}>
      <div className="glass rounded-xl p-6 border border-border/60 hover:border-primary/30 hover:shadow-medium transition-all group h-full">
        <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
          <Icon className="h-5 w-5" />
        </div>
        <h4 className="font-display font-semibold text-foreground mb-2">{title}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </AnimatedSection>
  );
}

/* ─── Injustice Card ─── */
function InjusticeCard({ icon: Icon, text, delay = 0 }: {
  icon: React.ElementType; text: string; delay?: number;
}) {
  return (
    <AnimatedSection delay={delay}>
      <div className="glass rounded-xl p-5 border border-border/60 text-center">
        <Icon className="h-6 w-6 text-warning mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground">{text}</p>
      </div>
    </AnimatedSection>
  );
}

/* ─── Evidence Item ─── */
function EvidenceItem({ icon: Icon, label, delay = 0 }: {
  icon: React.ElementType; label: string; delay?: number;
}) {
  return (
    <AnimatedSection delay={delay}>
      <div className="flex flex-col items-center gap-2 p-4">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <span className="text-xs text-muted-foreground text-center">{label}</span>
      </div>
    </AnimatedSection>
  );
}

/* ─── Main Page ─── */
export default function NossaHistoria() {
  return (
    <>
      <SEOHead
        title="Nossa História | Visita Prova — Nascido de uma dor real"
        description="Conheça a história por trás do Visita Prova: um corretor que perdeu mais de R$ 200 mil em comissão e criou a ferramenta que faltava no mercado imobiliário."
        keywords="visita prova história, corretor imobiliário, comissão perdida, registro de visita, proteção corretor"
      />
      <WhatsAppFAB />

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

      {/* ═══════════════════ 1. HERO ═══════════════════ */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background accent */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/30" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

        <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left – Copy */}
            <div className="max-w-xl">
              <AnimatedSection>
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                  <Shield className="h-4 w-4" />
                  Uma história real do mercado imobiliário
                </span>
              </AnimatedSection>

              <AnimatedSection delay={100}>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-display font-bold leading-[1.15] tracking-tight text-foreground mb-6">
                  Perdi uma comissão de mais de{' '}
                  <span className="text-primary">R$ 200 mil.</span>{' '}
                  Foi dessa dor real do mercado que nasceu o Visita Prova.
                </h1>
              </AnimatedSection>

              <AnimatedSection delay={200}>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-8">
                  Depois de quase um ano conduzindo uma negociação, fui passado para trás,
                  enfrentei um processo longo, investi mais de R$ 20 mil para provar meu trabalho
                  e, mesmo ganhando a ação principal, ainda não recebi. O Visita Prova nasceu
                  para que outros corretores não precisem passar por isso.
                </p>
              </AnimatedSection>

              <AnimatedSection delay={300}>
                <div className="flex flex-col sm:flex-row gap-3 mb-10">
                  <Button size="lg" asChild className="text-base">
                    <Link to="/registro-autonomo">
                      Quero proteger minhas visitas
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="text-base">
                    <Link to="/como-funciona">Entender como funciona</Link>
                  </Button>
                </div>
              </AnimatedSection>

              {/* Founder signature block */}
              <AnimatedSection delay={400}>
                <div className="flex items-center gap-4">
                  <Link to="/denis">
                    <img
                      src={denisPhoto}
                      alt="Denis Souza"
                      className="h-14 w-14 rounded-full object-cover border-2 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer"
                    />
                  </Link>
                  <div className="text-left">
                    <Link to="/denis" className="font-display font-bold text-foreground text-sm hover:text-primary transition-colors">Denis Souza</Link>
                    <p className="text-xs text-muted-foreground">Fundador do Visita Prova | Corretor de imóveis</p>
                    <p className="text-xs text-muted-foreground/80 italic mt-1">"Eu criei o Visita Prova porque vivi na pele o que muitos corretores têm medo de viver."</p>
                  </div>
                </div>
              </AnimatedSection>
            </div>

            {/* Right – Authority Stats */}
            <div className="lg:pl-8">
              <AuthorityBlock />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ 2. FUNDADOR ═══════════════════ */}
      <section className="py-20 md:py-28 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
            {/* Photo - appears first on mobile */}
            <AnimatedSection direction="right" className="order-first md:order-last">
              <div className="flex flex-col items-center">
                <div className="rounded-2xl overflow-hidden shadow-lg border border-border/30">
                  <Link to="/denis">
                    <img
                      src={denisPhoto}
                      alt="Denis — Fundador do Visita Prova"
                      className="w-full h-auto object-cover hover:opacity-90 transition-opacity cursor-pointer"
                      loading="lazy"
                    />
                  </Link>
                </div>
                <div className="mt-4 text-center">
                  <p className="font-display font-bold text-foreground">Denis Souza</p>
                  <p className="text-sm text-muted-foreground">Fundador &amp; CEO · Corretor de Imóveis</p>
                </div>
              </div>
            </AnimatedSection>

            {/* Text */}
            <div>
              <AnimatedSection>
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                  <Heart className="h-4 w-4" />
                  O Fundador
                </span>
              </AnimatedSection>

              <AnimatedSection delay={100}>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-foreground mb-8">
                  Essa não é uma história criada para vender software.{' '}
                  <span className="text-primary">É a origem real do Visita Prova.</span>
                </h2>
              </AnimatedSection>

              <AnimatedSection delay={200}>
                <div className="relative">
                  <Quote className="absolute -top-2 -left-2 h-10 w-10 text-primary/15" />
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed pl-8 md:pl-10">
                    Eu sou corretor de imóveis. O Visita Prova não nasceu de teoria. Nasceu de uma
                    dor real, de uma frustração real e de um problema que milhares de corretores
                    conhecem muito bem: trabalhar durante meses, aproximar comprador e vendedor,
                    conduzir uma negociação e, no final, ser deixado de fora do fechamento.
                  </p>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={300}>
                <div className="mt-10 bg-primary/5 border border-primary/20 rounded-2xl p-8">
                  <p className="text-2xl md:text-3xl font-display font-bold text-foreground italic leading-snug">
                    "Eu não criei o Visita Prova por ideia.{' '}
                    <span className="text-primary">Eu criei por necessidade.</span>"
                  </p>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ 3. TIMELINE ═══════════════════ */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <AnimatedSection>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-foreground mb-4">
                Tudo começou com um imóvel de aproximadamente{' '}
                <span className="text-primary">R$ 4,5 milhões.</span>
              </h2>
              <p className="text-muted-foreground mb-12">
                A história completa, contada na ordem em que aconteceu.
              </p>
            </AnimatedSection>

            <div className="space-y-6 border-l-2 border-border/60 pl-6 ml-4">
              <TimelineItem number={1} text="O proprietário tinha urgência na venda do imóvel." delay={100} />
              <TimelineItem number={2} text="Eu fiz a captação e comecei todo o trabalho comercial." delay={150} />
              <TimelineItem number={3} text="Depois de muito esforço, encontrei uma compradora interessada." delay={200} />
              <TimelineItem number={4} text="Durante quase um ano, acompanhei a negociação de perto." delay={250} />
              <TimelineItem number={5} text="Conduzi comprador e vendedor com dedicação constante durante todo o processo." delay={300} />
              <TimelineItem number={6} text="Tudo parecia indicar confiança, respeito e boa-fé." delay={350} />
              <TimelineItem number={7} text="Até que comprador e vendedor simplesmente pararam de responder." delay={400} />
              <TimelineItem number={8} text="Depois veio o bloqueio. Sem explicações, sem retorno." delay={450} />
              <TimelineItem number={9} text="Foi aí que ficou claro: depois de quase um ano de trabalho, eu tinha sido passado para trás." delay={500} />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ 4. DOR / IMPACTO ═══════════════════ */}
      <section className="py-20 md:py-28 bg-foreground/[0.03]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <AnimatedSection>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-foreground mb-6">
                Não foi só uma comissão perdida.<br />
                <span className="text-primary">Foi um abalo enorme.</span>
              </h2>
            </AnimatedSection>

            <AnimatedSection delay={100}>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto">
                A comissão era de mais de R$ 200 mil. Mas o prejuízo não foi apenas financeiro.
                Foi psicológico, emocional e profissional. Depois de quase um ano trabalhando a
                negociação, perceber que todo aquele esforço tinha sido ignorado gerou uma
                frustração muito forte.
              </p>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <div className="bg-card border border-border/60 border-l-4 border-l-primary rounded-2xl p-10 md:p-14 shadow-soft">
                <p className="text-2xl md:text-3xl font-display font-bold text-foreground leading-snug italic">
                  "É uma dor que machuca não só o bolso.{' '}
                  <span className="text-primary">Machuca a motivação, a confiança e o
                  respeito pelo próprio trabalho.</span>"
                </p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ═══════════════════ 5. A BATALHA PARA PROVAR ═══════════════════ */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <AnimatedSection>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-foreground mb-2">
                O problema não terminou quando a comissão foi perdida.
              </h2>
              <p className="text-lg md:text-xl text-primary font-display font-semibold mb-10">
                Foi aí que começou outra batalha: provar.
              </p>
            </AnimatedSection>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              <EvidenceItem icon={MessageSquare} label="Conversas de WhatsApp" delay={100} />
              <EvidenceItem icon={Mic} label="Áudios" delay={150} />
              <EvidenceItem icon={FileText} label="Mensagens" delay={200} />
              <EvidenceItem icon={Video} label="Vídeos" delay={250} />
              <EvidenceItem icon={Camera} label="Fotos" delay={300} />
              <EvidenceItem icon={Eye} label="Materiais de divulgação" delay={350} />
              <EvidenceItem icon={Users} label="Registros de atendimento" delay={400} />
              <EvidenceItem icon={FileText} label="Documentos" delay={450} />
              <EvidenceItem icon={Landmark} label="Ata em cartório" delay={500} />
              <EvidenceItem icon={Gavel} label="Advogado" delay={550} />
              <EvidenceItem icon={DollarSign} label="Custos do processo" delay={600} />
              <EvidenceItem icon={Clock} label="Tempo investido" delay={650} />
            </div>

            <AnimatedSection delay={700}>
              <div className="mt-10 bg-card border border-border/60 rounded-2xl p-8 md:p-10 text-center shadow-soft">
                <p className="text-xl md:text-2xl lg:text-3xl font-display font-bold text-foreground leading-snug">
                  "Não bastava ter trabalhado.{' '}
                  <span className="text-primary">Era preciso provar que o trabalho existiu.</span>"
                </p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ═══════════════════ 6. INJUSTIÇA DO PROCESSO ═══════════════════ */}
      <section className="py-20 md:py-28 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <AnimatedSection>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-foreground mb-4">
                Ganhar a ação não significou paz.
              </h2>
              <p className="text-xl md:text-2xl font-display font-bold text-primary mb-6">
                Eu ganhei a ação principal. E ainda assim, quase 3 anos depois, continuo sem receber.
              </p>
            </AnimatedSection>

            <AnimatedSection delay={100}>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-10">
                Antes mesmo da vitória, eu já tinha investido mais de R$ 20 mil com advogado,
                cartório e despesas do processo. Os danos morais não foram reconhecidos. E, por isso,
                ainda houve condenação em sucumbência para o advogado da outra parte. A cobrança
                veio antes do recebimento da própria comissão.
              </p>
            </AnimatedSection>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <InjusticeCard icon={CheckCircle2} text="Ganhei a ação principal" delay={200} />
              <InjusticeCard icon={Ban} text="Ainda não recebi" delay={300} />
              <InjusticeCard icon={CreditCard} text="Tive contas bloqueadas" delay={400} />
              <InjusticeCard icon={AlertTriangle} text="Tive que pagar antes de receber" delay={500} />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ 7. VIRADA / INSIGHT ═══════════════════ */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <AnimatedSection>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-foreground mb-6">
                Foi nesse momento que nasceu uma convicção.
              </h2>
            </AnimatedSection>

            <AnimatedSection delay={100}>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto">
                O corretor não deveria depender de prints, áudios, cartório e anos de processo
                para tentar defender sua comissão. O mercado precisava de uma ferramenta
                profissional, simples e preventiva.
              </p>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 md:p-10">
                <p className="text-xl md:text-2xl lg:text-3xl font-display font-bold text-foreground leading-snug">
                  "O problema não era apenas provar depois.{' '}
                  <span className="text-primary">O problema era não prevenir antes.</span>"
                </p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ═══════════════════ 8. ORIGEM DO PRODUTO ═══════════════════ */}
      <section className="py-20 md:py-28 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <AnimatedSection>
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                  <Zap className="h-4 w-4" />
                  A Solução
                </span>
              </AnimatedSection>

              <AnimatedSection delay={100}>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-foreground mb-4">
                  Foi assim que uma dor real se transformou no{' '}
                  <span className="text-primary">Visita Prova.</span>
                </h2>
              </AnimatedSection>

              <AnimatedSection delay={150}>
                <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                  Depois de procurar soluções no mercado e não encontrar nada que resolvesse esse
                  problema da forma certa, nasceu o Visita Prova: uma ferramenta criada para
                  registrar visitas de forma rápida, prática e profissional, diretamente pelo WhatsApp.
                </p>
              </AnimatedSection>
            </div>

            <AnimatedSection delay={175}>
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 md:p-8 text-center mb-8">
                <p className="text-lg md:text-xl font-display font-semibold text-foreground">
                  "O corretor não deveria descobrir tarde demais que trabalhou sem proteção."
                </p>
              </div>
            </AnimatedSection>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              <BenefitCard icon={Zap} title="Registro simples e rápido" description="Crie registros de visita em segundos, direto pelo celular, sem burocracia." delay={200} />
              <BenefitCard icon={Award} title="Mais profissionalismo" description="Transmita seriedade ao comprador e proprietário desde o primeiro contato." delay={250} />
              <BenefitCard icon={FileText} title="Fortalece a formalização" description="Documente cada visita de forma organizada e com validade comprobatória." delay={300} />
              <BenefitCard icon={Shield} title="Redução de risco" description="Minimize o risco de conflitos com registros claros e acessíveis." delay={350} />
              <BenefitCard icon={Lock} title="Prevenção antes do problema" description="Atue antes que o problema aconteça, não depois." delay={400} />
              <BenefitCard icon={Heart} title="Valorização do corretor" description="Mostre que o trabalho do corretor é sério e merece respeito." delay={450} />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ 9. COMPARATIVO ═══════════════════ */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <AnimatedSection>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-foreground mb-4">
                  O Visita Prova não age só no pós.{' '}
                  <span className="text-primary">Ele atua antes.</span>
                </h2>
              </AnimatedSection>

              <AnimatedSection delay={100}>
                <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                  Quando comprador e proprietário formalizam a visita de forma simples, rápida e
                  profissional, isso aumenta o respeito pelo processo, reduz o espaço para má-fé
                  e fortalece a posição do corretor.
                </p>
              </AnimatedSection>
            </div>

            <AnimatedSection delay={200}>
              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                <ComparisonColumn
                  title="Sem formalização"
                  variant="negative"
                  items={[
                    'Visita informal, sem qualquer registro',
                    'Dependência total da boa-fé',
                    'Falta de registro profissional',
                    'Mais vulnerabilidade para o corretor',
                    'Mais risco de conflito e perda de comissão',
                  ]}
                />
                <ComparisonColumn
                  title="Com Visita Prova"
                  variant="positive"
                  items={[
                    'Visita formalizada com registro digital',
                    'Mais profissionalismo no atendimento',
                    'Mais prevenção e proteção',
                    'Mais clareza para todas as partes',
                    'Mais segurança para o corretor',
                    'Mais respeito pelo trabalho',
                  ]}
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ═══════════════════ 10. PROPÓSITO ═══════════════════ */}
      <section className="py-20 md:py-28 bg-foreground/[0.03]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <AnimatedSection>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-foreground mb-6">
                Mais do que uma ferramenta, uma forma de{' '}
                <span className="text-primary">valorizar o corretor.</span>
              </h2>
            </AnimatedSection>

            <AnimatedSection delay={100}>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto">
                O Visita Prova ajuda a educar comprador, vendedor e corretor desde a visita. Ele
                fortalece o processo, profissionaliza o atendimento e mostra que o trabalho do
                corretor precisa ser levado a sério.
              </p>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 max-w-xl mx-auto">
                <p className="text-xl md:text-2xl font-display font-bold text-foreground italic">
                  "Eu transformei uma dor real em{' '}
                  <span className="text-primary">uma solução real.</span>"
                </p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ═══════════════════ 11. PROVA SOCIAL ═══════════════════ */}
      <DepoimentosSection />

      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <AnimatedSection>
              <h3 className="text-xl md:text-2xl font-display font-bold text-foreground mb-2">
                Hoje, corretores e imobiliárias já usam o Visita Prova
              </h3>
              <p className="text-muted-foreground">
                para trabalhar com mais segurança e profissionalismo.
              </p>
            </AnimatedSection>
          </div>

          {/* Placeholder for future metrics/logos */}
          <AnimatedSection delay={100}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
              {[
                { value: '—', label: 'Corretores ativos' },
                { value: '—', label: 'Visitas registradas' },
                { value: '—', label: 'Imobiliárias' },
                { value: '—', label: 'Cidades' },
              ].map((m, i) => (
                <div key={i} className="text-center">
                  <p className="text-2xl md:text-3xl font-display font-bold text-primary">{m.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════ 12. CTA FINAL ═══════════════════ */}
      <section className="py-20 md:py-28 gradient-primary text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <AnimatedSection>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold mb-6 text-white">
                Se uma visita mal formalizada pode virar anos de dor, o momento de se proteger é antes.
              </h2>
            </AnimatedSection>

            <AnimatedSection delay={100}>
              <p className="text-base md:text-lg text-white/80 mb-10 max-w-xl mx-auto">
                Não espere o problema acontecer para correr atrás de provas improvisadas. Profissionalize sua visita,
                reduza riscos e fortaleça seu trabalho desde o início.
              </p>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" variant="secondary" asChild className="text-base font-semibold">
                  <Link to="/registro-autonomo">
                    Quero começar a usar o Visita Prova
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-base border-white/30 text-white hover:bg-white/10 hover:text-white">
                  <a href="https://wa.me/5515998459830" target="_blank" rel="noopener noreferrer">
                    Falar com a equipe
                  </a>
                </Button>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={300}>
              <p className="mt-12 text-sm text-white/60 italic max-w-lg mx-auto">
                "O Visita Prova nasceu porque eu aprendi da pior forma que confiar apenas na boa-fé
                pode custar caro demais ao corretor."
              </p>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ═══════════════════ 13. FOOTER PREMIUM ═══════════════════ */}
      <footer className="bg-foreground text-background py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <LogoIcon size={36} />
                <span className="font-display font-bold text-lg text-background">Visita Prova</span>
              </div>
              <p className="text-sm text-background/60 leading-relaxed">
                Registro de intermediação imobiliária.
                Mais segurança, mais profissionalismo.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-display font-semibold text-sm text-background/80 mb-4 uppercase tracking-wider">Produto</h4>
              <ul className="space-y-2.5">
                <li><Link to="/funcionalidades" className="text-sm text-background/60 hover:text-background transition-colors">Funcionalidades</Link></li>
                <li><Link to="/como-funciona" className="text-sm text-background/60 hover:text-background transition-colors">Como funciona</Link></li>
                <li><Link to="/para-imobiliarias" className="text-sm text-background/60 hover:text-background transition-colors">Para imobiliárias</Link></li>
                <li><Link to="/registro-autonomo" className="text-sm text-background/60 hover:text-background transition-colors">Criar conta</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-display font-semibold text-sm text-background/80 mb-4 uppercase tracking-wider">Institucional</h4>
              <ul className="space-y-2.5">
                <li><Link to="/sobre" className="text-sm text-background/60 hover:text-background transition-colors">Sobre nós</Link></li>
                <li><Link to="/termos-de-uso" className="text-sm text-background/60 hover:text-background transition-colors">Termos de uso</Link></li>
                <li><Link to="/politica-privacidade" className="text-sm text-background/60 hover:text-background transition-colors">Política de privacidade</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-display font-semibold text-sm text-background/80 mb-4 uppercase tracking-wider">Contato</h4>
              <ul className="space-y-2.5">
                <li>
                  <a href="https://wa.me/5515998459830" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-background/60 hover:text-background transition-colors">
                    <Phone className="h-4 w-4" /> WhatsApp
                  </a>
                </li>
                <li>
                  <a href="mailto:contato@visitaprova.com.br" className="flex items-center gap-2 text-sm text-background/60 hover:text-background transition-colors">
                    <Mail className="h-4 w-4" /> E-mail
                  </a>
                </li>
                <li>
                  <a href="https://instagram.com/visitaprova" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-background/60 hover:text-background transition-colors">
                    <Instagram className="h-4 w-4" /> Instagram
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-background/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-background/40">
              © {new Date().getFullYear()} Visita Prova. Todos os direitos reservados.
            </p>
            <p className="text-xs text-background/40">
              Feito com propósito, por quem vive o mercado imobiliário.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
