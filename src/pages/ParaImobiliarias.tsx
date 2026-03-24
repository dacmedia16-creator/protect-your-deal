import { useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";
import AnimatedSection from "@/components/AnimatedSection";
import { LogoIcon } from "@/components/LogoIcon";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Building,
  Users,
  Shield,
  ArrowLeft,
  AlertTriangle,
  LayoutDashboard,
  BarChart3,
  UsersRound,
  ClipboardCheck,
  CheckCircle2,
} from "lucide-react";

const problemas = [
  {
    icon: AlertTriangle,
    titulo: "Corretor sai e leva os clientes",
    texto: "Sem registro digital, quando um corretor deixa a imobiliária, ele leva consigo todo o relacionamento e histórico com os clientes.",
  },
  {
    icon: Shield,
    titulo: "Sem prova de quem atendeu",
    texto: "Disputas de comissão acontecem porque não há registro formal de qual corretor intermediou a visita.",
  },
  {
    icon: ClipboardCheck,
    titulo: "Visitas sem rastreabilidade",
    texto: "Visitas feitas sem documentação se tornam impossíveis de comprovar judicialmente.",
  },
];

const funcionalidades = [
  {
    icon: LayoutDashboard,
    titulo: "Dashboard da equipe",
    texto: "Visão completa de todas as visitas, fichas e clientes atendidos pela sua equipe em tempo real.",
  },
  {
    icon: BarChart3,
    titulo: "Relatórios por corretor",
    texto: "Acompanhe a performance individual de cada corretor com relatórios detalhados.",
  },
  {
    icon: UsersRound,
    titulo: "Gestão de equipes",
    texto: "Organize seus corretores em equipes, defina líderes e controle permissões de acesso.",
  },
  {
    icon: ClipboardCheck,
    titulo: "Pesquisa de satisfação",
    texto: "Envie pesquisas pós-visita automaticamente e acompanhe a qualidade do atendimento.",
  },
];

const passos = [
  { numero: "1", titulo: "Cadastre sua imobiliária", texto: "Crie sua conta em menos de 2 minutos." },
  { numero: "2", titulo: "Convide seus corretores", texto: "Adicione sua equipe com convites por e-mail." },
  { numero: "3", titulo: "Registre cada visita", texto: "Seus corretores documentam visitas com confirmação OTP." },
  { numero: "4", titulo: "Tenha controle total", texto: "Acompanhe tudo pelo dashboard da imobiliária." },
];

const ParaImobiliarias = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F172A] to-[#1E3A5F] text-white">
      <SEOHead
        title="Para Imobiliárias | VisitaProva"
        description="Gestão completa e segurança jurídica para sua imobiliária. Controle em tempo real da equipe, proteção do histórico de visitas e prova de intermediação."
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
            <Building className="w-5 h-5 text-[#60A5FA]" />
            <span className="text-[#60A5FA] font-medium text-sm">Para Imobiliárias</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            GESTÃO COMPLETA E
            <br />
            <span className="text-[#60A5FA]">SEGURANÇA JURÍDICA</span>
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-8">
            Tenha controle total da sua equipe de corretores. O histórico de visitas e a prova de intermediação{" "}
            <span className="text-[#60A5FA] font-semibold">ficam com a empresa</span>.
          </p>
          <Link to="/registro/tipo">
            <Button size="lg" className="bg-[#60A5FA] hover:bg-[#60A5FA]/90 text-white text-lg px-8 py-6 rounded-xl gap-2">
              <Building className="w-5 h-5" />
              Cadastrar minha Imobiliária
            </Button>
          </Link>
        </section>
      </AnimatedSection>

      {/* Problemas */}
      <AnimatedSection>
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            Os riscos de <span className="text-red-400">não ter controle digital</span>
          </h2>
          <p className="text-white/50 text-center mb-10 max-w-xl mx-auto">
            Sem um sistema de registro, sua imobiliária fica vulnerável.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {problemas.map((item) => (
              <div key={item.titulo} className="bg-white/5 backdrop-blur border border-red-500/20 rounded-2xl p-8 text-center">
                <item.icon className="w-10 h-10 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">{item.titulo}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{item.texto}</p>
              </div>
            ))}
          </div>
        </section>
      </AnimatedSection>

      {/* Argumentos principais */}
      <AnimatedSection>
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            A <span className="text-[#60A5FA]">solução</span> para sua imobiliária
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur border border-[#60A5FA]/30 rounded-2xl p-8">
              <Users className="w-10 h-10 text-[#60A5FA] mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Controle em tempo real</h3>
              <p className="text-white/60 leading-relaxed">
                Tenha controle em tempo real de quais clientes sua equipe está atendendo. Saiba quem visitou o quê, quando e com quem.
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur border border-green-400/30 rounded-2xl p-8">
              <Shield className="w-10 h-10 text-green-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Proteção do histórico</h3>
              <p className="text-white/60 leading-relaxed">
                Fim do roubo de clientes: se um corretor sair da imobiliária, o histórico de visitas e a prova de intermediação ficam com a empresa.
              </p>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Funcionalidades */}
      <AnimatedSection>
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            Ferramentas para <span className="text-[#60A5FA]">gestão completa</span>
          </h2>
          <p className="text-white/50 text-center mb-10 max-w-xl mx-auto">
            Tudo que sua imobiliária precisa em um só lugar.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {funcionalidades.map((item) => (
              <div key={item.titulo} className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 flex gap-4">
                <div className="bg-[#60A5FA]/10 rounded-xl p-3 h-fit">
                  <item.icon className="w-6 h-6 text-[#60A5FA]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{item.titulo}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{item.texto}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </AnimatedSection>

      {/* Como funciona */}
      <AnimatedSection>
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            Como <span className="text-[#60A5FA]">funciona</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {passos.map((passo) => (
              <div key={passo.numero} className="text-center">
                <div className="w-12 h-12 rounded-full bg-[#60A5FA]/20 border border-[#60A5FA]/40 flex items-center justify-center mx-auto mb-4">
                  <span className="text-[#60A5FA] font-extrabold text-lg">{passo.numero}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{passo.titulo}</h3>
                <p className="text-white/60 text-sm">{passo.texto}</p>
              </div>
            ))}
          </div>
        </section>
      </AnimatedSection>

      {/* CTA Final */}
      <AnimatedSection>
        <section className="container mx-auto px-4 py-20 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            CADASTRE SUA <span className="text-[#60A5FA]">IMOBILIÁRIA</span>
          </h2>
          <p className="text-white/60 max-w-lg mx-auto mb-8">
            Comece agora a proteger o patrimônio da sua empresa e ter controle total da sua equipe.
          </p>
          <Link to="/registro/tipo">
            <Button size="lg" className="bg-[#60A5FA] hover:bg-[#60A5FA]/90 text-white text-lg px-10 py-7 rounded-xl gap-3 shadow-lg shadow-[#60A5FA]/20">
              <Building className="w-6 h-6" />
              Cadastrar minha Imobiliária
            </Button>
          </Link>

          <div className="mt-12 flex flex-col items-center gap-3">
            <LogoIcon className="w-10 h-10" />
            <p className="text-white/40 text-sm">www.visitaprova.com.br</p>
          </div>
        </section>
      </AnimatedSection>
    </div>
  );
};

export default ParaImobiliarias;
